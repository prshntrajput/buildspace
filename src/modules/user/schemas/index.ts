import { z } from "zod";

export const UserUpdateInput = z.object({
  displayName: z.string().min(2).max(60).optional(),
  bio: z.string().max(500).optional(),
  skills: z.array(z.string()).max(20).optional(),
  availability: z
    .enum(["full_time", "part_time", "weekends", "unavailable"])
    .optional(),
  timezone: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  xUsername: z.string().max(50).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  avatarUrl: z.string().url().optional(),
});

export const OnboardingRoleInput = z.object({
  roles: z.array(z.enum(["founder", "builder", "backer"])).min(1),
});

export const OnboardingSkillsInput = z.object({
  skills: z.array(z.string().min(1).max(50)).min(1).max(20),
  availability: z.enum(["full_time", "part_time", "weekends", "unavailable"]),
  timezone: z.string().min(1),
});

export const OnboardingGoalInput = z.object({
  goal: z.enum(["build_idea", "join_team", "explore"]),
});

export type UserUpdateInputType = z.infer<typeof UserUpdateInput>;
export type OnboardingRoleInputType = z.infer<typeof OnboardingRoleInput>;
export type OnboardingSkillsInputType = z.infer<typeof OnboardingSkillsInput>;
export type OnboardingGoalInputType = z.infer<typeof OnboardingGoalInput>;
