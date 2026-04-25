"use server";

import { getUser } from "@/lib/auth/server";
import { handleError } from "@/lib/errors";
import { executionService } from "./services/execution.service";
import { checkRateLimit, rateLimits } from "@/lib/ratelimit";
import { revalidatePath } from "next/cache";

export async function startExecutionModeAction(productId: string, buildRoomId: string) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    
    await executionService.start(productId, user.id);
    
    revalidatePath(`/build-room/${buildRoomId}`);
    return { ok: true as const };
  } catch (e) {
    return handleError(e);
  }
}
