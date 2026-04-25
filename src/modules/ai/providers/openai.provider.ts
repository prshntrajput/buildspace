import { generateText, generateObject, embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { LLMProvider, GenerateOpts, GenerateObjectOpts, GenerateTextResult, GenerateObjectResult } from "./types";

const GPT4O_MINI_COST_PER_1K_INPUT = 0.00015;
const GPT4O_MINI_COST_PER_1K_OUTPUT = 0.0006;

export class OpenAIProvider implements LLMProvider {
  private model = openai("gpt-4o-mini");
  private embedModel = openai.embedding("text-embedding-3-small");

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
          (inputTokens / 1000) * GPT4O_MINI_COST_PER_1K_INPUT +
          (outputTokens / 1000) * GPT4O_MINI_COST_PER_1K_OUTPUT,
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
          (inputTokens / 1000) * GPT4O_MINI_COST_PER_1K_INPUT +
          (outputTokens / 1000) * GPT4O_MINI_COST_PER_1K_OUTPUT,
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
