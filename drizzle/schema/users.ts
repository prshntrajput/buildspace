import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { systemRoleEnum, visibilityEnum, availabilityEnum, rankBucketEnum } from "./enums";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    handle: text("handle").notNull().unique(),
    email: text("email").notNull().unique(),
    displayName: text("display_name").notNull().default(""),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    skills: text("skills").array().notNull().default([]),
    availability: availabilityEnum("availability").notNull().default("unavailable"),
    timezone: text("timezone").notNull().default("UTC"),
    systemRole: systemRoleEnum("system_role").notNull().default("user"),
    currentScore: numeric("current_score", { precision: 10, scale: 4 })
      .notNull()
      .default("0"),
    scoreDelta7d: numeric("score_delta_7d", { precision: 10, scale: 4 })
      .notNull()
      .default("0"),
    scoreDelta30d: numeric("score_delta_30d", { precision: 10, scale: 4 })
      .notNull()
      .default("0"),
    rankBucket: rankBucketEnum("rank_bucket").notNull().default("bronze"),
    onboardingState: jsonb("onboarding_state")
      .notNull()
      .default({ role_selected: false, skills_added: false, goal_set: false }),
    goal: text("goal"),
    isShadowBanned: boolean("is_shadow_banned").notNull().default(false),
    onBreakUntil: timestamp("on_break_until", { withTimezone: true }),
    githubUsername: text("github_username"),
    githubAccessToken: text("github_access_token"),
    xUsername: text("x_username"),
    linkedinUrl: text("linkedin_url"),
    websiteUrl: text("website_url"),
    notificationPreferences: jsonb("notification_preferences").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("users_handle_idx").on(t.handle),
    uniqueIndex("users_email_idx").on(t.email),
    index("users_rank_bucket_idx").on(t.rankBucket),
  ]
);
