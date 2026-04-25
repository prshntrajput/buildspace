"use server";

import { getUser } from "@/lib/auth/server";
import { handleError } from "@/lib/errors";
import { teamService } from "./services/team.service";
import { TeamRoleCreateInput, ApplicationSubmitInput, ApplicationDecideInput } from "./schemas";
import { checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function openRoleAction(raw: unknown) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const input = TeamRoleCreateInput.parse(raw);
    const role = await teamService.openRole(user.id, input);
    return { ok: true as const, data: role };
  } catch (e) {
    return handleError(e);
  }
}

export async function submitApplicationAction(raw: unknown) {
  try {
    const user = await getUser();
    const input = ApplicationSubmitInput.parse(raw);
    const application = await teamService.submitApplication(user.id, input);
    return { ok: true as const, data: application };
  } catch (e) {
    return handleError(e);
  }
}

export async function decideApplicationAction(applicationId: string, raw: unknown) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const input = ApplicationDecideInput.parse(raw);
    const application = await teamService.decideApplication(applicationId, user.id, input);
    return { ok: true as const, data: application };
  } catch (e) {
    return handleError(e);
  }
}
