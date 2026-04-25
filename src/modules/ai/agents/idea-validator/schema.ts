import { z } from "zod";

export const IdeaValidatorInput = z.object({
  title: z.string(),
  problem: z.string(),
  targetUser: z.string(),
  solution: z.string(),
  mvpPlan: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const IdeaValidatorOutput = z.object({
  clarityScore: z.number().min(0).max(10),
  marketSignal: z.string().describe("1–2 sentence assessment of market opportunity"),
  // No minItems/maxItems — Gemini ignores those JSON Schema constraints and
  // Zod then rejects the response. Counts are enforced via prompt + code clamp.
  risks: z.array(z.string()).describe("Top risks or concerns, one sentence each"),
  suggestions: z.array(z.string()).describe("Concrete improvement suggestions, one sentence each"),
  overallVerdict: z.enum(["strong", "moderate", "weak"]),
});

export type IdeaValidatorInputType = z.infer<typeof IdeaValidatorInput>;
export type IdeaValidatorOutputType = z.infer<typeof IdeaValidatorOutput>;
