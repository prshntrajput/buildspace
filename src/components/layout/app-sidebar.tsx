"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
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
  Bell,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/modules/user/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/modules/notification/_actions";

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

const KIND_LABEL: Record<string, string> = {
  mention: "mentioned you",
  application_received: "new application",
  application_decided: "application decided",
  task_assigned: "task assigned to you",
  task_due_soon: "task due soon",
  update_posted_in_followed: "new update",
  backing_received: "new backer",
  streak_broken: "streak broken",
  weekly_digest: "weekly digest",
};

type NotificationItem = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
};

type Props = { user: User; initialUnreadCount: number };

export function AppSidebar({ user, initialUnreadCount }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [dark, setDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  function handleNotifOpenChange(next: boolean) {
    setNotifOpen(next);
    if (next && notifications.length === 0) {
      startTransition(async () => {
        const result = await getNotificationsAction();
        if (result.ok) setNotifications(result.data as NotificationItem[]);
      });
    }
  }

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
      setUnreadCount(0);
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card h-full">
        {/* Logo + notification bell */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">BuildSpace</span>
          </div>

          <DropdownMenu open={notifOpen} onOpenChange={handleNotifOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto py-0.5 px-2 text-xs"
                    onClick={handleMarkAllRead}
                    disabled={isPending}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              {isPending && notifications.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className={`flex flex-col items-start gap-0.5 py-2 cursor-pointer ${
                      !n.readAt ? "bg-muted/50" : ""
                    }`}
                    onClick={() => !n.readAt && handleMarkRead(n.id)}
                  >
                    <span className="text-sm font-medium capitalize">
                      {KIND_LABEL[n.kind] ?? n.kind.replace(/_/g, " ")}
                    </span>
                    {n.readAt === null && (
                      <span className="text-xs text-primary">• unread</span>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* ── Mobile bottom nav ───────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around bg-card border-t py-2 z-40">
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
        {/* More button — shows the slide-up menu with profile/settings/sign-out */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1 text-xs text-muted-foreground relative"
        >
          <div className="relative">
            <UserIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          More
        </button>
      </nav>

      {/* ── Mobile slide-up menu ────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            {/* User info header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatarUrl ?? undefined} />
                <AvatarFallback>
                  {user.displayName.slice(0, 2).toUpperCase() || user.handle.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.displayName || user.handle}</p>
                <Badge variant={RANK_VARIANT[user.rankBucket] ?? "bronze"} className="text-[10px] py-0">
                  {user.rankBucket}
                </Badge>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground p-1 rounded-md hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="px-3 py-2 space-y-0.5">
              <Link
                href={`/profile/${user.handle}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
              >
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                View Profile
              </Link>
              <Link
                href="/settings/score"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm hover:bg-accent transition-colors"
              >
                <BarChart2 className="h-5 w-5 text-muted-foreground" />
                My Score
              </Link>
              <Link
                href="/settings/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm hover:bg-accent transition-colors"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
                Settings
              </Link>
              <Link
                href="/settings/data-export"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm hover:bg-accent transition-colors"
              >
                <Download className="h-5 w-5 text-muted-foreground" />
                Export Data
              </Link>
              <button
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm hover:bg-accent transition-colors"
              >
                {dark ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
                {dark ? "Light mode" : "Dark mode"}
              </button>

              <div className="pt-1 border-t space-y-0.5">
                <Link
                  href="/settings/delete-account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                  Delete Account
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              </div>
            </div>

            {/* Safe area spacer for home indicator */}
            <div className="h-8" />
          </div>
        </div>
      )}
    </>
  );
}
