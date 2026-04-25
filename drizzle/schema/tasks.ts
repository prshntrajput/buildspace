import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { taskStatusEnum } from "./enums";
import { buildRooms } from "./products";
import { users } from "./users";

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buildRoomId: uuid("build_room_id")
      .notNull()
      .references(() => buildRooms.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("todo"),
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    estimateMinutes: integer("estimate_minutes"),
    proofUrl: text("proof_url"),
    artifactId: uuid("artifact_id"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    milestoneId: uuid("milestone_id"),
    weight: integer("weight").notNull().default(1),
    createdById: uuid("created_by_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tasks_build_room_status_due_idx").on(t.buildRoomId, t.status, t.dueDate),
    index("tasks_assignee_id_idx").on(t.assigneeId),
    index("tasks_milestone_id_idx").on(t.milestoneId),
  ]
);

export const updates = pgTable(
  "updates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buildRoomId: uuid("build_room_id")
      .notNull()
      .references(() => buildRooms.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: jsonb("body").notNull(),
    weekNumber: integer("week_number").notNull(),
    year: integer("year").notNull(),
    summary: text("summary"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("updates_build_room_id_idx").on(t.buildRoomId),
    index("updates_author_id_idx").on(t.authorId),
  ]
);

export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buildRoomId: uuid("build_room_id")
      .notNull()
      .references(() => buildRooms.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    targetDate: timestamp("target_date", { withTimezone: true }),
    achievedAt: timestamp("achieved_at", { withTimezone: true }),
    verifiedBy: uuid("verified_by").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("milestones_build_room_id_idx").on(t.buildRoomId),
  ]
);
