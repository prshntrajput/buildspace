"use server";

import { getUser } from "@/lib/auth/server";
import { handleError } from "@/lib/errors";
import { buildRoomService } from "./services/build-room.service";
import {
  TaskCreateInput,
  TaskCompleteInput,
  TaskMoveInput,
  UpdateCreateInput,
  MilestoneCreateInput,
} from "./schemas";
import { checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function createTaskAction(raw: unknown) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const input = TaskCreateInput.parse(raw);
    const task = await buildRoomService.createTask(user.id, input);
    return { ok: true as const, data: task };
  } catch (e) {
    return handleError(e);
  }
}

export async function completeTaskAction(taskId: string, raw: unknown) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const input = TaskCompleteInput.parse(raw);
    const task = await buildRoomService.completeTask(taskId, user.id, input);
    return { ok: true as const, data: task };
  } catch (e) {
    return handleError(e);
  }
}

export async function moveTaskAction(taskId: string, raw: unknown) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const input = TaskMoveInput.parse(raw);
    const task = await buildRoomService.moveTask(taskId, user.id, input);
    return { ok: true as const, data: task };
  } catch (e) {
    return handleError(e);
  }
}

export async function postUpdateAction(raw: unknown) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const input = UpdateCreateInput.parse(raw);
    const update = await buildRoomService.postUpdate(user.id, input);
    return { ok: true as const, data: update };
  } catch (e) {
    return handleError(e);
  }
}

export async function createMilestoneAction(raw: unknown) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const input = MilestoneCreateInput.parse(raw);
    const milestone = await buildRoomService.createMilestone(user.id, input);
    return { ok: true as const, data: milestone };
  } catch (e) {
    return handleError(e);
  }
}

export async function verifyMilestoneAction(milestoneId: string) {
  try {
    const user = await getUser();
    const milestone = await buildRoomService.verifyMilestone(milestoneId, user.id);
    return { ok: true as const, data: milestone };
  } catch (e) {
    return handleError(e);
  }
}
