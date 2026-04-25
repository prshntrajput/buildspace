import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import { userRepository } from "@/modules/user/repositories/user.repository";
import { moderationService } from "@/modules/moderation/services/moderation.service";
import { ResolveReportForm } from "./resolve-report-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { formatDate } from "@/lib/utils";

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  harassment: "Harassment",
  plagiarism: "Plagiarism",
  misinformation: "Misinformation",
  other: "Other",
};

export default async function ModerationQueuePage() {
  const authUser = await getUser().catch(() => null);
  if (!authUser) redirect("/login");

  const user = await userRepository.findById(authUser.id);
  if (!user || (user.systemRole !== "mod" && user.systemRole !== "admin")) {
    redirect("/feed");
  }

  const reports = await moderationService.getPendingReports(user.systemRole);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Moderation Queue</h1>
        <Badge variant="secondary" className="ml-1">
          {reports.length} pending
        </Badge>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No pending reports. Queue is clear.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-medium">
                      {REASON_LABELS[report.reason] ?? report.reason}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {report.targetType} · {report.targetId}
                    </p>
                    {report.note && (
                      <p className="text-xs text-muted-foreground italic">"{report.note}"</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(report.createdAt)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ResolveReportForm reportId={report.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
