import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/cache";
import { RateLimitError } from "@/lib/errors";

export const rateLimits = {
  authedMutation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "rl:authed",
  }),
  publicRead: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, "1 m"),
    prefix: "rl:public",
  }),
  aiFree: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "rl:ai:free",
  }),
  commentPost: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "rl:comment",
  }),
  applicationSubmit: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, "1 h"),
    prefix: "rl:apply",
  }),
};

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<void> {
  const { success } = await limiter.limit(identifier);
  if (!success) {
    throw new RateLimitError();
  }
}
