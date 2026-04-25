import { eq, and, isNull, desc, sql, or, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { ideas, ideaUpvotes, ideaSaves, users } from "../../../../drizzle/schema";
import type { Idea, IdeaWithAuthor } from "../types";

function mapToIdea(row: typeof ideas.$inferSelect): Idea {
  return {
    id: row.id,
    slug: row.slug,
    authorId: row.authorId,
    title: row.title,
    problem: row.problem,
    targetUser: row.targetUser,
    solution: row.solution,
    mvpPlan: row.mvpPlan,
    tags: row.tags ?? [],
    status: row.status,
    visibility: row.visibility,
    upvoteCount: row.upvoteCount,
    saveCount: row.saveCount,
    commentCount: row.commentCount,
    forkOfId: row.forkOfId,
    aiReview: row.aiReview as Idea["aiReview"],
    duplicatesDetected: row.duplicatesDetected as Idea["duplicatesDetected"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class IdeaRepository {
  async create(data: Omit<typeof ideas.$inferInsert, "id" | "createdAt" | "updatedAt">): Promise<Idea> {
    const rows = await db.insert(ideas).values(data).returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to create idea");
    return mapToIdea(row);
  }

  async findById(id: string): Promise<Idea | null> {
    const rows = await db.select().from(ideas).where(eq(ideas.id, id)).limit(1);
    const row = rows[0];
    return row ? mapToIdea(row) : null;
  }

  async findBySlug(slug: string): Promise<Idea | null> {
    const rows = await db
      .select()
      .from(ideas)
      .where(and(eq(ideas.slug, slug), isNull(ideas.deletedAt)))
      .limit(1);
    const row = rows[0];
    return row ? mapToIdea(row) : null;
  }

  async findBySlugWithAuthor(slug: string): Promise<IdeaWithAuthor | null> {
    const rows = await db
      .select({
        idea: ideas,
        author: {
          id: users.id,
          handle: users.handle,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          rankBucket: users.rankBucket,
        },
      })
      .from(ideas)
      .innerJoin(users, eq(ideas.authorId, users.id))
      .where(and(eq(ideas.slug, slug), isNull(ideas.deletedAt)))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return { ...mapToIdea(row.idea), author: row.author };
  }

  async update(id: string, data: Partial<typeof ideas.$inferInsert>): Promise<Idea> {
    const rows = await db
      .update(ideas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ideas.id, id))
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Idea not found");
    return mapToIdea(row);
  }

  async listPublished(opts: {
    limit: number;
    cursor?: string;
    tags?: string[];
    query?: string;
  }): Promise<IdeaWithAuthor[]> {
    const conditions = [
      eq(ideas.status, "published"),
      eq(ideas.visibility, "public"),
      isNull(ideas.deletedAt),
    ];

    if (opts.tags && opts.tags.length > 0) {
      conditions.push(sql`${ideas.tags} @> ${JSON.stringify(opts.tags)}::text[]`);
    }

    if (opts.query) {
      conditions.push(
        or(
          ilike(ideas.title, `%${opts.query}%`),
          ilike(ideas.problem, `%${opts.query}%`)
        )!
      );
    }

    if (opts.cursor) {
      conditions.push(sql`${ideas.createdAt} < ${new Date(opts.cursor)}`);
    }

    const rows = await db
      .select({
        idea: ideas,
        author: {
          id: users.id,
          handle: users.handle,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          rankBucket: users.rankBucket,
        },
      })
      .from(ideas)
      .innerJoin(users, eq(ideas.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(ideas.createdAt))
      .limit(opts.limit);

    return rows.map((r) => ({ ...mapToIdea(r.idea), author: r.author }));
  }

  async listByAuthor(authorId: string): Promise<Idea[]> {
    const rows = await db
      .select()
      .from(ideas)
      .where(and(eq(ideas.authorId, authorId), isNull(ideas.deletedAt)))
      .orderBy(desc(ideas.createdAt));
    return rows.map(mapToIdea);
  }

  async listByAuthorWithAuthor(authorId: string): Promise<IdeaWithAuthor[]> {
    const rows = await db
      .select({
        idea: ideas,
        author: {
          id: users.id,
          handle: users.handle,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          rankBucket: users.rankBucket,
        },
      })
      .from(ideas)
      .innerJoin(users, eq(ideas.authorId, users.id))
      .where(and(eq(ideas.authorId, authorId), isNull(ideas.deletedAt)))
      .orderBy(desc(ideas.createdAt));
    return rows.map((r) => ({ ...mapToIdea(r.idea), author: r.author }));
  }

  async upvote(ideaId: string, userId: string): Promise<boolean> {
    try {
      await db.insert(ideaUpvotes).values({ ideaId, userId });
      await db
        .update(ideas)
        .set({ upvoteCount: sql`${ideas.upvoteCount} + 1` })
        .where(eq(ideas.id, ideaId));
      return true;
    } catch {
      // Already upvoted — remove upvote
      await db
        .delete(ideaUpvotes)
        .where(and(eq(ideaUpvotes.ideaId, ideaId), eq(ideaUpvotes.userId, userId)));
      await db
        .update(ideas)
        .set({ upvoteCount: sql`${ideas.upvoteCount} - 1` })
        .where(eq(ideas.id, ideaId));
      return false;
    }
  }

  async hasUpvoted(ideaId: string, userId: string): Promise<boolean> {
    const rows = await db
      .select()
      .from(ideaUpvotes)
      .where(and(eq(ideaUpvotes.ideaId, ideaId), eq(ideaUpvotes.userId, userId)))
      .limit(1);
    return rows.length > 0;
  }

  async hasSaved(ideaId: string, userId: string): Promise<boolean> {
    const rows = await db
      .select()
      .from(ideaSaves)
      .where(and(eq(ideaSaves.ideaId, ideaId), eq(ideaSaves.userId, userId)))
      .limit(1);
    return rows.length > 0;
  }

  async softDelete(id: string): Promise<void> {
    await db.update(ideas).set({ deletedAt: new Date() }).where(eq(ideas.id, id));
  }

  async updateEmbedding(id: string, embedding: number[]): Promise<void> {
    await db
      .update(ideas)
      .set({ embedding, updatedAt: new Date() })
      .where(eq(ideas.id, id));
  }

  async findSimilarByEmbedding(
    embedding: number[],
    excludeId: string,
    threshold = 0.92,
    limit = 5
  ): Promise<{ id: string; slug: string; title: string; similarity: number }[]> {
    // Use pgvector cosine distance operator <=> (lower = more similar)
    // Cosine similarity = 1 - cosine_distance
    const vectorLiteral = `[${embedding.join(",")}]`;
    const rows = await db.execute(
      sql`
        SELECT id, slug, title, 1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
        FROM ideas
        WHERE id != ${excludeId}
          AND embedding IS NOT NULL
          AND deleted_at IS NULL
          AND status = 'published'
        ORDER BY embedding <=> ${vectorLiteral}::vector
        LIMIT ${limit}
      `
    );
    return (rows as unknown as { id: string; slug: string; title: string; similarity: number }[])
      .filter((r) => r.similarity >= threshold);
  }
}

export const ideaRepository = new IdeaRepository();
