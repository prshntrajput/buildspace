import { withFallback } from "@/modules/ai/providers";
import { buildCacheKey, getCached, setCached, AI_CACHE_TTL } from "@/modules/ai/cache";
import { logAICall } from "@/modules/ai/ledger";
import { IdeaValidatorInput, IdeaValidatorOutput } from "./schema";
import type { IdeaValidatorInputType, IdeaValidatorOutputType } from "./schema";
import { logger } from "@/lib/telemetry/logger";

const AGENT_NAME = "IdeaValidator";
const AGENT_VERSION = "1.0";
const TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT = `You are an expert startup advisor on BuildSpace — an execution-first builder platform. Evaluate ideas honestly and constructively. Never hallucinate market data. Keep all text responses concise.`;

export async function validateIdea(
  input: IdeaValidatorInputType,
  userId?: string
): Promise<IdeaValidatorOutputType | null> {
  const parsed = IdeaValidatorInput.parse(input);
  const cacheKey = buildCacheKey(AGENT_NAME, AGENT_VERSION, parsed, "gemini");

  const cached = await getCached<IdeaValidatorOutputType>(cacheKey);
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

  const prompt = `
Evaluate this startup idea. Provide exactly 3–5 risks and exactly 2–3 suggestions (one sentence each).

**Title:** ${parsed.title}
**Problem:** ${parsed.problem}
**Target User:** ${parsed.targetUser}
**Solution:** ${parsed.solution}
${parsed.mvpPlan ? `**MVP Plan:** ${parsed.mvpPlan}` : ""}
${parsed.tags?.length ? `**Tags:** ${parsed.tags.join(", ")}` : ""}
  `.trim();

  const start = Date.now();
  let result: IdeaValidatorOutputType | null = null;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI timeout")), TIMEOUT_MS)
    );

    const aiPromise = withFallback((provider) =>
      provider.generateObject<IdeaValidatorOutputType>({
        prompt,
        system: SYSTEM_PROMPT,
        schema: IdeaValidatorOutput,
        maxTokens: 2048,
      })
    );

    const { object, usage } = await Promise.race([aiPromise, timeoutPromise]);

    // Clamp arrays in case the model exceeded the requested counts
    result = {
      ...object,
      risks: object.risks.slice(0, 5),
      suggestions: object.suggestions.slice(0, 3),
    };
    const latencyMs = Date.now() - start;

    await setCached(cacheKey, result, AI_CACHE_TTL.IdeaValidator);
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
    logger.error("IdeaValidator failed", { error: String(e) });
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
