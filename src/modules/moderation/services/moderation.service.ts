import { moderationRepository } from "../repositories/moderation.repository";
import { RateLimitError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { ModerationReport } from "../types";
import type { SubmitReportInput, ResolveReportInput } from "../schemas";

class ModerationService {
  async submitReport(
    reporterId: string,
    input: SubmitReportInput
  ): Promise<ModerationReport> {
    // Rate limit: 20 reports/day
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const todayCount = await moderationRepository.countPendingByReporter(reporterId, since);
    if (todayCount >= 20) {
      throw new RateLimitError("Report limit of 20 per day reached");
    }

    return moderationRepository.createReport({
      reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      ...(input.note !== undefined ? { note: input.note } : {}),
    });
  }

  async getPendingReports(actorSystemRole: string): Promise<ModerationReport[]> {
    if (actorSystemRole !== "mod" && actorSystemRole !== "admin") {
      throw new ForbiddenError("Moderator access required");
    }
    return moderationRepository.findPendingReports();
  }

  async resolveReport(
    actorId: string,
    actorSystemRole: string,
    input: ResolveReportInput
  ): Promise<ModerationReport> {
    if (actorSystemRole !== "mod" && actorSystemRole !== "admin") {
      throw new ForbiddenError("Moderator access required");
    }

    const report = await moderationRepository.findById(input.reportId);
    if (!report) throw new NotFoundError("Report");

    const status = input.action === "resolve" ? "resolved" : "dismissed";
    const resolved = await moderationRepository.resolveReport(
      input.reportId,
      actorId,
      status,
      input.resolutionNote
    );

    await moderationRepository.writeAuditLog({
      actorId,
      action: `report.${status}`,
      targetType: "moderation_report",
      targetId: input.reportId,
      metadata: { reason: report.reason, targetType: report.targetType },
    });

    return resolved;
  }
}

export const moderationService = new ModerationService();
