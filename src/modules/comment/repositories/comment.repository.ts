import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { comments, reactions, users } from "../../../../drizzle/schema";

export type Comment = {
  id: string;
  parentType: "idea" | "product" | "update" | "milestone";
  parentId: string;
  parentCommentId: string | null;
  authorId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type CommentWithAuthor = Comment & {
  author: { id: string; handle: string; displayName: string; avatarUrl: string | null };
};

function mapComment(row: typeof comments.$inferSelect): Comment {
  return {
    id: row.id,
    parentType: row.parentType,
    parentId: row.parentId,
    parentCommentId: row.parentCommentId,
    authorId: row.authorId,
    body: row.body,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

export class CommentRepository {
  async create(data: {
    parentType: Comment["parentType"];
    parentId: string;
    authorId: string;
    body: string;
    parentCommentId?: string;
  }): Promise<Comment> {
    const rows = await db
      .insert(comments)
      .values({
        parentType: data.parentType,
        parentId: data.parentId,
        authorId: data.authorId,
        body: data.body,
        parentCommentId: data.parentCommentId,
      })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to create comment");
    return mapComment(row);
  }

  async listByParent(
    parentType: Comment["parentType"],
    parentId: string
  ): Promise<Comment[]> {
    const rows = await db
      .select()
      .from(comments)
      .where(
        and(
          eq(comments.parentType, parentType),
          eq(comments.parentId, parentId),
          isNull(comments.deletedAt)
        )
      )
      .orderBy(desc(comments.createdAt));
    return rows.map(mapComment);
  }

  async listByParentWithAuthor(
    parentType: Comment["parentType"],
    parentId: string
  ): Promise<CommentWithAuthor[]> {
    const rows = await db
      .select({
        comment: comments,
        author: {
          id: users.id,
          handle: users.handle,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(
        and(
          eq(comments.parentType, parentType),
          eq(comments.parentId, parentId),
          isNull(comments.deletedAt)
        )
      )
      .orderBy(desc(comments.createdAt));
    return rows.map((row) => ({ ...mapComment(row.comment), author: row.author }));
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await db
      .update(comments)
      .set({ deletedAt: new Date(), body: "[deleted]" })
      .where(and(eq(comments.id, id), eq(comments.authorId, userId)));
  }

  async toggleReaction(
    userId: string,
    targetType: string,
    targetId: string,
    kind: string
  ): Promise<boolean> {
    try {
      await db.insert(reactions).values({ userId, targetType, targetId, kind });
      return true;
    } catch {
      await db
        .delete(reactions)
        .where(
          and(
            eq(reactions.userId, userId),
            eq(reactions.targetType, targetType),
            eq(reactions.targetId, targetId),
            eq(reactions.kind, kind)
          )
        );
      return false;
    }
  }
}

export const commentRepository = new CommentRepository();
