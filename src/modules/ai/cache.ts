import { createHash } from "crypto";
import { redis } from "@/lib/cache";

function hashInput(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export function buildCacheKey(
  agent: string,
  version: string,
  input: unknown,
  model: string
): string {
  return `ai:${agent}:${version}:${hashInput({ input, model })}`;
}

export async function getCached<T>(key: string): Promise<T | null> {
  return redis.get<T>(key);
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  await redis.setex(key, ttlSeconds, value);
}

export const AI_CACHE_TTL = {
  IdeaValidator: 7 * 24 * 60 * 60,
  TaskPlanner: 24 * 60 * 60,
  TeamMatcher: 60 * 60,
  UpdateSummarizer: 24 * 60 * 60,
} as const;
