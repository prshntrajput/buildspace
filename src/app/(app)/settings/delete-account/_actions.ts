"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser, createSupabaseServiceClient } from "@/lib/auth/server";
import { handleError, ValidationError } from "@/lib/errors";
import {
  users,
  tasks,
  auditLogs,
  moderationReports,
} from "../../../../../drizzle/schema";

const Input = z.object({
  confirmHandle: z.string().min(1),
});

export async function deleteAccountAction(
  raw: unknown
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  try {
    const authUser = await getUser();
    const { confirmHandle } = Input.parse(raw);

    const rows = await db
      .select({ handle: users.handle })
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    const user = rows[0];
    if (!user) return { ok: false, code: "NOT_FOUND", message: "User not found" };

    if (confirmHandle !== user.handle) {
      throw new ValidationError(
        "Handle does not match — please type your exact handle to confirm"
      );
    }

    // Run all DB deletions in a single transaction so it's all-or-nothing.
    await db.transaction(async (tx) => {
      // 1. tasks.created_by_id has no onDelete clause (defaults to RESTRICT).
      //    Null it out so the user row can be deleted.
      //    Tasks inside the user's own products will cascade-delete anyway;
      //    tasks in other people's build rooms just lose the creator reference.
      await tx
        .update(tasks)
        .set({ createdById: null })
        .where(eq(tasks.createdById, authUser.id));

      // 2. audit_logs.actor_id is NOT NULL with no onDelete — must delete rows.
      await tx.delete(auditLogs).where(eq(auditLogs.actorId, authUser.id));

      // 3. moderation_reports.resolved_by_id is nullable with no onDelete — null it out.
      await tx
        .update(moderationReports)
        .set({ resolvedById: null })
        .where(eq(moderationReports.resolvedById, authUser.id));

      // 4. Hard-delete the user row.
      //    Postgres FK cascades take care of everything else:
      //      • ideas → idea_upvotes, idea_saves
      //      • products → build_rooms → tasks, updates, milestones
      //                → teams → team_roles → applications
      //                        → team_memberships
      //      • notifications, activity_logs, score_snapshots
      //      • endorsements (as endorser and endorsee)
      //      • team_memberships (direct), applications (as applicant)
      //      • comments, reactions, idea_upvotes, idea_saves
      //      • moderation_reports (as reporter)
      //      • updates (as author)
      //      • ai_calls → set null (kept for billing history)
      //      • tasks.assignee_id → set null (already handled by schema)
      await tx.delete(users).where(eq(users.id, authUser.id));
    });

    // 5. Remove the Supabase Auth record (service-role, outside the DB transaction).
    //    This must come after the DB row is gone so there is no orphaned auth user.
    const serviceClient = await createSupabaseServiceClient();
    await serviceClient.auth.admin.deleteUser(authUser.id);

    return { ok: true };
  } catch (e) {
    return handleError(e);
  }
}
