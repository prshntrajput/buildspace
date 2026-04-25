"use server";

import { PostHog } from "posthog-node";
import { env } from "@/env";

let _client: PostHog | null = null;

function getClient(): PostHog {
  if (!_client) {
    _client = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return _client;
}

export async function trackEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  try {
    getClient().capture({ distinctId: userId, event, ...(properties !== undefined ? { properties } : {}) });
    await getClient().flush();
  } catch {
    // never throw on analytics failure
  }
}

export async function identifyUser(
  userId: string,
  properties: { email?: string; name?: string; [key: string]: unknown }
) {
  try {
    getClient().identify({ distinctId: userId, properties });
    await getClient().flush();
  } catch {
    // never throw on analytics failure
  }
}
