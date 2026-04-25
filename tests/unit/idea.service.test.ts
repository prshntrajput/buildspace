import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

// Mock dependencies that touch DB / external services
vi.mock("@/modules/idea/repositories/idea.repository", () => ({
  ideaRepository: {
    create: vi.fn(),
    findById: vi.fn(),
    findBySlugWithAuthor: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listPublished: vi.fn(),
  },
}));

vi.mock("@/inngest/send", () => ({
  sendEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/cache", () => ({
  invalidate: vi.fn().mockResolvedValue(undefined),
  getOrSet: vi.fn(),
}));

import { ideaRepository } from "@/modules/idea/repositories/idea.repository";
import { IdeaService } from "@/modules/idea/services/idea.service";
import type { Idea, IdeaWithAuthor } from "@/modules/idea/types";

const mockIdea = (overrides: Partial<Idea> = {}): Idea => ({
  id: "idea-1",
  slug: "test-idea-abc1",
  authorId: "user-1",
  title: "Test Idea",
  problem: "A real problem",
  targetUser: "Developers",
  solution: "A solid solution",
  mvpPlan: null,
  tags: ["test"],
  status: "draft",
  visibility: "public",
  upvoteCount: 0,
  saveCount: 0,
  commentCount: 0,
  forkOfId: null,
  aiReview: null,
  duplicatesDetected: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("IdeaService", () => {
  let service: IdeaService;

  beforeEach(() => {
    service = new IdeaService();
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("creates an idea and returns it", async () => {
      const idea = mockIdea();
      vi.mocked(ideaRepository.create).mockResolvedValue(idea);

      const result = await service.create("user-1", {
        title: "Test Idea",
        problem: "A real problem",
        targetUser: "Developers",
        solution: "A solid solution",
        tags: ["test"],
        status: "draft",
        visibility: "public",
      });

      expect(ideaRepository.create).toHaveBeenCalledOnce();
      expect(result.title).toBe("Test Idea");
    });

    it("emits idea/created event when published", async () => {
      const { sendEvent } = await import("@/inngest/send");
      const idea = mockIdea({ status: "published" });
      vi.mocked(ideaRepository.create).mockResolvedValue(idea);

      await service.create("user-1", {
        title: "Test Idea",
        problem: "A real problem",
        targetUser: "Developers",
        solution: "A solid solution",
        tags: [],
        status: "published",
        visibility: "public",
      });

      expect(sendEvent).toHaveBeenCalledWith(
        expect.objectContaining({ name: "idea/created" })
      );
    });

    it("does not emit event for draft ideas", async () => {
      const { sendEvent } = await import("@/inngest/send");
      const idea = mockIdea({ status: "draft" });
      vi.mocked(ideaRepository.create).mockResolvedValue(idea);

      await service.create("user-1", {
        title: "Test Idea",
        problem: "A real problem",
        targetUser: "Developers",
        solution: "A solid solution",
        tags: [],
        status: "draft",
        visibility: "public",
      });

      expect(sendEvent).not.toHaveBeenCalled();
    });
  });

  describe("publish", () => {
    it("throws NotFoundError when idea does not exist", async () => {
      vi.mocked(ideaRepository.findById).mockResolvedValue(null);
      await expect(service.publish("idea-1", "user-1")).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError when non-author tries to publish", async () => {
      vi.mocked(ideaRepository.findById).mockResolvedValue(mockIdea({ authorId: "user-1" }));
      await expect(service.publish("idea-1", "user-2")).rejects.toThrow(ForbiddenError);
    });

    it("publishes the idea and emits event", async () => {
      const { sendEvent } = await import("@/inngest/send");
      const idea = mockIdea({ authorId: "user-1" });
      vi.mocked(ideaRepository.findById).mockResolvedValue(idea);
      vi.mocked(ideaRepository.update).mockResolvedValue({ ...idea, status: "published" });

      await service.publish("idea-1", "user-1");

      expect(ideaRepository.update).toHaveBeenCalledWith("idea-1", { status: "published" });
      expect(sendEvent).toHaveBeenCalledWith(
        expect.objectContaining({ name: "idea/created" })
      );
    });
  });

  describe("getBySlug", () => {
    it("throws NotFoundError for unknown slug", async () => {
      vi.mocked(ideaRepository.findBySlugWithAuthor).mockResolvedValue(null);
      await expect(service.getBySlug("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError for private idea viewed by non-owner", async () => {
      const idea = mockIdea({ visibility: "private", authorId: "user-1" }) as IdeaWithAuthor;
      vi.mocked(ideaRepository.findBySlugWithAuthor).mockResolvedValue(idea);
      await expect(service.getBySlug("test-idea-abc1", "user-2")).rejects.toThrow(ForbiddenError);
    });

    it("allows owner to view private idea", async () => {
      const idea = mockIdea({ visibility: "private", authorId: "user-1" }) as IdeaWithAuthor;
      vi.mocked(ideaRepository.findBySlugWithAuthor).mockResolvedValue(idea);
      await expect(service.getBySlug("test-idea-abc1", "user-1")).resolves.toBeDefined();
    });
  });
});
