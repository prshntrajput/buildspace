import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  numeric,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { activityKindEnum, rankBucketEnum } from "./enums";
import { users } from "./users";
import { products } from "./products";

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    kind: activityKindEnum("kind").notNull(),
    signalWeight: integer("signal_weight").notNull().default(0),
    proofUrl: text("proof_url"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("activity_logs_user_created_idx").on(t.userId, t.createdAt),
    index("activity_logs_product_id_idx").on(t.productId),
    index("activity_logs_kind_idx").on(t.kind),
  ]
);

export const scoreSnapshots = pgTable(
  "score_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: numeric("score", { precision: 10, scale: 4 }).notNull(),
    components: jsonb("components").notNull().default({}),
    rankBucket: rankBucketEnum("rank_bucket").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("score_snapshots_user_computed_idx").on(t.userId, t.computedAt),
  ]
);

export const endorsements = pgTable(
  "endorsements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    endorserId: uuid("endorser_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endorseeId: uuid("endorsee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contextProductId: uuid("context_product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("endorsements_endorsee_id_idx").on(t.endorseeId),
    index("endorsements_endorser_id_idx").on(t.endorserId),
  ]
);
