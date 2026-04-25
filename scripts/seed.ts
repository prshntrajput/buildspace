/**
 * Dev seed script — populates a fresh database with realistic test data.
 * Run: npm run db:seed
 *
 * WARNING: This is destructive if data already exists — run only against dev.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env["NEXT_PUBLIC_SUPABASE_URL"]!;
const SUPABASE_SERVICE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
const DB_URL = process.env["SUPABASE_DB_URL"]!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !DB_URL) {
  console.error("Missing required env vars. Check .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const pg = postgres(DB_URL, { prepare: false });
const db = drizzle(pg, { schema });

type SeedUser = {
  id: string;
  handle: string;
  email: string;
  displayName: string;
};

async function createAuthUser(email: string, password: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`Failed to create auth user ${email}: ${error.message}`);
  return data.user.id;
}

async function seed() {
  console.log("🌱 Seeding dev database…");

  // ---------- Users ----------
  console.log("Creating auth users…");
  const userData: { email: string; password: string; handle: string; displayName: string }[] = [
    { email: "alice@example.dev", password: "Password123!", handle: "alice", displayName: "Alice Chen" },
    { email: "bob@example.dev",   password: "Password123!", handle: "bob",   displayName: "Bob Okafor" },
    { email: "carol@example.dev", password: "Password123!", handle: "carol", displayName: "Carol Singh" },
  ];

  const seedUsers: SeedUser[] = [];
  for (const u of userData) {
    // Upsert: skip if auth user already exists
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    const found = existing?.users.find((au) => au.email === u.email);
    const id = found ? found.id : await createAuthUser(u.email, u.password);
    seedUsers.push({ id, handle: u.handle, email: u.email, displayName: u.displayName });
  }

  // Upsert user rows
  for (const u of seedUsers) {
    await db
      .insert(schema.users)
      .values({
        id: u.id,
        handle: u.handle,
        email: u.email,
        displayName: u.displayName,
        bio: `Builder at heart. Making things.`,
        skills: ["TypeScript", "React", "Node.js"],
        availability: "part_time",
        timezone: "UTC",
        systemRole: "user",
        currentScore: "120.0000",
        rankBucket: "bronze",
      })
      .onConflictDoNothing();
  }
  console.log(`✅ ${seedUsers.length} users`);

  const [alice, bob, carol] = seedUsers as [SeedUser, SeedUser, SeedUser];

  // ---------- Ideas ----------
  const ideaRows = await db
    .insert(schema.ideas)
    .values([
      {
        slug: "ai-code-review-tool",
        authorId: alice.id,
        title: "AI-powered code review for solo devs",
        problem: "Solo developers have no peer review process, leading to blind spots in code quality.",
        targetUser: "Indie developers working alone on production apps",
        solution: "An AI agent that reviews PRs with the depth of a senior engineer, not just style checks.",
        mvpPlan: "GitHub App that comments on PRs with actionable suggestions in 14 days.",
        tags: ["AI", "developer-tools", "code-quality"],
        status: "published",
        visibility: "public",
        upvoteCount: 12,
      },
      {
        slug: "local-barter-platform",
        authorId: bob.id,
        title: "Hyperlocal barter platform",
        problem: "People have skills and goods they'd trade but no trusted local marketplace exists.",
        targetUser: "City residents aged 25–45 who want sustainable alternatives to buying",
        solution: "A trust-scored marketplace for bartering goods and services within 5km.",
        tags: ["marketplace", "sustainability", "community"],
        status: "published",
        visibility: "public",
        upvoteCount: 7,
      },
      {
        slug: "async-standup-tool",
        authorId: carol.id,
        title: "Async standup for remote teams",
        problem: "Daily standups waste 15–30 minutes of deep work time for remote teams.",
        targetUser: "Engineering managers running remote teams of 5–20 people",
        solution: "Video + AI standup tool that summarizes blockers and progress without a live call.",
        tags: ["productivity", "remote-work", "async"],
        status: "draft",
        visibility: "public",
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`✅ ${ideaRows.length > 0 ? ideaRows.length : "existing"} ideas`);

  // ---------- Products ----------
  const productRows = await db
    .insert(schema.products)
    .values([
      {
        slug: "reviewbot",
        name: "ReviewBot",
        description: "AI code review for solo developers.",
        ownerId: alice.id,
        stage: "building",
        techStack: ["Next.js", "TypeScript", "OpenAI"],
        repoUrl: "https://github.com/alice/reviewbot",
        visibility: "public",
      },
      {
        slug: "swapwise",
        name: "SwapWise",
        description: "Hyperlocal barter marketplace.",
        ownerId: bob.id,
        stage: "ideation",
        techStack: ["React Native", "Node.js", "PostgreSQL"],
        visibility: "public",
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`✅ ${productRows.length > 0 ? productRows.length : "existing"} products`);

  // ---------- Build Rooms ----------
  if (productRows.length > 0) {
    const reviewBotProduct = productRows.find((p) => p.slug === "reviewbot");
    if (reviewBotProduct) {
      const buildRoomRows = await db
        .insert(schema.buildRooms)
        .values({
          productId: reviewBotProduct.id,
          title: "ReviewBot Build Room",
          description: "Main workspace for ReviewBot development",
        })
        .onConflictDoNothing()
        .returning();

      if (buildRoomRows.length > 0 && buildRoomRows[0]) {
        const buildRoomId = buildRoomRows[0].id;

        // Tasks
        await db
          .insert(schema.tasks)
          .values([
            {
              buildRoomId,
              title: "Set up GitHub App boilerplate",
              status: "done",
              createdById: alice.id,
              proofUrl: "https://github.com/alice/reviewbot/pull/1",
              completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            },
            {
              buildRoomId,
              title: "Design prompt for PR review agent",
              status: "in_progress",
              createdById: alice.id,
            },
            {
              buildRoomId,
              title: "Build webhook handler for PR events",
              status: "todo",
              createdById: alice.id,
            },
          ])
          .onConflictDoNothing();

        console.log("✅ Build room + tasks");
      }
    }
  }

  // ---------- Activity Logs ----------
  await db
    .insert(schema.activityLogs)
    .values([
      { userId: alice.id, kind: "task_completed", signalWeight: 3, proofUrl: "https://github.com/alice/reviewbot/pull/1" },
      { userId: alice.id, kind: "update_posted", signalWeight: 5 },
      { userId: bob.id,   kind: "task_completed", signalWeight: 3 },
    ])
    .onConflictDoNothing();

  console.log("✅ Activity logs");

  // ---------- Done ----------
  console.log("\n🎉 Seed complete!");
  console.log("Dev accounts:");
  for (const u of seedUsers) {
    console.log(`  ${u.email} / Password123!`);
  }

  await pg.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
