"use client";

import { useState, useEffect, useTransition } from "react";
import { Bell, Moon, Sun, Search, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/modules/user/types";
import Link from "next/link";
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/modules/notification/_actions";

type NotificationItem = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
};

type Props = { user: User; initialUnreadCount: number };

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

export function AppTopbar({ user: _user, initialUnreadCount }: Props) {
  const [dark, setDark] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
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

  function handleOpenChange(next: boolean) {
    setOpen(next);
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

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b bg-card lg:hidden">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <span className="font-bold">BuildSpace</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Link href="/feed">
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </Link>

        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
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
    </header>
  );
}
