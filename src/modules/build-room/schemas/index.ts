import { z } from "zod";

export const TaskCreateInput = z.object({
  buildRoomId: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  estimateMinutes: z.number().min(1).max(10080).optional(),
  milestoneId: z.string().uuid().optional(),
  weight: z.number().min(1).max(10).default(1),
});

export const TaskCompleteInput = z.object({
  proofUrl: z.string().url("A valid proof URL is required to complete a task"),
});

export const TaskMoveInput = z.object({
  status: z.enum(["todo", "in_progress", "done", "cancelled"]),
});

export const UpdateCreateInput = z.object({
  buildRoomId: z.string().uuid(),
  body: z.record(z.string(), z.unknown()),
  weekNumber: z.number().min(1).max(53),
  year: z.number().min(2024).max(2100),
});

export const MilestoneCreateInput = z.object({
  buildRoomId: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().max(500).optional(),
  targetDate: z.string().datetime().optional(),
});

export type TaskCreateInputType = z.infer<typeof TaskCreateInput>;
export type TaskCompleteInputType = z.infer<typeof TaskCompleteInput>;
export type TaskMoveInputType = z.infer<typeof TaskMoveInput>;
export type UpdateCreateInputType = z.infer<typeof UpdateCreateInput>;
export type MilestoneCreateInputType = z.infer<typeof MilestoneCreateInput>;
