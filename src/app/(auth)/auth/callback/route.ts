import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { userService } from "@/modules/user/services/user.service";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/feed";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${error.message}`);
  }

  const { user } = data.session;

  // Ensure user exists in our database
  if (user) {
    try {
      await userService.ensureUser({
        id: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.["full_name"] ?? user.user_metadata?.["name"],
        avatarUrl:
          user.user_metadata?.["avatar_url"] ??
          user.user_metadata?.["picture"],
      });
    } catch {
      // Non-fatal — user will still be redirected
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
