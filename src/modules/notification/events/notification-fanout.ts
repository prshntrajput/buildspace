import React from "react";
import { inngest } from "@/inngest/client";
import { notificationService } from "../services/notification.service";
import { userRepository } from "@/modules/user/repositories/user.repository";
import { teamRepository } from "@/modules/team/repositories/team.repository";
import { productRepository } from "@/modules/product/repositories/product.repository";
import { sendEmailReact } from "@/lib/email/resend";
import { ApplicationReceivedEmail } from "@/emails/application-received";
import { ApplicationDecidedEmail } from "@/emails/application-decided";
import { WelcomeEmail } from "@/emails/welcome";
import { logger } from "@/lib/telemetry/logger";

const APP_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "https://buildspace.app";

// ---------------------------------------------------------------------------
// application/submitted → notify team owners (in-app + email)
// ---------------------------------------------------------------------------
export const onApplicationSubmitted = inngest.createFunction(
  {
    id: "notification.application-submitted",
    name: "Notify owners on application submitted",
    triggers: [{ event: "application/submitted" }],
    retries: 3,
  },
  async ({ event, step }) => {
    const { applicationId, applicantId, roleId } = event.data as {
      applicationId: string;
      applicantId: string;
      roleId: string;
    };

    await step.run("fetch-and-notify", async () => {
      const [role, applicant] = await Promise.all([
        teamRepository.findRoleById(roleId),
        userRepository.findById(applicantId),
      ]);
      if (!role || !applicant) return { skipped: true };

      const team = await teamRepository.findTeamById(role.teamId);
      const productId = team?.productId;
      let productSlug = "";
      if (productId) {
        const product = await productRepository.findById(productId).catch(() => null);
        productSlug = product?.slug ?? "";
      }

      const members = await teamRepository.listMembers(role.teamId);
      const ownerIds = members
        .filter((m) => m.role === "owner" || m.role === "maintainer")
        .map((m) => m.userId);
      const owners = await userRepository.findManyByIds(ownerIds);

      const coverSnippet = typeof (event.data as Record<string, unknown>).coverNote === "string"
        ? String((event.data as Record<string, unknown>).coverNote).slice(0, 150)
        : "";

      await Promise.all(
        owners.map(async (owner) => {
          await notificationService.create({
            userId: owner.id,
            kind: "application.received",
            payload: {
              applicationId,
              applicantId,
              applicantName: applicant.displayName,
              roleTitle: role.title,
            },
          });

          await sendEmailReact({
            to: owner.email,
            subject: `${applicant.displayName} applied for ${role.title}`,
            react: React.createElement(ApplicationReceivedEmail, {
              ownerName: owner.displayName,
              applicantName: applicant.displayName,
              applicantHandle: applicant.handle,
              roleTitle: role.title,
              productName: productSlug,
              productSlug,
              coverNoteSnippet: coverSnippet,
              appUrl: APP_URL,
            }),
          }).catch((e: unknown) =>
            logger.error("Email failed: application-received", { error: String(e) })
          );
        })
      );

      return { notified: owners.length };
    });
  }
);

// ---------------------------------------------------------------------------
// application/decided → notify applicant (in-app + email)
// ---------------------------------------------------------------------------
export const onApplicationDecided = inngest.createFunction(
  {
    id: "notification.application-decided",
    name: "Notify applicant on application decided",
    triggers: [{ event: "application/decided" }],
    retries: 3,
  },
  async ({ event, step }) => {
    const { applicationId, applicantId, decision, roleTitle } = event.data as {
      applicationId: string;
      applicantId: string;
      decision: "accepted" | "rejected";
      roleTitle: string;
    };

    await step.run("fetch-and-notify", async () => {
      const applicant = await userRepository.findById(applicantId);
      if (!applicant) return { skipped: true };

      let productSlug = "";
      const app = await teamRepository.findApplicationById(applicationId).catch(() => null);
      if (app) {
        const role = await teamRepository.findRoleById(app.teamRoleId).catch(() => null);
        if (role) {
          const team = await teamRepository.findTeamById(role.teamId).catch(() => null);
          if (team) {
            const product = await productRepository.findById(team.productId).catch(() => null);
            productSlug = product?.slug ?? "";
          }
        }
      }

      await notificationService.create({
        userId: applicantId,
        kind: "application.decided",
        payload: { applicationId, decision, roleTitle },
      });

      await sendEmailReact({
        to: applicant.email,
        subject:
          decision === "accepted"
            ? `You've been accepted for ${roleTitle}!`
            : `Update on your application for ${roleTitle}`,
        react: React.createElement(ApplicationDecidedEmail, {
          applicantName: applicant.displayName,
          roleTitle,
          productName: productSlug,
          productSlug,
          decision,
          appUrl: APP_URL,
        }),
      }).catch((e: unknown) =>
        logger.error("Email failed: application-decided", { error: String(e) })
      );

      return { notified: 1 };
    });
  }
);

