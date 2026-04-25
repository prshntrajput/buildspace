import { z } from "zod";

export const UpdateSummarizerInput = z.object({
  productName: z.string(),
  updates: z
    .array(
      z.object({
        weekNumber: z.number(),
        year: z.number(),
        body: z.string().describe("Plain text or JSON-stringified rich text body of the update"),
      })
    )
    .min(1)
    .max(20),
});

export const UpdateSummarizerOutput = z.object({
  summary: z.string().describe("2-4 sentence executive summary of what was built this week"),
  highlights: z.array(z.string()).min(1).max(5).describe("Key achievements or milestones"),
  momentum: z.enum(["strong", "steady", "slow"]).describe("Overall execution momentum assessment"),
});

export type UpdateSummarizerInputType = z.infer<typeof UpdateSummarizerInput>;
export type UpdateSummarizerOutputType = z.infer<typeof UpdateSummarizerOutput>;
