import { db } from "@/lib/db";
import { aiCalls } from "../../../drizzle/schema";
import type { Usage } from "./providers/types";
import { logger } from "@/lib/telemetry/logger";

export async function logAICall(opts: {
  userId?: string;
  agent: string;
  model: string;
  usage: Usage;
  cached: boolean;
  latencyMs: number;
  success: boolean;
}): Promise<void> {
  try {
    await db.insert(aiCalls).values({
      userId: opts.userId,
      agent: opts.agent,
      model: opts.model,
      inputTokens: opts.usage.promptTokens,
      outputTokens: opts.usage.completionTokens,
      costUsd: opts.usage.costUsd.toFixed(6),
      cached: opts.cached,
      latencyMs: opts.latencyMs,
      success: opts.success,
    });
  } catch (e) {
    logger.error("Failed to log AI call", { error: String(e) });
  }
}
