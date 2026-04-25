"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  Lightbulb,
  Package,
  Hammer,
  User as UserIcon,
  Settings,
  LogOut,
  Zap,
  BarChart2,
  Download,
  Trash2,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/modules/user/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/products", label: "Products", icon: Package },
  { href: "/build-room", label: "Build Rooms", icon: Hammer },
];

const RANK_VARIANT: Record<string, "bronze" | "silver" | "gold" | "platinum"> = {
  bronze: "bronze",
  silver: "silver",
  gold: "gold",
  platinum: "platinum",
};

type Props = { user: User };

export function AppSidebar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(saved === "dark" || (!saved && prefersDark));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card h-full">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">BuildSpace</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t space-y-2">
          <Link
            href={`/profile/${user.handle}`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback>
                {user.displayName.slice(0, 2).toUpperCase() || user.handle.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName || user.handle}</p>
              <Badge variant={RANK_VARIANT[user.rankBucket] ?? "bronze"} className="text-[10px] py-0">
                {user.rankBucket}
              </Badge>
            </div>
          </Link>
          <Link
            href="/settings/score"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <BarChart2 className="h-4 w-4" />
            My Score
          </Link>
          <Link
            href="/settings/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <Link
            href="/settings/data-export"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Data
          </Link>
          <Link
            href="/settings/delete-account"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Link>
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {dark ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around bg-card border-t py-2 z-50">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs",
              pathname.startsWith(href) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
        <Link
          href={`/profile/${user.handle}`}
          className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-muted-foreground"
        >
          <UserIcon className="h-5 w-5" />
          Profile
        </Link>
      </nav>
    </>
  );
}
