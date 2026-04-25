import { inngest } from "@/inngest/client";
import { scoreService } from "../services/score.service";
import { db } from "@/lib/db";
import { activityLogs } from "../../../../drizzle/schema";
import { gte } from "drizzle-orm";
import { logger } from "@/lib/telemetry/logger";

export const onScoreRecompute = inngest.createFunction(
  { id: "score.recompute", name: "Score Recompute", triggers: [{ event: "score/recompute" }] },
  async ({ event }) => {
    const { userId } = event.data as { userId: string };
    await scoreService.recompute(userId);
  }
);

export const dailyScoreRecompute = inngest.createFunction(
  { id: "score.recompute.daily", name: "Daily Score Recompute", triggers: [{ cron: "0 2 * * *" }] },
  async ({ step }) => {
    await step.run("recompute-all-active-users", async () => {
      const since = new Date();
      since.setDate(since.getDate() - 120);

      const activeUserIds = await db
        .selectDistinct({ userId: activityLogs.userId })
        .from(activityLogs)
        .where(gte(activityLogs.createdAt, since));

      logger.info("Daily score recompute starting", { count: activeUserIds.length });
      for (const { userId } of activeUserIds) {
        await scoreService.recompute(userId);
      }
      logger.info("Daily score recompute complete", { count: activeUserIds.length });
    });
  }
);

export const onTaskCompleted = inngest.createFunction(
  { id: "task.completed.score", name: "Task Completed Score Handler", triggers: [{ event: "task/completed" }] },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string };
    await step.sleep("debounce", "30s");
    await scoreService.recompute(userId);
  }
);
