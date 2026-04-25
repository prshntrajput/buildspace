export type Idea = {
  id: string;
  slug: string;
  authorId: string;
  title: string;
  problem: string;
  targetUser: string;
  solution: string;
  mvpPlan: string | null;
  tags: string[];
  status: "draft" | "published" | "archived";
  visibility: "public" | "unlisted" | "private";
  upvoteCount: number;
  saveCount: number;
  commentCount: number;
  forkOfId: string | null;
  aiReview: IdeaAIReview | null;
  duplicatesDetected: { id: string; slug: string; title: string; similarity: number }[] | null;
  createdAt: Date;
  updatedAt: Date;
};

export type IdeaAIReview = {
  status: "pending" | "complete" | "failed";
  clarityScore: number;
  marketSignal: string;
  risks: string[];
  suggestions: string[];
  overallVerdict: "strong" | "moderate" | "weak";
  reviewedAt?: string;
};

export type IdeaWithAuthor = Idea & {
  author: {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    rankBucket: string;
  };
};