// ---------------------------------------------------------------------------
// member/joined → welcome email to new member
// ---------------------------------------------------------------------------
export const onMemberJoined = inngest.createFunction(
  {
    id: "notification.member-joined",
    name: "Send welcome email on member joined",
    triggers: [{ event: "member/joined" }],
    retries: 3,
  },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string; teamId: string; applicationId: string };

    await step.run("welcome-email", async () => {
      const user = await userRepository.findById(userId);
      if (!user) return { skipped: true };

      await notificationService.create({
        userId,
        kind: "mention",
        payload: {
          type: "welcome",
          message: "Welcome to the team! Head to the Build Room to get started.",
        },
      });

      await sendEmailReact({
        to: user.email,
        subject: "You've joined a team on BuildSpace",
        react: React.createElement(WelcomeEmail, {
          displayName: user.displayName,
          handle: user.handle,
          appUrl: APP_URL,
        }),
      }).catch((e: unknown) =>
        logger.error("Email failed: member-joined welcome", { error: String(e) })
      );

      return { notified: 1 };
    });
  }
);

// ---------------------------------------------------------------------------
// update/posted → in-app notification to team members (debounced per build room)
// ---------------------------------------------------------------------------
export const onUpdatePostedNotify = inngest.createFunction(
  {
    id: "notification.update-posted",
    name: "Notify team on update posted",
    triggers: [{ event: "update/posted" }],
    retries: 2,
    debounce: { period: "2m", key: "event.data.buildRoomId" },
  },
  async ({ event, step }) => {
    const { updateId, userId: authorId, buildRoomId } = event.data as {
      updateId: string;
      userId: string;
      buildRoomId: string;
    };

    await step.run("notify-team", async () => {
      const buildRoom = await productRepository.findBuildRoomById(buildRoomId).catch(() => null);
      if (!buildRoom) return { skipped: true };

      const team = await teamRepository.findTeamByProductId(buildRoom.productId).catch(() => null);
      if (!team) return { skipped: true };

      const members = await teamRepository.listMembers(team.id);
      const recipients = members.filter((m) => m.userId !== authorId);

      await Promise.all(
        recipients.map((m) =>
          notificationService
            .create({
              userId: m.userId,
              kind: "update.posted_in_followed",
              payload: { updateId, buildRoomId, authorId },
            })
            .catch((e: unknown) =>
              logger.error("Notification failed: update-posted", { error: String(e) })
            )
        )
      );

      return { notified: recipients.length };
    });
  }
);

// ---------------------------------------------------------------------------
// task/completed → in-app notification to product owner (if not self-completed)
// ---------------------------------------------------------------------------
export const onTaskCompletedNotify = inngest.createFunction(
  {
    id: "notification.task-completed",
    name: "Notify owner on task completed by team member",
    triggers: [{ event: "task/completed" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { taskId, userId: completedById, buildRoomId } = event.data as {
      taskId: string;
      userId: string;
      buildRoomId: string;
    };

    await step.run("notify-owner", async () => {
      const buildRoom = await productRepository.findBuildRoomById(buildRoomId).catch(() => null);
      if (!buildRoom) return { skipped: true };

      const product = await productRepository.findById(buildRoom.productId).catch(() => null);
      if (!product) return { skipped: true };

      if (product.ownerId === completedById) return { skipped: "self-completed" };

      await notificationService
        .create({
          userId: product.ownerId,
          kind: "task.assigned",
          payload: { taskId, completedById, buildRoomId },
        })
        .catch((e: unknown) =>
          logger.error("Notification failed: task-completed", { error: String(e) })
        );

      return { notified: 1 };
    });
  }
);
