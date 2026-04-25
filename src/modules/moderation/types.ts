export type ReportReason = "spam" | "harassment" | "plagiarism" | "misinformation" | "other";
export type ReportStatus = "pending" | "resolved" | "dismissed";
export type TargetType = "idea" | "product" | "comment" | "user";

export type ModerationReport = {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: ReportReason;
  note: string | null;
  status: ReportStatus;
  resolvedById: string | null;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuditLog = {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};
