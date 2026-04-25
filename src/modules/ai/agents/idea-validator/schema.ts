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
  risks: z.array(z.string()).min(1).max(5).describe("Top risks or concerns"),
  suggestions: z.array(z.string()).min(1).max(3).describe("Concrete improvement suggestions"),
  overallVerdict: z.enum(["strong", "moderate", "weak"]),
});

export type IdeaValidatorInputType = z.infer<typeof IdeaValidatorInput>;
export type IdeaValidatorOutputType = z.infer<typeof IdeaValidatorOutput>;
