"use server";

import { z } from "zod";
import { getUser } from "@/lib/auth/server";
import { handleError } from "@/lib/errors";
import { userService } from "./services/user.service";
import {
  UserUpdateInput,
  OnboardingRoleInput,
  OnboardingSkillsInput,
  OnboardingGoalInput,
} from "./schemas";
import { checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function updateProfileAction(raw: unknown) {
  try {
    const user = await getUser();
    const input = UserUpdateInput.parse(raw);
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const updated = await userService.updateProfile(user.id, input);
    return { ok: true as const, data: updated };
  } catch (e) {
    return handleError(e);
  }
}

export async function setOnboardingRoleAction(raw: unknown) {
  try {
    const user = await getUser();
    const { roles } = OnboardingRoleInput.parse(raw);
    const updated = await userService.setOnboardingRole(user.id, roles);
    return { ok: true as const, data: updated };
  } catch (e) {
    return handleError(e);
  }
}

export async function setOnboardingSkillsAction(raw: unknown) {
  try {
    const user = await getUser();
    const { skills, availability, timezone } = OnboardingSkillsInput.parse(raw);
    const updated = await userService.setOnboardingSkills(user.id, skills, availability, timezone);
    return { ok: true as const, data: updated };
  } catch (e) {
    return handleError(e);
  }
}

export async function completeOnboardingAction(raw: unknown) {
  try {
    const user = await getUser();
    const { goal } = OnboardingGoalInput.parse(raw);
    const updated = await userService.completeOnboarding(user.id, goal);
    return { ok: true as const, data: updated };
  } catch (e) {
    return handleError(e);
  }
}
