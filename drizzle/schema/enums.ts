import { pgEnum } from "drizzle-orm/pg-core";

export const systemRoleEnum = pgEnum("system_role", ["user", "mod", "admin"]);
export const teamRoleEnum = pgEnum("team_role", ["owner", "maintainer", "member"]);
export const visibilityEnum = pgEnum("visibility", ["public", "unlisted", "private"]);
export const productStageEnum = pgEnum("product_stage", [
  "ideation",
  "building",
  "shipped",
  "maintained",
  "archived",
]);
export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
  "cancelled",
]);
export const availabilityEnum = pgEnum("availability_status", [
  "full_time",
  "part_time",
  "weekends",
  "unavailable",
]);
export const notificationKindEnum = pgEnum("notification_kind", [
  "mention",
  "application_received",
  "application_decided",
  "task_assigned",
  "task_due_soon",
  "update_posted_in_followed",
  "backing_received",
  "streak_broken",
  "weekly_digest",
]);
export const parentTypeEnum = pgEnum("parent_type", [
  "idea",
  "product",
  "update",
  "milestone",
]);
export const rankBucketEnum = pgEnum("rank_bucket", [
  "bronze",
  "silver",
  "gold",
  "platinum",
]);
export const activityKindEnum = pgEnum("activity_kind", [
  "task_completed",
  "update_posted",
  "milestone_shipped",
  "commit_linked",
  "peer_endorsed",
  "backer_received",
  "inactivity_penalty",
  "abandoned_penalty",
]);
export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "accepted",
  "rejected",
  "withdrawn",
]);
export const roleStatusEnum = pgEnum("role_status", ["open", "filled", "closed"]);
export const ideaStatusEnum = pgEnum("idea_status", ["draft", "published", "archived"]);
export const reportReasonEnum = pgEnum("report_reason", [
  "spam",
  "harassment",
  "plagiarism",
  "misinformation",
  "other",
]);
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "resolved",
  "dismissed",
]);
