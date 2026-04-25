export type Team = {
  id: string;
  productId: string;
  openRolesCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TeamRole = {
  id: string;
  teamId: string;
  title: string;
  description: string | null;
  requiredSkills: string[];
  status: "open" | "filled" | "closed";
  createdAt: Date;
  updatedAt: Date;
};

export type Application = {
  id: string;
  teamRoleId: string;
  applicantId: string;
  coverNote: string;
  links: string[];
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TeamMembership = {
  id: string;
  teamId: string;
  userId: string;
  role: "owner" | "maintainer" | "member";
  joinedAt: Date;
  createdAt: Date;
};
