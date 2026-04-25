import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { redis } from "@/lib/cache";
import { getUser } from "@/lib/auth/server";
import { env } from "@/env";

export async function GET(req: NextRequest) {
  let userId: string;
  try {
    const user = await getUser();
    userId = user.id;
  } catch {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  const state = randomBytes(16).toString("hex");
  // Store state → userId mapping in Redis, TTL 10 minutes
  await redis.setex(`github:oauth:state:${state}`, 600, userId);

  const params = new URLSearchParams({
    client_id: env.GITHUB_APP_CLIENT_ID,
    scope: "read:user,repo",
    state,
    redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/github/callback`,
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
}
