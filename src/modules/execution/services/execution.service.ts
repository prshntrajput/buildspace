import { buildRoomRepository } from "@/modules/build-room/repositories/build-room.repository";
import { productRepository } from "@/modules/product/repositories/product.repository";
import { buildRoomService } from "@/modules/build-room/services/build-room.service";
import { planTasks } from "@/modules/ai/agents/task-planner";
import { db } from "@/lib/db";
import { buildRooms, ideas, teamMemberships, teams } from "../../../../drizzle/schema";
import { eq, count } from "drizzle-orm";
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";

export class ExecutionService {
  async start(productId: string, userId: string): Promise<void> {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError("Product");
    if (product.ownerId !== userId) {
      throw new ForbiddenError("Only the owner can start execution mode");
    }

    const buildRoom = await productRepository.findBuildRoomByProductId(productId);
    if (!buildRoom) throw new NotFoundError("Build Room");
    if (buildRoom.executionMode === "true") {
      throw new ValidationError("Execution mode is already active");
    }

    let ideaTitle = product.name;
    let problem = product.description || "Building a new product";
    let solution = "Software solution";

    if (product.ideaId) {
      const ideaRow = await db.select().from(ideas).where(eq(ideas.id, product.ideaId)).limit(1);
      if (ideaRow[0]) {
        ideaTitle = ideaRow[0].title;
        problem = ideaRow[0].problem;
        solution = ideaRow[0].solution;
      }
    }

    let teamSize = 1;
    const teamRow = await db.select().from(teams).where(eq(teams.productId, productId)).limit(1);
    if (teamRow[0]) {
      const membersRow = await db
        .select({ count: count() })
        .from(teamMemberships)
        .where(eq(teamMemberships.teamId, teamRow[0].id));
      if (membersRow[0]) {
        teamSize = membersRow[0].count;
      }
    }

    const roadmap = await planTasks({
      productName: product.name,
      ideaTitle,
      problem,
      solution,
      teamSize,
      timelineWeeks: 4,
    }, userId);

    if (!roadmap || !roadmap.milestones || roadmap.milestones.length === 0) {
      throw new Error("TaskPlanner failed to generate a roadmap");
    }

    for (const m of roadmap.milestones) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + (m.weekTarget * 7));

      const milestone = await buildRoomService.createMilestone(userId, {
        buildRoomId: buildRoom.id,
        title: m.title,
        description: m.description,
        targetDate: targetDate.toISOString(),
      });

      for (const t of m.tasks) {
        await buildRoomService.createTask(userId, {
          buildRoomId: buildRoom.id,
          title: t.title,
          description: t.description,
          estimateMinutes: t.estimateMinutes,
          dueDate: targetDate.toISOString(),
          weight: 1,
        });
      }
    }

    await db
      .update(buildRooms)
      .set({ executionMode: "true", updatedAt: new Date() })
      .where(eq(buildRooms.id, buildRoom.id));
  }
}

export const executionService = new ExecutionService();
