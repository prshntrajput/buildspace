import { inngest } from "./client";
import { logger } from "@/lib/telemetry/logger";

type InngestEvent = Parameters<typeof inngest.send>[0];

/**
 * Fire-and-forget wrapper around inngest.send().
 * Background events must never block user-facing operations. If the Inngest
 * dev server is not running, or the cloud API is unreachable, we log and
 * continue rather than propagating the error up to the caller.
 */
export async function sendEvent(event: InngestEvent): Promise<void> {
  try {
    await inngest.send(event);
  } catch (e) {
    logger.error("Failed to send Inngest event", {
      event: typeof event === "object" && event !== null && "name" in event
        ? (event as { name: string }).name
        : "unknown",
      error: String(e),
    });
  }
}
