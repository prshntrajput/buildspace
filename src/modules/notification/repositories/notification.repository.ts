import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "../../../../drizzle/schema";

export type Notification = {
  id: string;
  userId: string;
  kind: string;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
};

function mapNotification(row: typeof notifications.$inferSelect): Notification {
  return {
    id: row.id,
    userId: row.userId,
    kind: row.kind,
    payload: (row.payload as Record<string, unknown>) ?? {},
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

export class NotificationRepository {
  async create(data: {
    userId: string;
    kind: string;
    payload: Record<string, unknown>;
  }): Promise<Notification> {
    const rows = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        kind: data.kind as typeof notifications.$inferInsert["kind"],
        payload: data.payload,
      })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to create notification");
    return mapNotification(row);
  }

  async listUnread(userId: string): Promise<Notification[]> {
    const rows = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    return rows.map(mapNotification);
  }

  async listAll(userId: string, limit = 20): Promise<Notification[]> {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return rows.map(mapNotification);
  }

  async markRead(id: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  }
}

export const notificationRepository = new NotificationRepository();
