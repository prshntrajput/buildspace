import { z } from "zod";

export const ReportReasonSchema = z.enum([
  "spam",
  "harassment",
  "plagiarism",
  "misinformation",
  "other",
]);

export const TargetTypeSchema = z.enum(["idea", "product", "comment", "user"]);

export const SubmitReportSchema = z.object({
  targetType: TargetTypeSchema,
  targetId: z.string().uuid(),
  reason: ReportReasonSchema,
  note: z.string().max(500).optional(),
});

export const ResolveReportSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(["resolve", "dismiss"]),
  resolutionNote: z.string().max(500).optional(),
});

export type SubmitReportInput = z.infer<typeof SubmitReportSchema>;
export type ResolveReportInput = z.infer<typeof ResolveReportSchema>;
