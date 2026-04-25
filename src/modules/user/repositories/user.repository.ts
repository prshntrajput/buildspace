import { eq, and, isNull, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "../../../../drizzle/schema";
import type { User, PublicUser } from "../types";

function mapToUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    handle: row.handle,
    email: row.email,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    skills: row.skills ?? [],
    availability: row.availability,
    timezone: row.timezone,
    systemRole: row.systemRole,
    currentScore: row.currentScore,
    scoreDelta7d: row.scoreDelta7d,
    scoreDelta30d: row.scoreDelta30d,
    rankBucket: row.rankBucket,
    onboardingState: (row.onboardingState as User["onboardingState"]) ?? {
      role_selected: false,
      skills_added: false,
      goal_set: false,
    },
    goal: row.goal,
    isShadowBanned: row.isShadowBanned,
    githubUsername: row.githubUsername,
    xUsername: row.xUsername,
    linkedinUrl: row.linkedinUrl,
    websiteUrl: row.websiteUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapToPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    skills: row.skills ?? [],
    availability: row.availability,
    timezone: row.timezone,
    rankBucket: row.rankBucket,
    currentScore: row.currentScore,
    githubUsername: row.githubUsername,
    xUsername: row.xUsername,
    linkedinUrl: row.linkedinUrl,
    websiteUrl: row.websiteUrl,
    createdAt: row.createdAt,
  };
}

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const row = rows[0];
    return row ? mapToUser(row) : null;
  }

  async findByHandle(handle: string): Promise<PublicUser | null> {
    const rows = await db
      .select()
      .from(users)
      .where(and(eq(users.handle, handle), isNull(users.deletedAt)))
      .limit(1);
    const row = rows[0];
    return row ? mapToPublicUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const row = rows[0];
    return row ? mapToUser(row) : null;
  }

  async create(data: {
    id: string;
    email: string;
    handle: string;
    displayName?: string;
    avatarUrl?: string;
  }): Promise<User> {
    const rows = await db
      .insert(users)
      .values({
        id: data.id,
        email: data.email,
        handle: data.handle,
        displayName: data.displayName ?? "",
        avatarUrl: data.avatarUrl,
      })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to create user");
    return mapToUser(row);
  }

  async update(id: string, data: Partial<typeof users.$inferInsert>): Promise<User> {
    const rows = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    const row = rows[0];
    if (!row) throw new Error("User not found");
    return mapToUser(row);
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const rows = await db.select().from(users).where(inArray(users.id, ids));
    return rows.map(mapToUser);
  }

  async upsert(data: {
    id: string;
    email: string;
    handle: string;
    displayName?: string;
    avatarUrl?: string;
  }): Promise<User> {
    const existing = await this.findById(data.id);
    if (existing) {
      return this.update(data.id, {
        displayName: data.displayName ?? existing.displayName,
        avatarUrl: data.avatarUrl ?? existing.avatarUrl ?? null,
      });
    }
    return this.create(data);
  }
}

export const userRepository = new UserRepository();
