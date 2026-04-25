import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/cache";
import { db } from "@/lib/db";
import { users } from "../../../../../drizzle/schema";
import { env } from "@/env";
import { logger } from "@/lib/telemetry/logger";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const origin = req.nextUrl.origin;

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/settings/profile?error=github_invalid`);
  }

  // Validate state and look up userId
  const userId = await redis.get<string>(`github:oauth:state:${state}`);
  if (!userId) {
    return NextResponse.redirect(`${origin}/settings/profile?error=github_state_expired`);
  }
  await redis.del(`github:oauth:state:${state}`);

  // Exchange code for access token
  let accessToken: string;
  let githubUsername: string;
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_APP_CLIENT_ID,
        client_secret: env.GITHUB_APP_CLIENT_SECRET,
        code,
        redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/github/callback`,
      }),
    });

    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      throw new Error(tokenData.error ?? "No access token returned");
    }
    accessToken = tokenData.access_token;

    // Fetch GitHub username
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });
    const userData = (await userRes.json()) as { login?: string };
    if (!userData.login) throw new Error("Could not fetch GitHub username");
    githubUsername = userData.login;
  } catch (err) {
    logger.warn("GitHub OAuth exchange failed", { userId, err });
    return NextResponse.redirect(`${origin}/settings/profile?error=github_exchange`);
  }

  await db
    .update(users)
    .set({ githubUsername, githubAccessToken: accessToken, updatedAt: new Date() })
    .where(eq(users.id, userId));

  logger.info("GitHub account connected", { userId });

  return NextResponse.redirect(`${origin}/settings/profile?github=connected`);
}
