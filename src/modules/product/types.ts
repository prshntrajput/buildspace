export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ownerId: string;
  ideaId: string | null;
  stage: "ideation" | "building" | "shipped" | "maintained" | "archived";
  techStack: string[];
  demoUrl: string | null;
  repoUrl: string | null;
  bannerUrl: string | null;
  metrics: Record<string, unknown>;
  visibility: "public" | "unlisted" | "private";
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BuildRoom = {
  id: string;
  productId: string;
  title: string;
  description: string | null;
  progressPct: number;
  executionMode: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductWithBuildRoom = Product & { buildRoom: BuildRoom };
