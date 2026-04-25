/**
 * One-time migration: enable pgvector and add embedding column to ideas.
 * Run: npx tsx scripts/add-embedding-column.ts
 */
import postgres from "postgres";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// Use pooler URL at session-mode port 5432 (IPv4-routable from WSL2)
const poolUrl = process.env["SUPABASE_DB_POOL_URL"];
if (!poolUrl) {
  console.error("SUPABASE_DB_POOL_URL is not set in .env.local");
  process.exit(1);
}
const DB_URL = poolUrl.replace(":6543/", ":5432/");

const pg = postgres(DB_URL, { prepare: false });

async function run() {
  console.log("Enabling pgvector extension…");
  await pg`CREATE EXTENSION IF NOT EXISTS vector`;

  console.log("Adding embedding column to ideas table…");
  await pg`ALTER TABLE ideas ADD COLUMN IF NOT EXISTS embedding vector(768)`;

  console.log("Creating HNSW index on embedding column…");
  await pg`
    CREATE INDEX IF NOT EXISTS ideas_embedding_idx
    ON ideas USING hnsw (embedding vector_cosine_ops)
  `;

  console.log("✅ Done.");
  await pg.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
