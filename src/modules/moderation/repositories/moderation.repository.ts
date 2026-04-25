import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { moderationReports, auditLogs } from "../../../../drizzle/schema";
import type { ModerationReport, AuditLog, ReportReason, ReportStatus } from "../types";

function mapReport(row: typeof moderationReports.$inferSelect): ModerationReport {
  return {
    id: row.id,
    reporterId: row.reporterId,
    targetType: row.targetType,
    targetId: row.targetId,
    reason: row.reason as ReportReason,
    note: row.note,
    status: row.status as ReportStatus,
    resolvedById: row.resolvedById,
    resolutionNote: row.resolutionNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapAuditLog(row: typeof auditLogs.$inferSelect): AuditLog {
  return {
    id: row.id,
    actorId: row.actorId,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.createdAt,
  };
}

class ModerationRepository {
  async createReport(input: {
    reporterId: string;
    targetType: string;
    targetId: string;
    reason: ReportReason;
    note?: string;
  }): Promise<ModerationReport> {
    const rows = await db
      .insert(moderationReports)
      .values({
        reporterId: input.reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        ...(input.note !== undefined ? { note: input.note } : {}),
      })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Insert failed");
    return mapReport(row);
  }

  async findPendingReports(): Promise<ModerationReport[]> {
    const rows = await db
      .select()
      .from(moderationReports)
      .where(eq(moderationReports.status, "pending"))
      .orderBy(desc(moderationReports.createdAt));
    return rows.map(mapReport);
  }

  async findById(id: string): Promise<ModerationReport | null> {
    const rows = await db
      .select()
      .from(moderationReports)
      .where(eq(moderationReports.id, id))
      .limit(1);
    return rows[0] ? mapReport(rows[0]) : null;
  }

  async countPendingByReporter(reporterId: string, since: Date): Promise<number> {
    const rows = await db
      .select()
      .from(moderationReports)
      .where(
        and(
          eq(moderationReports.reporterId, reporterId),
          eq(moderationReports.status, "pending")
        )
      );
    return rows.filter((r) => r.createdAt >= since).length;
  }

  async resolveReport(
    id: string,
    resolvedById: string,
    status: "resolved" | "dismissed",
    resolutionNote?: string
  ): Promise<ModerationReport> {
    const rows = await db
      .update(moderationReports)
      .set({
        status,
        resolvedById,
        ...(resolutionNote !== undefined ? { resolutionNote } : {}),
        updatedAt: new Date(),
      })
      .where(eq(moderationReports.id, id))
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Report not found");
    return mapReport(row);
  }

  async writeAuditLog(input: {
    actorId: string;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLog> {
    const rows = await db
      .insert(auditLogs)
      .values({
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType,
        ...(input.targetId !== undefined ? { targetId: input.targetId } : {}),
        metadata: input.metadata ?? {},
      })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Insert failed");
    return mapAuditLog(row);
  }
}

export const moderationRepository = new ModerationRepository();
