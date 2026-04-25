import { z } from "zod";

export const TaskPlannerInput = z.object({
  productName: z.string(),
  ideaTitle: z.string(),
  problem: z.string(),
  solution: z.string(),
  teamSize: z.number().min(1).max(20).default(1),
  timelineWeeks: z.number().min(1).max(52).default(8),
});

export const TaskPlannerMilestone = z.object({
  title: z.string().describe("Short milestone title, e.g. 'MVP Core'"),
  description: z.string().describe("1-2 sentence description of what this milestone achieves"),
  weekTarget: z.number().min(1).describe("Week number by which this milestone should be complete"),
  tasks: z.array(
    z.object({
      title: z.string().describe("Clear, actionable task title"),
      description: z.string().optional().describe("Optional detail on what done looks like"),
      estimateMinutes: z.number().min(1).describe("Realistic estimate in minutes"),
    })
  ).min(1),
});

export const TaskPlannerOutput = z.object({
  milestones: z.array(TaskPlannerMilestone).min(1),
  rationale: z.string().describe("1-2 sentences explaining the sequencing strategy"),
});

export type TaskPlannerInputType = z.infer<typeof TaskPlannerInput>;
export type TaskPlannerOutputType = z.infer<typeof TaskPlannerOutput>;
export type TaskPlannerMilestoneType = z.infer<typeof TaskPlannerMilestone>;
