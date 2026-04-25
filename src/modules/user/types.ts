export type User = {
  id: string;
  handle: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  skills: string[];
  availability: "full_time" | "part_time" | "weekends" | "unavailable";
  timezone: string;
  systemRole: "user" | "mod" | "admin";
  currentScore: string;
  scoreDelta7d: string;
  scoreDelta30d: string;
  rankBucket: "bronze" | "silver" | "gold" | "platinum";
  onboardingState: {
    role_selected: boolean;
    skills_added: boolean;
    goal_set: boolean;
    roles?: string[];
  };
  goal: string | null;
  isShadowBanned: boolean;
  githubUsername: string | null;
  xUsername: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = Pick<
  User,
  | "id"
  | "handle"
  | "displayName"
  | "avatarUrl"
  | "bio"
  | "skills"
  | "availability"
  | "timezone"
  | "rankBucket"
  | "currentScore"
  | "githubUsername"
  | "xUsername"
  | "linkedinUrl"
  | "websiteUrl"
  | "createdAt"
>;
