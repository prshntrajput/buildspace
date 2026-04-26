import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql, isNull } from "drizzle-orm";
import { visibilityEnum, productStageEnum } from "./enums";
import { users } from "./users";
import { ideas } from "./ideas";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ideaId: uuid("idea_id").references(() => ideas.id, { onDelete: "set null" }),
    stage: productStageEnum("stage").notNull().default("building"),
    techStack: text("tech_stack").array().notNull().default([]),
    demoUrl: text("demo_url"),
    repoUrl: text("repo_url"),
    bannerUrl: text("banner_url"),
    metrics: jsonb("metrics").notNull().default({}),
    visibility: visibilityEnum("visibility").notNull().default("public"),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    index("products_owner_id_idx").on(t.ownerId),
    index("products_stage_updated_idx").on(t.stage, t.updatedAt),
    index("products_last_activity_idx").on(t.lastActivityAt),
    // Composite partial index for the public product feed:
    // WHERE visibility='public' AND deleted_at IS NULL ORDER BY updated_at DESC
    index("products_public_updated_idx")
      .on(t.visibility, t.updatedAt)
      .where(isNull(t.deletedAt)),
    // Composite partial index for the inactivity archive cron:
    // WHERE stage='building' AND last_activity_at < threshold AND deleted_at IS NULL
    index("products_stage_activity_idx")
      .on(t.stage, t.lastActivityAt)
      .where(isNull(t.deletedAt)),
  ]
);

export const buildRooms = pgTable(
  "build_rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .unique()
      .references(() => products.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    progressPct: integer("progress_pct").notNull().default(0),
    executionMode: text("execution_mode").notNull().default("false"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("build_rooms_product_id_idx").on(t.productId),
  ]
);
