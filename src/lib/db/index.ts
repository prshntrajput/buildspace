import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "../../../drizzle/schema";

// Always use the pooler URL — the direct DB URL resolves to IPv6 which is
// unreachable in some environments (WSL2, certain CI). The pooler uses IPv4.
const connectionString = env.SUPABASE_DB_POOL_URL;

const client = postgres(connectionString, {
  // Disable prepared statements — required for pgBouncer / Supabase transaction-mode pooler
  prepare: false,
  max: process.env["NODE_ENV"] === "production" ? 1 : 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export type DB = typeof db;
