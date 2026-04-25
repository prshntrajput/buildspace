import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth/server";
import { scoreService } from "@/modules/execution/services/score.service";
import { userRepository } from "@/modules/user/repositories/user.repository";
import { SIGNAL_WEIGHTS } from "@/modules/execution/signal.types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { formatDate } from "@/lib/utils";

const RANK_COLORS: Record<string, string> = {
  bronze: "text-amber-600",
  silver: "text-slate-400",
  gold: "text-yellow-500",
  platinum: "text-cyan-400",
};

const KIND_LABEL: Record<string, string> = {
  task_completed: "Task Completed",
  update_posted: "Weekly Update Posted",
  milestone_shipped: "Milestone Shipped",
  commit_linked: "Commit Linked",
  peer_endorsed: "Peer Endorsement",
  backer_received: "Backer Received",
  inactivity_penalty: "Inactivity Penalty",
  abandoned_penalty: "Abandoned Penalty",
};

function DeltaBadge({ delta }: { delta: number }) {
  const rounded = Math.round(delta * 10) / 10;
  if (Math.abs(rounded) < 0.1) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-sm">
        <Minus className="h-3 w-3" /> 0
      </span>
    );
  }
  if (rounded > 0) {
    return (
      <span className="flex items-center gap-1 text-green-500 text-sm font-medium">
        <TrendingUp className="h-3 w-3" /> +{rounded}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-destructive text-sm font-medium">
      <TrendingDown className="h-3 w-3" /> {rounded}
    </span>
  );
}

export default async function ScorePage() {
  const authUser = await getUser().catch(() => null);
  if (!authUser) redirect("/login");

  const user = await userRepository.findById(authUser.id);
  if (!user) redirect("/login");

  const { snapshots, breakdown } = await scoreService.getDashboardData(user.id).catch(() => ({
    snapshots: [],
    breakdown: [],
  }));

  const rawScore = parseFloat(user.currentScore);
  const delta7d = parseFloat(user.scoreDelta7d);
  const delta30d = parseFloat(user.scoreDelta30d);

  // Positive signals only for the breakdown display
  const positiveBreakdown = breakdown.filter((b) => b.totalWeight > 0);
  const penaltyBreakdown = breakdown.filter((b) => b.totalWeight <= 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings/profile">
          <span className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Settings
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Execution Score</h1>
      </div>

      {/* Score hero */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your score</p>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold tabular-nums">{Math.round(rawScore)}</span>
                <span className={`text-lg font-semibold capitalize ${RANK_COLORS[user.rankBucket] ?? ""}`}>
                  {user.rankBucket}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-muted-foreground">7d</span>
                <DeltaBadge delta={delta7d} />
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-muted-foreground">30d</span>
                <DeltaBadge delta={delta30d} />
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Rank thresholds */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {(["bronze", "silver", "gold", "platinum"] as const).map((bucket) => (
              <div
                key={bucket}
                className={`rounded-md p-2 ${user.rankBucket === bucket ? "bg-accent" : "opacity-40"}`}
              >
                <p className={`font-semibold capitalize ${RANK_COLORS[bucket]}`}>{bucket}</p>
                <p className="text-muted-foreground">
                  {bucket === "bronze" ? "0–199"
                    : bucket === "silver" ? "200–499"
                    : bucket === "gold" ? "500–799"
                    : "800+"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Signal breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Breakdown — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {breakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No activity logged yet. Complete tasks with proof links to start building your score.
            </p>
          ) : (
            <div className="space-y-1">
              {positiveBreakdown
                .sort((a, b) => b.totalWeight - a.totalWeight)
                .map((b) => (
                  <div key={b.kind} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{KIND_LABEL[b.kind] ?? b.kind}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.count}× · +{SIGNAL_WEIGHTS[b.kind as keyof typeof SIGNAL_WEIGHTS] ?? "?"} per signal
                      </p>
                    </div>
                    <Badge variant="secondary" className="tabular-nums">
                      +{b.totalWeight}
                    </Badge>
                  </div>
                ))}
              {penaltyBreakdown.map((b) => (
                <div key={b.kind} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-destructive">{KIND_LABEL[b.kind] ?? b.kind}</p>
                    <p className="text-xs text-muted-foreground">{b.count}×</p>
                  </div>
                  <Badge variant="destructive" className="tabular-nums">
                    {b.totalWeight}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How to improve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Improve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {[
              { label: "Complete tasks with a proof link", points: "+3 each (cap 10/day)" },
              { label: "Post a weekly update", points: "+5 (max 1/week counts)" },
              { label: "Ship a verified milestone", points: "+15" },
              { label: "Link a GitHub commit", points: "+2 each (cap 20/day)" },
              { label: "Receive a peer endorsement", points: "+4 (max 3/month per endorser)" },
            ].map(({ label, points }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-green-600 whitespace-nowrap">{points}</span>
              </div>
            ))}
            <Separator />
            <p className="text-xs text-muted-foreground">
              Scores decay with a 90-day half-life. Stay active to maintain your rank.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Score history */}
      {snapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {snapshots.slice(0, 10).map((snap, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <span className="text-xs text-muted-foreground">{formatDate(snap.computedAt)}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs capitalize ${RANK_COLORS[snap.rankBucket] ?? ""}`}>
                      {snap.rankBucket}
                    </span>
                    <span className="text-sm font-medium tabular-nums">{Math.round(snap.score)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
