-- Baseline migration: wraps all existing DDL in IF NOT EXISTS so it is safe
-- to run against a database that was set up before Drizzle migrations were
-- introduced. The only net-new statements are the new indexes at the bottom.

-- Enums (idempotent via DO blocks)
DO $$ BEGIN CREATE TYPE "public"."activity_kind" AS ENUM('task_completed','update_posted','milestone_shipped','commit_linked','peer_endorsed','backer_received','inactivity_penalty','abandoned_penalty'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."application_status" AS ENUM('pending','accepted','rejected','withdrawn'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."availability_status" AS ENUM('full_time','part_time','weekends','unavailable'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."idea_status" AS ENUM('draft','published','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."notification_kind" AS ENUM('mention','application_received','application_decided','task_assigned','task_due_soon','update_posted_in_followed','backing_received','streak_broken','weekly_digest'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."parent_type" AS ENUM('idea','product','update','milestone'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."product_stage" AS ENUM('ideation','building','shipped','maintained','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."rank_bucket" AS ENUM('bronze','silver','gold','platinum'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."report_reason" AS ENUM('spam','harassment','plagiarism','misinformation','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."report_status" AS ENUM('pending','resolved','dismissed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."role_status" AS ENUM('open','filled','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."system_role" AS ENUM('user','mod','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."task_status" AS ENUM('todo','in_progress','done','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."team_role" AS ENUM('owner','maintainer','member'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."visibility" AS ENUM('public','unlisted','private'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint

-- Tables (all IF NOT EXISTS — safe on existing DB)
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"bio" text,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"availability" "availability_status" DEFAULT 'unavailable' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"system_role" "system_role" DEFAULT 'user' NOT NULL,
	"current_score" numeric(10, 4) DEFAULT '0' NOT NULL,
	"score_delta_7d" numeric(10, 4) DEFAULT '0' NOT NULL,
	"score_delta_30d" numeric(10, 4) DEFAULT '0' NOT NULL,
	"rank_bucket" "rank_bucket" DEFAULT 'bronze' NOT NULL,
	"onboarding_state" jsonb DEFAULT '{"role_selected":false,"skills_added":false,"goal_set":false}'::jsonb NOT NULL,
	"goal" text,
	"is_shadow_banned" boolean DEFAULT false NOT NULL,
	"on_break_until" timestamp with time zone,
	"github_username" text,
	"github_access_token" text,
	"x_username" text,
	"linkedin_url" text,
	"website_url" text,
	"notification_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "idea_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "idea_upvotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"author_id" uuid NOT NULL,
	"title" text NOT NULL,
	"problem" text NOT NULL,
	"target_user" text NOT NULL,
	"solution" text NOT NULL,
	"mvp_plan" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"status" "idea_status" DEFAULT 'draft' NOT NULL,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"save_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"fork_of_id" uuid,
	"ai_review" jsonb,
	"duplicates_detected" jsonb,
	"search_vector" text,
	"embedding" vector(768),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "build_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"progress_pct" integer DEFAULT 0 NOT NULL,
	"execution_mode" text DEFAULT 'false' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_id" uuid NOT NULL,
	"idea_id" uuid,
	"stage" "product_stage" DEFAULT 'building' NOT NULL,
	"tech_stack" text[] DEFAULT '{}' NOT NULL,
	"demo_url" text,
	"repo_url" text,
	"banner_url" text,
	"metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"visibility" "visibility" DEFAULT 'public' NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"build_room_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_date" timestamp with time zone,
	"achieved_at" timestamp with time zone,
	"verified_by" uuid[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"build_room_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"assignee_id" uuid,
	"due_date" timestamp with time zone,
	"estimate_minutes" integer,
	"proof_url" text,
	"artifact_id" uuid,
	"completed_at" timestamp with time zone,
	"milestone_id" uuid,
	"weight" integer DEFAULT 1 NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"build_room_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" jsonb NOT NULL,
	"week_number" integer NOT NULL,
	"year" integer NOT NULL,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid,
	"kind" "activity_kind" NOT NULL,
	"signal_weight" integer DEFAULT 0 NOT NULL,
	"proof_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "endorsements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endorser_id" uuid NOT NULL,
	"endorsee_id" uuid NOT NULL,
	"context_product_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "score_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"score" numeric(10, 4) NOT NULL,
	"components" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rank_bucket" "rank_bucket" NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_role_id" uuid NOT NULL,
	"applicant_id" uuid NOT NULL,
	"cover_note" text NOT NULL,
	"links" text[] DEFAULT '{}' NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "team_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"required_skills" text[] DEFAULT '{}' NOT NULL,
	"status" "role_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"open_roles_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_type" "parent_type" NOT NULL,
	"parent_id" uuid NOT NULL,
	"parent_comment_id" uuid,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"agent" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(10, 6) DEFAULT '0' NOT NULL,
	"cached" boolean DEFAULT false NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"success" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "moderation_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"reason" "report_reason" NOT NULL,
	"note" text,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"resolved_by_id" uuid,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Foreign key constraints (idempotent via DO blocks)
DO $$ BEGIN ALTER TABLE "idea_saves" ADD CONSTRAINT "idea_saves_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "idea_saves" ADD CONSTRAINT "idea_saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "idea_upvotes" ADD CONSTRAINT "idea_upvotes_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "idea_upvotes" ADD CONSTRAINT "idea_upvotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "ideas" ADD CONSTRAINT "ideas_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "build_rooms" ADD CONSTRAINT "build_rooms_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "products" ADD CONSTRAINT "products_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "products" ADD CONSTRAINT "products_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "milestones" ADD CONSTRAINT "milestones_build_room_id_build_rooms_id_fk" FOREIGN KEY ("build_room_id") REFERENCES "public"."build_rooms"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "tasks" ADD CONSTRAINT "tasks_build_room_id_build_rooms_id_fk" FOREIGN KEY ("build_room_id") REFERENCES "public"."build_rooms"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "updates" ADD CONSTRAINT "updates_build_room_id_build_rooms_id_fk" FOREIGN KEY ("build_room_id") REFERENCES "public"."build_rooms"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "updates" ADD CONSTRAINT "updates_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_endorser_id_users_id_fk" FOREIGN KEY ("endorser_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_endorsee_id_users_id_fk" FOREIGN KEY ("endorsee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_context_product_id_products_id_fk" FOREIGN KEY ("context_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "score_snapshots" ADD CONSTRAINT "score_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "applications" ADD CONSTRAINT "applications_team_role_id_team_roles_id_fk" FOREIGN KEY ("team_role_id") REFERENCES "public"."team_roles"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "applications" ADD CONSTRAINT "applications_applicant_id_users_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "team_roles" ADD CONSTRAINT "team_roles_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "teams" ADD CONSTRAINT "teams_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "ai_calls" ADD CONSTRAINT "ai_calls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint

-- Existing indexes (all IF NOT EXISTS — no-ops on existing DB)
CREATE UNIQUE INDEX IF NOT EXISTS "users_handle_idx" ON "users" USING btree ("handle");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_rank_bucket_idx" ON "users" USING btree ("rank_bucket");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idea_saves_unique" ON "idea_saves" USING btree ("idea_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idea_upvotes_unique" ON "idea_upvotes" USING btree ("idea_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idea_upvotes_idea_id_idx" ON "idea_upvotes" USING btree ("idea_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ideas_slug_idx" ON "ideas" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ideas_author_id_idx" ON "ideas" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ideas_status_idx" ON "ideas" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ideas_tags_idx" ON "ideas" USING gin ("tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ideas_created_at_idx" ON "ideas" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "build_rooms_product_id_idx" ON "build_rooms" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_owner_id_idx" ON "products" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_stage_updated_idx" ON "products" USING btree ("stage","updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_last_activity_idx" ON "products" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "milestones_build_room_id_idx" ON "milestones" USING btree ("build_room_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_build_room_status_due_idx" ON "tasks" USING btree ("build_room_id","status","due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_assignee_id_idx" ON "tasks" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_milestone_id_idx" ON "tasks" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "updates_build_room_id_idx" ON "updates" USING btree ("build_room_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "updates_author_id_idx" ON "updates" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_user_created_idx" ON "activity_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_product_id_idx" ON "activity_logs" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_logs_kind_idx" ON "activity_logs" USING btree ("kind");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "endorsements_endorsee_id_idx" ON "endorsements" USING btree ("endorsee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "endorsements_endorser_id_idx" ON "endorsements" USING btree ("endorser_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "score_snapshots_user_computed_idx" ON "score_snapshots" USING btree ("user_id","computed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_team_role_status_idx" ON "applications" USING btree ("team_role_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_applicant_id_idx" ON "applications" USING btree ("applicant_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "team_memberships_unique" ON "team_memberships" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_memberships_team_id_idx" ON "team_memberships" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_memberships_user_id_idx" ON "team_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "teams_product_id_idx" ON "teams" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_parent_idx" ON "comments" USING btree ("parent_type","parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_parent_comment_id_idx" ON "comments" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comments_author_id_idx" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_read_created_idx" ON "notifications" USING btree ("user_id","read_at","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reactions_unique" ON "reactions" USING btree ("user_id","target_type","target_id","kind");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reactions_target_idx" ON "reactions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_calls_user_id_idx" ON "ai_calls" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_calls_agent_idx" ON "ai_calls" USING btree ("agent");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_calls_created_at_idx" ON "ai_calls" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_reports_status_idx" ON "moderation_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "moderation_reports_target_idx" ON "moderation_reports" USING btree ("target_type","target_id");--> statement-breakpoint

-- ============================================================
-- NEW INDEXES — these are the net-new additions from this migration
-- ============================================================

-- ideas: composite partial index covering the main feed query
-- WHERE status='published' AND visibility='public' AND deleted_at IS NULL ORDER BY created_at
CREATE INDEX IF NOT EXISTS "ideas_published_feed_idx" ON "ideas" USING btree ("status","visibility","created_at") WHERE "deleted_at" IS NULL;--> statement-breakpoint

-- ideas: HNSW vector index for cosine similarity duplicate detection (pgvector >=0.5)
CREATE INDEX IF NOT EXISTS "ideas_embedding_hnsw_idx" ON "ideas" USING hnsw (embedding vector_cosine_ops);--> statement-breakpoint

-- products: composite partial index for the public product feed
-- WHERE visibility='public' AND deleted_at IS NULL ORDER BY updated_at DESC
CREATE INDEX IF NOT EXISTS "products_public_updated_idx" ON "products" USING btree ("visibility","updated_at") WHERE "deleted_at" IS NULL;--> statement-breakpoint

-- products: composite partial index for the inactivity archive cron job
-- WHERE stage='building' AND last_activity_at < threshold AND deleted_at IS NULL
CREATE INDEX IF NOT EXISTS "products_stage_activity_idx" ON "products" USING btree ("stage","last_activity_at") WHERE "deleted_at" IS NULL;--> statement-breakpoint

-- team_roles: composite replaces two low-value single-column indexes
-- Covers (team_id) prefix lookups AND (team_id, status) filtered queries
CREATE INDEX IF NOT EXISTS "team_roles_team_status_idx" ON "team_roles" USING btree ("team_id","status");--> statement-breakpoint

-- moderation_reports: covers the per-reporter rate-limit query
-- WHERE reporter_id=? AND status=?
CREATE INDEX IF NOT EXISTS "moderation_reports_reporter_status_idx" ON "moderation_reports" USING btree ("reporter_id","status");
