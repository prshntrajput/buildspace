import { z } from "zod";

export type GenerateOpts = {
  prompt: string;
  system?: string;
  maxTokens?: number;
  temperature?: number;
};

export type GenerateObjectOpts<T> = {
  prompt: string;
  system?: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
};

export type Usage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
};

export type GenerateTextResult = {
  text: string;
  usage: Usage;
};

export type GenerateObjectResult<T> = {
  object: T;
  usage: Usage;
};

export interface LLMProvider {
  generateText(opts: GenerateOpts): Promise<GenerateTextResult>;
  generateObject<T>(opts: GenerateObjectOpts<T>): Promise<GenerateObjectResult<T>>;
  embed(text: string): Promise<number[]>;
}
