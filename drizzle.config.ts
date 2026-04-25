import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// For migrations we need session mode (full DDL support).
// The direct DB URL uses IPv6 (unreachable from WSL2 / some CI).
// Derive the session mode pooler URL by swapping port 6543 → 5432 on the
// same pooler hostname — Supabase Visor serves session mode on port 5432.
const poolUrl = process.env["SUPABASE_DB_POOL_URL"] ?? "";
const migrationUrl = poolUrl.replace(":6543/", ":5432/");

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema/index.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: migrationUrl || poolUrl,
  },
  verbose: true,
  strict: false,
});
