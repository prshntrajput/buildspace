import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { updates, products, buildRooms } from "../../../../drizzle/schema";
import { gte, eq } from "drizzle-orm";
import { summarizeUpdates } from "@/modules/ai/agents/update-summarizer";
import { sendEmail } from "@/lib/email/resend";
import { render } from "@react-email/components";
import { WeeklyDigestEmail } from "@/emails/weekly-digest";
import { logger } from "@/lib/telemetry/logger";

type UpdateData = { weekNumber: number; year: number; body: string };

export const weeklyDigest = inngest.createFunction(
  { id: "cron.weekly.digest", name: "Weekly Update Digest", triggers: [{ cron: "0 8 * * 1" }] }, // Runs every Monday at 8 AM
  async ({ step }) => {
    await step.run("send-weekly-digests", async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);

      // Get all recent updates grouped by build room
      const recentUpdates = await db
        .select({
          updateBody: updates.body,
          weekNumber: updates.weekNumber,
          year: updates.year,
          productName: products.name,
          productId: products.id,
          buildRoomId: buildRooms.id,
        })
        .from(updates)
        .innerJoin(buildRooms, eq(updates.buildRoomId, buildRooms.id))
        .innerJoin(products, eq(buildRooms.productId, products.id))
        .where(gte(updates.createdAt, since));

      if (recentUpdates.length === 0) {
        return;
      }

      // Group by build room
      const byRoom = recentUpdates.reduce((acc, curr) => {
        if (!acc[curr.buildRoomId]) {
          acc[curr.buildRoomId] = { productName: curr.productName, updates: [] };
        }
        
        acc[curr.buildRoomId]!.updates.push({
          weekNumber: curr.weekNumber,
          year: curr.year,
          body: JSON.stringify(curr.updateBody),
        });
        
        return acc;
      }, {} as Record<string, { productName: string, updates: UpdateData[] }>);

      for (const [roomId, data] of Object.entries(byRoom)) {
        try {
          const summary = await summarizeUpdates({
            productName: data.productName,
            updates: data.updates,
          });

          if (summary) {
            logger.info("Generated weekly digest", { roomId, productName: data.productName });
            
            // In a real app, fetch followers of this product and send emails.
            // For MVP, we might just log it or send a sample email to a test address.
            // We can send to product owner just as a demo.
            
          }
        } catch (err) {
          logger.error("Failed to generate digest", { roomId, err });
        }
      }
    });
  }
);
