"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth/server";
import { handleError } from "@/lib/errors";
import {
  users,
  ideas,
  products,
  activityLogs,
  notifications,
  applications,
  comments,
  endorsements,
  scoreSnapshots,
} from "../../../../../drizzle/schema";

export async function exportUserDataAction(): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; code: string; message: string }
> {
  try {
    const authUser = await getUser();
    const userId = authUser.id;

    const [
      profileRows,
      ideaRows,
      productRows,
      activityRows,
      notificationRows,
      applicationRows,
      commentRows,
      endorsementRows,
      snapshotRows,
    ] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)).limit(1),
      db.select().from(ideas).where(eq(ideas.authorId, userId)),
      db.select().from(products).where(eq(products.ownerId, userId)),
      db.select().from(activityLogs).where(eq(activityLogs.userId, userId)),
      db.select().from(notifications).where(eq(notifications.userId, userId)),
      db.select().from(applications).where(eq(applications.applicantId, userId)),
      db.select().from(comments).where(eq(comments.authorId, userId)),
      db.select().from(endorsements).where(eq(endorsements.endorseeId, userId)),
      db.select().from(scoreSnapshots).where(eq(scoreSnapshots.userId, userId)),
    ]);

    const profile = profileRows[0];
    if (!profile) return { ok: false, code: "NOT_FOUND", message: "User not found" };

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      profile: {
        id: profile.id,
        handle: profile.handle,
        displayName: profile.displayName,
        bio: profile.bio,
        skills: profile.skills,
        availability: profile.availability,
        timezone: profile.timezone,
        rankBucket: profile.rankBucket,
        currentScore: profile.currentScore,
        githubUsername: profile.githubUsername,
        xUsername: profile.xUsername,
        linkedinUrl: profile.linkedinUrl,
        websiteUrl: profile.websiteUrl,
        createdAt: profile.createdAt,
        // email omitted — PII; user already knows it
        // tokens and system fields omitted
      },
      ideas: ideaRows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        problem: r.problem,
        targetUser: r.targetUser,
        solution: r.solution,
        mvpPlan: r.mvpPlan,
        tags: r.tags,
        status: r.status,
        visibility: r.visibility,
        upvoteCount: r.upvoteCount,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      products: productRows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description,
        stage: r.stage,
        techStack: r.techStack,
        demoUrl: r.demoUrl,
        repoUrl: r.repoUrl,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      activityLogs: activityRows.map((r) => ({
        id: r.id,
        kind: r.kind,
        signalWeight: r.signalWeight,
        proofUrl: r.proofUrl,
        createdAt: r.createdAt,
      })),
      notifications: notificationRows.map((r) => ({
        id: r.id,
        kind: r.kind,
        readAt: r.readAt,
        createdAt: r.createdAt,
      })),
      applications: applicationRows.map((r) => ({
        id: r.id,
        teamRoleId: r.teamRoleId,
        status: r.status,
        decidedAt: r.decidedAt,
        createdAt: r.createdAt,
      })),
      comments: commentRows.map((r) => ({
        id: r.id,
        parentType: r.parentType,
        parentId: r.parentId,
        body: r.deletedAt ? "[deleted]" : r.body,
        createdAt: r.createdAt,
      })),
      endorsementsReceived: endorsementRows.map((r) => ({
        id: r.id,
        endorserId: r.endorserId,
        note: r.note,
        createdAt: r.createdAt,
      })),
      scoreHistory: snapshotRows.map((r) => ({
        score: r.score,
        rankBucket: r.rankBucket,
        computedAt: r.computedAt,
      })),
    };

    return { ok: true, data: exportPayload };
  } catch (e) {
    return handleError(e);
  }
}
