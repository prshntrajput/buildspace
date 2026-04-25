import { withFallback } from "@/modules/ai/providers";
import { buildCacheKey, getCached, setCached, AI_CACHE_TTL } from "@/modules/ai/cache";
import { logAICall } from "@/modules/ai/ledger";
import { UpdateSummarizerInput, UpdateSummarizerOutput } from "./schema";
import type { UpdateSummarizerInputType, UpdateSummarizerOutputType } from "./schema";
import { logger } from "@/lib/telemetry/logger";

const AGENT_NAME = "UpdateSummarizer";
const AGENT_VERSION = "1.0";
const TIMEOUT_MS = 15_000;

const SYSTEM_PROMPT = `You are a concise builder-coach on BuildSpace — an execution-first platform. Summarize weekly builder updates honestly and specifically. Strong momentum requires concrete shipped work, not just activity. Return valid JSON.`;

export async function summarizeUpdates(
  input: UpdateSummarizerInputType,
  userId?: string
): Promise<UpdateSummarizerOutputType | null> {
  const parsed = UpdateSummarizerInput.parse(input);
  const cacheKey = buildCacheKey(AGENT_NAME, AGENT_VERSION, parsed, "gemini");

  const cached = await getCached<UpdateSummarizerOutputType>(cacheKey);
  if (cached) {
    await logAICall({
      ...(userId !== undefined ? { userId } : {}),
      agent: AGENT_NAME,
      model: "cached",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: 0 },
      cached: true,
      latencyMs: 0,
      success: true,
    });
    return cached;
  }

  const updatesText = parsed.updates
    .map((u) => `Week ${u.weekNumber} (${u.year}):\n${u.body}`)
    .join("\n\n---\n\n");

  const prompt = `
Summarize the following builder updates for **${parsed.productName}**:

${updatesText}

Provide a structured digest with summary, highlights, and momentum assessment.
  `.trim();

  const start = Date.now();
  let result: UpdateSummarizerOutputType | null = null;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI timeout")), TIMEOUT_MS)
    );

    const aiPromise = withFallback((provider) =>
      provider.generateObject<UpdateSummarizerOutputType>({
        prompt,
        system: SYSTEM_PROMPT,
        schema: UpdateSummarizerOutput,
        maxTokens: 512,
      })
    );

    const { object, usage } = await Promise.race([aiPromise, timeoutPromise]);
    result = object;
    const latencyMs = Date.now() - start;

    await setCached(cacheKey, result, AI_CACHE_TTL.UpdateSummarizer);
    await logAICall({
      ...(userId !== undefined ? { userId } : {}),
      agent: AGENT_NAME,
      model: "gemini-2.5-flash",
      usage,
      cached: false,
      latencyMs,
      success: true,
    });
  } catch (e) {
    logger.error("UpdateSummarizer failed", { error: String(e) });
    await logAICall({
      ...(userId !== undefined ? { userId } : {}),
      agent: AGENT_NAME,
      model: "gemini-2.5-flash",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: 0 },
      cached: false,
      latencyMs: Date.now() - start,
      success: false,
    });
    return null;
  }

  return result;
}
