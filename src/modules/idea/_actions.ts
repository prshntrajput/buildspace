"use server";

import { getUser } from "@/lib/auth/server";
import { handleError } from "@/lib/errors";
import { ideaService } from "./services/idea.service";
import { IdeaCreateInput, IdeaUpdateInput, IdeaSearchInput } from "./schemas";
import { checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function createIdeaAction(raw: unknown) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const input = IdeaCreateInput.parse(raw);
    const idea = await ideaService.create(user.id, input);
    return { ok: true as const, data: idea };
  } catch (e) {
    return handleError(e);
  }
}

export async function publishIdeaAction(ideaId: string) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const idea = await ideaService.publish(ideaId, user.id);
    return { ok: true as const, data: idea };
  } catch (e) {
    return handleError(e);
  }
}

export async function updateIdeaAction(ideaId: string, raw: unknown) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const input = IdeaUpdateInput.parse(raw);
    const idea = await ideaService.update(ideaId, user.id, input);
    return { ok: true as const, data: idea };
  } catch (e) {
    return handleError(e);
  }
}

export async function upvoteIdeaAction(ideaId: string) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const result = await ideaService.upvote(ideaId, user.id);
    return { ok: true as const, data: result };
  } catch (e) {
    return handleError(e);
  }
}

export async function deleteIdeaAction(ideaId: string) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    await ideaService.delete(ideaId, user.id);
    return { ok: true as const };
  } catch (e) {
    return handleError(e);
  }
}

export async function forkIdeaAction(ideaId: string) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const idea = await ideaService.fork(ideaId, user.id);
    return { ok: true as const, data: idea };
  } catch (e) {
    return handleError(e);
  }
}
