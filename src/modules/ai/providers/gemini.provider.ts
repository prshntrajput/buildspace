import { generateText, generateObject, embed } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { LLMProvider, GenerateOpts, GenerateObjectOpts, GenerateTextResult, GenerateObjectResult } from "./types";

const GEMINI_COST_PER_1K_INPUT = 0.000075;
const GEMINI_COST_PER_1K_OUTPUT = 0.0003;

export class GeminiProvider implements LLMProvider {
  private model = google("gemini-2.5-flash");
  private embedModel = google.textEmbeddingModel("text-embedding-004");

  async generateText(opts: GenerateOpts): Promise<GenerateTextResult> {
    const result = await generateText({
      model: this.model,
      ...(opts.system !== undefined ? { system: opts.system } : {}),
      prompt: opts.prompt,
      maxOutputTokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.7,
    });

    const inputTokens = result.usage.inputTokens ?? 0;
    const outputTokens = result.usage.outputTokens ?? 0;

    return {
      text: result.text,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
        costUsd:
          (inputTokens / 1000) * GEMINI_COST_PER_1K_INPUT +
          (outputTokens / 1000) * GEMINI_COST_PER_1K_OUTPUT,
      },
    };
  }

  async generateObject<T>(opts: GenerateObjectOpts<T>): Promise<GenerateObjectResult<T>> {
    const result = await generateObject({
      model: this.model,
      ...(opts.system !== undefined ? { system: opts.system } : {}),
      prompt: opts.prompt,
      schema: opts.schema as z.ZodType<T>,
      maxOutputTokens: opts.maxTokens ?? 2048,
      providerOptions: { google: { structuredOutputs: true } },
    });

    const inputTokens = result.usage.inputTokens ?? 0;
    const outputTokens = result.usage.outputTokens ?? 0;

    return {
      object: result.object,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
        costUsd:
          (inputTokens / 1000) * GEMINI_COST_PER_1K_INPUT +
          (outputTokens / 1000) * GEMINI_COST_PER_1K_OUTPUT,
      },
    };
  }

  async embed(text: string): Promise<number[]> {
    const result = await embed({
      model: this.embedModel,
      value: text,
    });
    return result.embedding;
  }
}
