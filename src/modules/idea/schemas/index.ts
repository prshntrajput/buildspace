import { z } from "zod";

export const IdeaCreateInput = z.object({
  title: z.string().min(8).max(120),
  problem: z.string().min(20).max(2000),
  targetUser: z.string().min(10).max(500),
  solution: z.string().min(20).max(2000),
  mvpPlan: z.string().max(1000).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const IdeaUpdateInput = z.object({
  title: z.string().min(8).max(120).optional(),
  problem: z.string().min(20).max(2000).optional(),
  targetUser: z.string().min(10).max(500).optional(),
  solution: z.string().min(20).max(2000).optional(),
  mvpPlan: z.string().max(1000).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  visibility: z.enum(["public", "unlisted", "private"]).optional(),
});

export const IdeaSearchInput = z.object({
  query: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

export type IdeaCreateInputType = z.infer<typeof IdeaCreateInput>;
export type IdeaUpdateInputType = z.infer<typeof IdeaUpdateInput>;
export type IdeaSearchInputType = z.infer<typeof IdeaSearchInput>;
