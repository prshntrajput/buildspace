"use server";

import { getUser } from "@/lib/auth/server";
import { handleError } from "@/lib/errors";
import { notificationService } from "./services/notification.service";

export async function getNotificationsAction() {
  try {
    const user = await getUser();
    const notifications = await notificationService.getAll(user.id);
    return { ok: true as const, data: notifications };
  } catch (e) {
    return handleError(e);
  }
}

export async function markNotificationReadAction(id: string) {
  try {
    const user = await getUser();
    await notificationService.markRead(id, user.id);
    return { ok: true as const };
  } catch (e) {
    return handleError(e);
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const user = await getUser();
    await notificationService.markAllRead(user.id);
    return { ok: true as const };
  } catch (e) {
    return handleError(e);
  }
}
