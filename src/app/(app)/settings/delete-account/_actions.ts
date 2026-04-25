"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser, createSupabaseServiceClient } from "@/lib/auth/server";
import { handleError, ValidationError } from "@/lib/errors";
import { users } from "../../../../../drizzle/schema";

const Input = z.object({
  confirmHandle: z.string().min(1),
});

export async function deleteAccountAction(
  raw: unknown
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  try {
    const authUser = await getUser();
    const { confirmHandle } = Input.parse(raw);

    // Look up current handle to validate confirmation
    const rows = await db
      .select({ handle: users.handle })
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    const user = rows[0];
    if (!user) return { ok: false, code: "NOT_FOUND", message: "User not found" };

    if (confirmHandle !== user.handle) {
      throw new ValidationError("Handle does not match — please type your exact handle to confirm");
    }

    // Soft delete the user row
    await db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, authUser.id));

    // Hard delete from Supabase Auth (service role required)
    const serviceClient = await createSupabaseServiceClient();
    await serviceClient.auth.admin.deleteUser(authUser.id);

    return { ok: true };
  } catch (e) {
    return handleError(e);
  }
}
