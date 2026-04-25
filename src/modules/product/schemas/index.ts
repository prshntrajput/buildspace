import { z } from "zod";

export const ProductCreateInput = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  ideaId: z.string().uuid().optional(),
  techStack: z.array(z.string()).max(15).default([]),
  demoUrl: z.string().url().optional().or(z.literal("")),
  repoUrl: z.string().url().optional().or(z.literal("")),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
});

export const ProductUpdateInput = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  techStack: z.array(z.string()).max(15).optional(),
  demoUrl: z.string().url().optional().or(z.literal("")),
  repoUrl: z.string().url().optional().or(z.literal("")),
  visibility: z.enum(["public", "unlisted", "private"]).optional(),
  bannerUrl: z.string().url().optional(),
});

export const StageTransitionInput = z.object({
  stage: z.enum(["ideation", "building", "shipped", "maintained", "archived"]),
});

export type ProductCreateInputType = z.infer<typeof ProductCreateInput>;
export type ProductUpdateInputType = z.infer<typeof ProductUpdateInput>;
export type StageTransitionInputType = z.infer<typeof StageTransitionInput>;
