import { teamRepository } from "../repositories/team.repository";
import type { TeamRole, Application, TeamMembership } from "../types";
import type {
  TeamRoleCreateInputType,
  ApplicationSubmitInputType,
  ApplicationDecideInputType,
} from "../schemas";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import { sendEvent } from "@/inngest/send";
import { checkRateLimit, rateLimits } from "@/lib/ratelimit";

export class TeamService {
  async openRole(userId: string, input: TeamRoleCreateInputType): Promise<TeamRole> {
    // Verify ownership
    const membership = await teamRepository.findMembership(input.teamId, userId);
    if (!membership || !["owner", "maintainer"].includes(membership.role)) {
      throw new ForbiddenError("Only team owners and maintainers can create roles");
    }
    return teamRepository.createRole(input);
  }

  async closeRole(roleId: string, userId: string): Promise<TeamRole> {
    const role = await teamRepository.findRoleById(roleId);
    if (!role) throw new NotFoundError("Role");
    const membership = await teamRepository.findMembership(role.teamId, userId);
    if (!membership || membership.role !== "owner") {
      throw new ForbiddenError("Only team owners can close roles");
    }
    return teamRepository.updateRole(roleId, { status: "closed" });
  }

  async getOpenRoles(teamId: string): Promise<TeamRole[]> {
    return teamRepository.listOpenRoles(teamId);
  }

  async getAllRoles(teamId: string): Promise<TeamRole[]> {
    return teamRepository.listAllRoles(teamId);
  }

  async submitApplication(
    userId: string,
    input: ApplicationSubmitInputType
  ): Promise<Application> {
    await checkRateLimit(rateLimits.applicationSubmit, userId);

    const role = await teamRepository.findRoleById(input.teamRoleId);
    if (!role) throw new NotFoundError("Role");
    if (role.status !== "open") {
      throw new ForbiddenError("This role is no longer accepting applications");
    }

    const application = await teamRepository.createApplication({
      ...input,
      applicantId: userId,
      status: "pending",
    });

    await sendEvent({
      name: "application/submitted",
      data: { applicationId: application.id, applicantId: userId, roleId: input.teamRoleId },
    });

    return application;
  }

  async decideApplication(
    applicationId: string,
    deciderId: string,
    input: ApplicationDecideInputType
  ): Promise<Application> {
    const application = await teamRepository.findApplicationById(applicationId);
    if (!application) throw new NotFoundError("Application");

    const role = await teamRepository.findRoleById(application.teamRoleId);
    if (!role) throw new NotFoundError("Role");

    const membership = await teamRepository.findMembership(role.teamId, deciderId);
    if (!membership || !["owner", "maintainer"].includes(membership.role)) {
      throw new ForbiddenError("Only team owners and maintainers can decide applications");
    }

    const updated = await teamRepository.updateApplication(applicationId, {
      status: input.decision,
      decidedAt: new Date(),
    });

    if (input.decision === "accepted") {
      // Create membership
      await teamRepository.createMembership({
        teamId: role.teamId,
        userId: application.applicantId,
        role: "member",
        joinedAt: new Date(),
      });

      // Close the role
      await teamRepository.updateRole(role.id, { status: "filled" });

      await sendEvent({
        name: "member/joined",
        data: {
          userId: application.applicantId,
          teamId: role.teamId,
          applicationId,
        },
      });
    }

    await sendEvent({
      name: "application/decided",
      data: {
        applicationId,
        applicantId: application.applicantId,
        decision: input.decision,
        roleTitle: role.title,
      },
    });

    return updated;
  }

  async getApplicationsForRole(roleId: string, requesterId: string): Promise<Application[]> {
    const role = await teamRepository.findRoleById(roleId);
    if (!role) throw new NotFoundError("Role");
    const membership = await teamRepository.findMembership(role.teamId, requesterId);
    if (!membership || !["owner", "maintainer"].includes(membership.role)) {
      throw new ForbiddenError("Only team members can view applications");
    }
    return teamRepository.listApplicationsForRole(roleId);
  }

  async getMembers(teamId: string): Promise<TeamMembership[]> {
    return teamRepository.listMembers(teamId);
  }
}

export const teamService = new TeamService();
