export type Task = {
  id: string;
  buildRoomId: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done" | "cancelled";
  assigneeId: string | null;
  dueDate: Date | null;
  estimateMinutes: number | null;
  proofUrl: string | null;
  milestoneId: string | null;
  weight: number;
  completedAt: Date | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Update = {
  id: string;
  buildRoomId: string;
  authorId: string;
  body: Record<string, unknown>;
  weekNumber: number;
  year: number;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Milestone = {
  id: string;
  buildRoomId: string;
  title: string;
  description: string | null;
  targetDate: Date | null;
  achievedAt: Date | null;
  verifiedBy: string[];
  createdAt: Date;
  updatedAt: Date;
};
