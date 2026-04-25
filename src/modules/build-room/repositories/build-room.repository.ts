import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks, updates, milestones, buildRooms } from "../../../../drizzle/schema";
import type { Task, Update, Milestone } from "../types";

function mapTask(row: typeof tasks.$inferSelect): Task {
  return {
    id: row.id,
    buildRoomId: row.buildRoomId,
    title: row.title,
    description: row.description,
    status: row.status,
    assigneeId: row.assigneeId,
    dueDate: row.dueDate,
    estimateMinutes: row.estimateMinutes,
    proofUrl: row.proofUrl,
    milestoneId: row.milestoneId,
    weight: row.weight,
    completedAt: row.completedAt,
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapUpdate(row: typeof updates.$inferSelect): Update {
  return {
    id: row.id,
    buildRoomId: row.buildRoomId,
    authorId: row.authorId,
    body: row.body as Record<string, unknown>,
    weekNumber: row.weekNumber,
    year: row.year,
    summary: row.summary,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapMilestone(row: typeof milestones.$inferSelect): Milestone {
  return {
    id: row.id,
    buildRoomId: row.buildRoomId,
    title: row.title,
    description: row.description,
    targetDate: row.targetDate,
    achievedAt: row.achievedAt,
    verifiedBy: row.verifiedBy ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class BuildRoomRepository {
  async createTask(data: Omit<typeof tasks.$inferInsert, "id" | "createdAt" | "updatedAt">): Promise<Task> {
    const rows = await db.insert(tasks).values(data).returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to create task");
    return mapTask(row);
  }

  async findTaskById(id: string): Promise<Task | null> {
    const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    const row = rows[0];
    return row ? mapTask(row) : null;
  }

  async listTasksByBuildRoom(buildRoomId: string): Promise<Task[]> {
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.buildRoomId, buildRoomId))
      .orderBy(desc(tasks.createdAt));
    return rows.map(mapTask);
  }

  async updateTask(id: string, data: Partial<typeof tasks.$inferInsert>): Promise<Task> {
    const rows = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Task not found");
    return mapTask(row);
  }

  async createUpdate(data: Omit<typeof updates.$inferInsert, "id" | "createdAt" | "updatedAt">): Promise<Update> {
    const rows = await db.insert(updates).values(data).returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to create update");
    return mapUpdate(row);
  }

  async listUpdatesByBuildRoom(buildRoomId: string): Promise<Update[]> {
    const rows = await db
      .select()
      .from(updates)
      .where(eq(updates.buildRoomId, buildRoomId))
      .orderBy(desc(updates.createdAt));
    return rows.map(mapUpdate);
  }

  async createMilestone(data: Omit<typeof milestones.$inferInsert, "id" | "createdAt" | "updatedAt">): Promise<Milestone> {
    const rows = await db.insert(milestones).values(data).returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to create milestone");
    return mapMilestone(row);
  }

  async listMilestonesByBuildRoom(buildRoomId: string): Promise<Milestone[]> {
    const rows = await db
      .select()
      .from(milestones)
      .where(eq(milestones.buildRoomId, buildRoomId))
      .orderBy(desc(milestones.createdAt));
    return rows.map(mapMilestone);
  }

  async updateMilestone(id: string, data: Partial<typeof milestones.$inferInsert>): Promise<Milestone> {
    const rows = await db
      .update(milestones)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(milestones.id, id))
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Milestone not found");
    return mapMilestone(row);
  }

  async updateProgress(buildRoomId: string): Promise<number> {
    const allTasks = await db
      .select({ status: tasks.status, weight: tasks.weight })
      .from(tasks)
      .where(eq(tasks.buildRoomId, buildRoomId));

    const total = allTasks.reduce((sum, t) => sum + t.weight, 0);
    const done = allTasks
      .filter((t) => t.status === "done")
      .reduce((sum, t) => sum + t.weight, 0);

    const pct = total === 0 ? 0 : Math.round((done / total) * 100);

    await db
      .update(buildRooms)
      .set({ progressPct: pct, updatedAt: new Date() })
      .where(eq(buildRooms.id, buildRoomId));

    return pct;
  }
}

export const buildRoomRepository = new BuildRoomRepository();
