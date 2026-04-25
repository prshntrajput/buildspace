"use server";

import { getUser } from "@/lib/auth/server";
import { userRepository } from "@/modules/user/repositories/user.repository";
import { moderationService } from "./services/moderation.service";
import { SubmitReportSchema, ResolveReportSchema } from "./schemas";
import { handleError } from "@/lib/errors";
import type { ModerationReport } from "./types";
import type { ActionResult } from "@/lib/errors";

export async function submitReportAction(
  raw: unknown
): Promise<ActionResult<ModerationReport>> {
  try {
    const authUser = await getUser();
    const input = SubmitReportSchema.parse(raw);
    const report = await moderationService.submitReport(authUser.id, input);
    return { ok: true, data: report };
  } catch (e) {
    return handleError(e);
  }
}

export async function resolveReportAction(
  raw: unknown
): Promise<ActionResult<ModerationReport>> {
  try {
    const authUser = await getUser();
    const user = await userRepository.findById(authUser.id);
    if (!user) return { ok: false, code: "NOT_FOUND", message: "User not found" };

    const input = ResolveReportSchema.parse(raw);
    const report = await moderationService.resolveReport(authUser.id, user.systemRole, input);
    return { ok: true, data: report };
  } catch (e) {
    return handleError(e);
  }
}
