import { GeminiProvider } from "./gemini.provider";
import { OpenAIProvider } from "./openai.provider";
import type { LLMProvider } from "./types";

let _primary: LLMProvider | null = null;
let _fallback: LLMProvider | null = null;

export function getPrimaryProvider(): LLMProvider {
  if (!_primary) _primary = new GeminiProvider();
  return _primary;
}

export function getFallbackProvider(): LLMProvider {
  if (!_fallback) _fallback = new OpenAIProvider();
  return _fallback;
}

export async function withFallback<T>(
  fn: (provider: LLMProvider) => Promise<T>
): Promise<T> {
  try {
    return await fn(getPrimaryProvider());
  } catch (primaryError) {
    try {
      return await fn(getFallbackProvider());
    } catch {
      throw primaryError;
    }
  }
}

export type { LLMProvider } from "./types";
