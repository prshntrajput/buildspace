import { eq, and, gte, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLogs, users, scoreSnapshots } from "../../../../drizzle/schema";
import { computeDecayedScore, ageInDays } from "../score.formula";
import { getRankBucket, DAILY_CAPS, SIGNAL_WEIGHTS, type SignalKind } from "../signal.types";
import { logger } from "@/lib/telemetry/logger";

export class ScoreService {
  async recompute(userId: string): Promise<{
    score: number;
    rankBucket: "bronze" | "silver" | "gold" | "platinum";
  }> {
    const since = new Date();
    since.setDate(since.getDate() - 120);

    const logs = await db
      .select()
      .from(activityLogs)
      .where(and(eq(activityLogs.userId, userId), gte(activityLogs.createdAt, since)))
      .orderBy(desc(activityLogs.createdAt));

    // Anti-gaming: apply daily caps
    const dailyCounts: Record<string, Record<string, number>> = {};

    const signals = logs
      .filter((log) => {
        const kind = log.kind as SignalKind;
        const cap = DAILY_CAPS[kind];
        if (cap === undefined) return true;

        const day = log.createdAt.toISOString().split("T")[0] ?? "";
        const dayKey = `${kind}:${day}`;
        const count = (dailyCounts[dayKey] ?? 0) as number;
        if (count >= cap) return false;
        dailyCounts[dayKey] = { ...dailyCounts[dayKey], [kind]: count + 1 };
        return true;
      })
      .map((log) => ({
        weight: log.signalWeight,
        ageDays: ageInDays(log.createdAt),
      }));

    const score = computeDecayedScore(signals);
    const rankBucket = getRankBucket(score);

    // Get previous snapshot for delta calculation
    const prevSnapshots = await db
      .select()
      .from(scoreSnapshots)
      .where(eq(scoreSnapshots.userId, userId))
      .orderBy(desc(scoreSnapshots.computedAt))
      .limit(1);

    const prevScore = prevSnapshots[0] ? parseFloat(prevSnapshots[0].score) : 0;
    const delta7d = score - prevScore;

    // Write snapshot
    await db.insert(scoreSnapshots).values({
      userId,
      score: score.toFixed(4),
      rankBucket,
      components: { signalCount: signals.length, rawScore: score },
    });

    // Update user
    await db
      .update(users)
      .set({
        currentScore: score.toFixed(4),
        rankBucket,
        scoreDelta7d: delta7d.toFixed(4),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    logger.info("Score recomputed", { userId, score, rankBucket });

    return { score, rankBucket };
  }

  async getDashboardData(userId: string): Promise<{
    snapshots: { score: number; rankBucket: string; computedAt: Date }[];
    breakdown: { kind: string; count: number; totalWeight: number }[];
  }> {
    const since30d = new Date();
    since30d.setDate(since30d.getDate() - 30);

    const [snapshotRows, logRows] = await Promise.all([
      db
        .select()
        .from(scoreSnapshots)
        .where(and(eq(scoreSnapshots.userId, userId), gte(scoreSnapshots.computedAt, since30d)))
        .orderBy(desc(scoreSnapshots.computedAt))
        .limit(30),
      db
        .select()
        .from(activityLogs)
        .where(and(eq(activityLogs.userId, userId), gte(activityLogs.createdAt, since30d)))
        .orderBy(desc(activityLogs.createdAt)),
    ]);

    const snapshots = snapshotRows.map((r) => ({
      score: parseFloat(r.score),
      rankBucket: r.rankBucket,
      computedAt: r.computedAt,
    }));

    // Group logs by kind
    const byKind: Record<string, { count: number; totalWeight: number }> = {};
    for (const log of logRows) {
      const entry = byKind[log.kind] ?? { count: 0, totalWeight: 0 };
      entry.count += 1;
      entry.totalWeight += log.signalWeight;
      byKind[log.kind] = entry;
    }
    const breakdown = Object.entries(byKind).map(([kind, v]) => ({ kind, ...v }));

    return { snapshots, breakdown };
  }

  async logActivity(opts: {
    userId: string;
    productId?: string;
    kind: SignalKind;
    proofUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const weight = SIGNAL_WEIGHTS[opts.kind] ?? 0;
    await db.insert(activityLogs).values({
      userId: opts.userId,
      productId: opts.productId,
      kind: opts.kind,
      signalWeight: weight,
      proofUrl: opts.proofUrl,
      metadata: opts.metadata ?? {},
    });
  }
}

export const scoreService = new ScoreService();
