"use server";

import { z } from "zod";
import { getUser } from "@/lib/auth/server";
import { handleError } from "@/lib/errors";
import { commentService } from "./services/comment.service";
import { revalidatePath } from "next/cache";

const CreateCommentInput = z.object({
  parentType: z.enum(["idea", "product", "update", "milestone"]),
  parentId: z.string().uuid(),
  body: z.string().min(1).max(2000),
  parentCommentId: z.string().uuid().optional(),
});

export async function createCommentAction(raw: unknown) {
  try {
    const user = await getUser();
    const input = CreateCommentInput.parse(raw);
    const comment = await commentService.create(user.id, {
      parentType: input.parentType,
      parentId: input.parentId,
      body: input.body,
      ...(input.parentCommentId !== undefined ? { parentCommentId: input.parentCommentId } : {}),
    });
    revalidatePath("/ideas/[slug]", "page");
    revalidatePath("/products/[slug]", "page");
    return { ok: true as const, data: comment };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteCommentAction(commentId: string) {
  try {
    const user = await getUser();
    await commentService.delete(commentId, user.id);
    revalidatePath("/ideas/[slug]", "page");
    revalidatePath("/products/[slug]", "page");
    return { ok: true as const };
  } catch (e) {
    return handleError(e);
  }
}
