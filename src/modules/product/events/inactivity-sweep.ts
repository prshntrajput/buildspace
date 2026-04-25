import { inngest } from "@/inngest/client";
import { productService } from "../services/product.service";
import { logger } from "@/lib/telemetry/logger";

export const inactivitySweep = inngest.createFunction(
  { id: "inactivity.sweep.hourly", name: "Hourly Inactivity Sweep", triggers: [{ cron: "0 * * * *" }] },
  async ({ step }) => {
    await step.run("auto-archive-inactive", async () => {
      logger.info("Inactivity sweep starting");
      await productService.autoArchiveInactive();
      logger.info("Inactivity sweep complete");
    });
  }
);
