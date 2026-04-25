import { commentRepository, type Comment, type CommentWithAuthor } from "../repositories/comment.repository";
import { sendEvent } from "@/inngest/send";
import { checkRateLimit, rateLimits } from "@/lib/ratelimit";

const MENTION_REGEX = /@([a-z0-9_-]+)/gi;

function extractMentions(body: string): string[] {
  const matches = [...body.matchAll(MENTION_REGEX)];
  return [...new Set(matches.map((m) => m[1] ?? "").filter(Boolean))];
}

export class CommentService {
  async create(
    userId: string,
    data: {
      parentType: Comment["parentType"];
      parentId: string;
      body: string;
      parentCommentId?: string;
    }
  ): Promise<Comment> {
    await checkRateLimit(rateLimits.commentPost, userId);

    const comment = await commentRepository.create({ ...data, authorId: userId });

    const mentions = extractMentions(data.body);
    if (mentions.length > 0) {
      await sendEvent({
        name: "comment/mentioned",
        data: { commentId: comment.id, authorId: userId, handles: mentions },
      });
    }

    return comment;
  }

  async getThread(
    parentType: Comment["parentType"],
    parentId: string
  ): Promise<Comment[]> {
    return commentRepository.listByParent(parentType, parentId);
  }

  async getThreadWithAuthors(
    parentType: Comment["parentType"],
    parentId: string
  ): Promise<CommentWithAuthor[]> {
    return commentRepository.listByParentWithAuthor(parentType, parentId);
  }

  async delete(commentId: string, userId: string): Promise<void> {
    await commentRepository.softDelete(commentId, userId);
  }

  async toggleReaction(
    userId: string,
    targetType: string,
    targetId: string,
    kind: string
  ): Promise<{ reacted: boolean }> {
    const reacted = await commentRepository.toggleReaction(userId, targetType, targetId, kind);
    return { reacted };
  }
}

export const commentService = new CommentService();
