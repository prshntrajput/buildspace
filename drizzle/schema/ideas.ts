import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/pg-core";
import { sql, isNull } from "drizzle-orm";
import { visibilityEnum, ideaStatusEnum } from "./enums";
import { users } from "./users";

// pgvector type — not available in drizzle-orm 0.45.2 via standard import
const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) {
    const dim = (config as { dimensions?: number } | undefined)?.dimensions ?? 768;
    return `vector(${dim})`;
  },
  fromDriver(value: string) {
    return value
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map(Number);
  },
  toDriver(value: number[]) {
    return `[${value.join(",")}]`;
  },
});

export const ideas = pgTable(
  "ideas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    problem: text("problem").notNull(),
    targetUser: text("target_user").notNull(),
    solution: text("solution").notNull(),
    mvpPlan: text("mvp_plan"),
    tags: text("tags").array().notNull().default([]),
    status: ideaStatusEnum("status").notNull().default("draft"),
    visibility: visibilityEnum("visibility").notNull().default("public"),
    upvoteCount: integer("upvote_count").notNull().default(0),
    saveCount: integer("save_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    forkOfId: uuid("fork_of_id"),
    aiReview: jsonb("ai_review"),
    duplicatesDetected: jsonb("duplicates_detected"),
    searchVector: text("search_vector"),
    embedding: vector("embedding", { dimensions: 768 } as { dimensions: number }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("ideas_slug_idx").on(t.slug),
    index("ideas_author_id_idx").on(t.authorId),
    index("ideas_status_idx").on(t.status),
    index("ideas_tags_idx").using("gin", sql`${t.tags}`),
    index("ideas_created_at_idx").on(t.createdAt),
    // Composite partial index for the main feed query:
    // WHERE status='published' AND visibility='public' AND deleted_at IS NULL
    // ORDER BY created_at DESC
    index("ideas_published_feed_idx")
      .on(t.status, t.visibility, t.createdAt)
      .where(isNull(t.deletedAt)),
    // HNSW vector index for cosine similarity search (pgvector >=0.5)
    index("ideas_embedding_hnsw_idx").using("hnsw", sql`embedding vector_cosine_ops`),
  ]
);

export const ideaUpvotes = pgTable(
  "idea_upvotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaId: uuid("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("idea_upvotes_unique").on(t.ideaId, t.userId),
    index("idea_upvotes_idea_id_idx").on(t.ideaId),
  ]
);

export const ideaSaves = pgTable(
  "idea_saves",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaId: uuid("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("idea_saves_unique").on(t.ideaId, t.userId),
  ]
);
