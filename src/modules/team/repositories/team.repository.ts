import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { teams, teamRoles, applications, teamMemberships } from "../../../../drizzle/schema";
import type { Team, TeamRole, Application, TeamMembership } from "../types";

function mapTeam(row: typeof teams.$inferSelect): Team {
  return {
    id: row.id,
    productId: row.productId,
    openRolesCount: row.openRolesCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapRole(row: typeof teamRoles.$inferSelect): TeamRole {
  return {
    id: row.id,
    teamId: row.teamId,
    title: row.title,
    description: row.description,
    requiredSkills: row.requiredSkills ?? [],
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapApplication(row: typeof applications.$inferSelect): Application {
  return {
    id: row.id,
    teamRoleId: row.teamRoleId,
    applicantId: row.applicantId,
    coverNote: row.coverNote,
    links: row.links ?? [],
    status: row.status,
    decidedAt: row.decidedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapMembership(row: typeof teamMemberships.$inferSelect): TeamMembership {
  return {
    id: row.id,
    teamId: row.teamId,
    userId: row.userId,
    role: row.role,
    joinedAt: row.joinedAt,
    createdAt: row.createdAt,
  };
}

export class TeamRepository {
  async findTeamById(id: string): Promise<Team | null> {
    const rows = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    const row = rows[0];
    return row ? mapTeam(row) : null;
  }

  async findTeamByProductId(productId: string): Promise<Team | null> {
    const rows = await db
      .select()
      .from(teams)
      .where(eq(teams.productId, productId))
      .limit(1);
    const row = rows[0];
    return row ? mapTeam(row) : null;
  }

  async findMembership(teamId: string, userId: string): Promise<TeamMembership | null> {
    const rows = await db
      .select()
      .from(teamMemberships)
      .where(and(eq(teamMemberships.teamId, teamId), eq(teamMemberships.userId, userId)))
      .limit(1);
    const row = rows[0];
    return row ? mapMembership(row) : null;
  }

  async createRole(data: Omit<typeof teamRoles.$inferInsert, "id" | "createdAt" | "updatedAt">): Promise<TeamRole> {
    const rows = await db.insert(teamRoles).values(data).returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to create role");
    return mapRole(row);
  }

  async findRoleById(id: string): Promise<TeamRole | null> {
    const rows = await db.select().from(teamRoles).where(eq(teamRoles.id, id)).limit(1);
    const row = rows[0];
    return row ? mapRole(row) : null;
  }

  async listOpenRoles(teamId: string): Promise<TeamRole[]> {
    const rows = await db
      .select()
      .from(teamRoles)
      .where(and(eq(teamRoles.teamId, teamId), eq(teamRoles.status, "open")))
      .orderBy(desc(teamRoles.createdAt));
    return rows.map(mapRole);
  }

  async listAllRoles(teamId: string): Promise<TeamRole[]> {
    const rows = await db
      .select()
      .from(teamRoles)
      .where(eq(teamRoles.teamId, teamId))
      .orderBy(desc(teamRoles.createdAt));
    return rows.map(mapRole);
  }

  async updateRole(id: string, data: Partial<typeof teamRoles.$inferInsert>): Promise<TeamRole> {
    const rows = await db
      .update(teamRoles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(teamRoles.id, id))
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Role not found");
    return mapRole(row);
  }

  async createApplication(data: Omit<typeof applications.$inferInsert, "id" | "createdAt" | "updatedAt">): Promise<Application> {
    const rows = await db.insert(applications).values(data).returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to create application");
    return mapApplication(row);
  }

  async findApplicationById(id: string): Promise<Application | null> {
    const rows = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
    const row = rows[0];
    return row ? mapApplication(row) : null;
  }

  async updateApplication(id: string, data: Partial<typeof applications.$inferInsert>): Promise<Application> {
    const rows = await db
      .update(applications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Application not found");
    return mapApplication(row);
  }

  async listApplicationsForRole(teamRoleId: string): Promise<Application[]> {
    const rows = await db
      .select()
      .from(applications)
      .where(eq(applications.teamRoleId, teamRoleId))
      .orderBy(desc(applications.createdAt));
    return rows.map(mapApplication);
  }

  async createMembership(data: Omit<typeof teamMemberships.$inferInsert, "id" | "createdAt">): Promise<TeamMembership> {
    const rows = await db.insert(teamMemberships).values(data).returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to create membership");
    return mapMembership(row);
  }

  async listMembers(teamId: string): Promise<TeamMembership[]> {
    const rows = await db
      .select()
      .from(teamMemberships)
      .where(eq(teamMemberships.teamId, teamId));
    return rows.map(mapMembership);
  }

  async listProductIdsByMember(userId: string): Promise<string[]> {
    const rows = await db
      .select({ productId: teams.productId })
      .from(teamMemberships)
      .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
      .where(eq(teamMemberships.userId, userId));
    return rows.map((r) => r.productId);
  }
}

export const teamRepository = new TeamRepository();
