import { ideaRepository } from "../repositories/idea.repository";
import type { Idea, IdeaWithAuthor } from "../types";
import type { IdeaCreateInputType, IdeaUpdateInputType, IdeaSearchInputType } from "../schemas";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { sendEvent } from "@/inngest/send";
import { invalidate } from "@/lib/cache";
import { v4 as uuidv4 } from "uuid";

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export class IdeaService {
  async create(userId: string, input: IdeaCreateInputType): Promise<Idea> {
    const slug = generateSlug(input.title);
    const idea = await ideaRepository.create({
      ...input,
      slug,
      authorId: userId,
      upvoteCount: 0,
      saveCount: 0,
      commentCount: 0,
    });

    if (input.status === "published") {
      await sendEvent({
        name: "idea/created",
        data: { ideaId: idea.id, authorId: userId },
      });
    }

    return idea;
  }

  async publish(ideaId: string, userId: string): Promise<Idea> {
    const idea = await ideaRepository.findById(ideaId);
    if (!idea) throw new NotFoundError("Idea");
    if (idea.authorId !== userId) throw new ForbiddenError("Only the author can publish this idea");

    const updated = await ideaRepository.update(ideaId, { status: "published" });

    await sendEvent({
      name: "idea/created",
      data: { ideaId, authorId: userId },
    });

    return updated;
  }

  async getBySlug(slug: string, viewerId?: string): Promise<IdeaWithAuthor> {
    const idea = await ideaRepository.findBySlugWithAuthor(slug);
    if (!idea) throw new NotFoundError("Idea");
    if (idea.visibility === "private" && idea.authorId !== viewerId) {
      throw new ForbiddenError("This idea is private");
    }
    return idea;
  }

  async update(ideaId: string, userId: string, input: IdeaUpdateInputType): Promise<Idea> {
    const idea = await ideaRepository.findById(ideaId);
    if (!idea) throw new NotFoundError("Idea");
    if (idea.authorId !== userId) throw new ForbiddenError("Only the author can edit this idea");
    const updated = await ideaRepository.update(ideaId, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.problem !== undefined ? { problem: input.problem } : {}),
      ...(input.targetUser !== undefined ? { targetUser: input.targetUser } : {}),
      ...(input.solution !== undefined ? { solution: input.solution } : {}),
      ...(input.mvpPlan !== undefined ? { mvpPlan: input.mvpPlan } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
    });
    await invalidate(`idea:${idea.slug}`);
    return updated;
  }

  async search(input: IdeaSearchInputType): Promise<IdeaWithAuthor[]> {
    return ideaRepository.listPublished({
      limit: input.limit,
      ...(input.cursor !== undefined ? { cursor: input.cursor } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.query !== undefined ? { query: input.query } : {}),
    });
  }

  async delete(ideaId: string, userId: string): Promise<void> {
    const idea = await ideaRepository.findById(ideaId);
    if (!idea) throw new NotFoundError("Idea");
    if (idea.authorId !== userId) throw new ForbiddenError("Only the author can delete this idea");
    await ideaRepository.softDelete(ideaId);
  }

  async hasUpvoted(ideaId: string, userId: string): Promise<boolean> {
    return ideaRepository.hasUpvoted(ideaId, userId);
  }

  async upvote(ideaId: string, userId: string): Promise<{ upvoted: boolean }> {
    const idea = await ideaRepository.findById(ideaId);
    if (!idea) throw new NotFoundError("Idea");
    const upvoted = await ideaRepository.upvote(ideaId, userId);
    return { upvoted };
  }

  async fork(ideaId: string, userId: string): Promise<Idea> {
    const original = await ideaRepository.findById(ideaId);
    if (!original) throw new NotFoundError("Idea");

    const slug = generateSlug(`${original.title} fork`);
    const forked = await ideaRepository.create({
      slug,
      authorId: userId,
      title: `${original.title} (Fork)`,
      problem: original.problem,
      targetUser: original.targetUser,
      solution: original.solution,
      mvpPlan: original.mvpPlan,
      tags: original.tags,
      status: "draft",
      visibility: "private",
      forkOfId: ideaId,
      upvoteCount: 0,
      saveCount: 0,
      commentCount: 0,
    });

    return forked;
  }

  async getTrendingTags(limit = 10): Promise<{ tag: string; count: number }[]> {
    return ideaRepository.getTrendingTags(limit);
  }

  async getUserIdeas(userId: string, _viewerId?: string): Promise<IdeaWithAuthor[]> {
    return ideaRepository.listByAuthorWithAuthor(userId);
  }
}

export const ideaService = new IdeaService();
