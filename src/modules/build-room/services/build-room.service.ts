import { buildRoomRepository } from "../repositories/build-room.repository";
import type { Task, Update, Milestone } from "../types";
import type {
  TaskCreateInputType,
  TaskCompleteInputType,
  TaskMoveInputType,
  UpdateCreateInputType,
  MilestoneCreateInputType,
} from "../schemas";
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";
import { sendEvent } from "@/inngest/send";
import { scoreService } from "@/modules/execution/services/score.service";

export class BuildRoomService {
  async createTask(userId: string, input: TaskCreateInputType): Promise<Task> {
    return buildRoomRepository.createTask({
      ...input,
      status: "todo",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      createdById: userId,
    });
  }

  async moveTask(taskId: string, userId: string, input: TaskMoveInputType): Promise<Task> {
    const task = await buildRoomRepository.findTaskById(taskId);
    if (!task) throw new NotFoundError("Task");

    if (input.status === "done" && !task.proofUrl) {
      throw new ValidationError("Task requires a proof URL to be marked as done");
    }

    const updated = await buildRoomRepository.updateTask(taskId, {
      status: input.status,
      completedAt: input.status === "done" ? new Date() : undefined,
    });

    if (input.status === "done") {
      await scoreService.logActivity({
        userId,
        kind: "task_completed",
        ...(task.proofUrl ? { proofUrl: task.proofUrl } : {}),
        metadata: { taskId, buildRoomId: task.buildRoomId },
      });

      await sendEvent({
        name: "task/completed",
        data: {
          taskId,
          userId,
          buildRoomId: task.buildRoomId,
          proofUrl: task.proofUrl,
        },
      });
    }

    await buildRoomRepository.updateProgress(task.buildRoomId);
    return updated;
  }

  async completeTask(
    taskId: string,
    userId: string,
    input: TaskCompleteInputType
  ): Promise<Task> {
    const task = await buildRoomRepository.findTaskById(taskId);
    if (!task) throw new NotFoundError("Task");

    const updated = await buildRoomRepository.updateTask(taskId, {
      proofUrl: input.proofUrl,
      status: "done",
      completedAt: new Date(),
    });

    await scoreService.logActivity({
      userId,
      kind: "task_completed",
      proofUrl: input.proofUrl,
      metadata: { taskId, buildRoomId: task.buildRoomId },
    });

    await sendEvent({
      name: "task/completed",
      data: { taskId, userId, buildRoomId: task.buildRoomId, proofUrl: input.proofUrl },
    });

    await buildRoomRepository.updateProgress(task.buildRoomId);
    return updated;
  }

  async assignTask(taskId: string, assigneeId: string): Promise<Task> {
    const task = await buildRoomRepository.findTaskById(taskId);
    if (!task) throw new NotFoundError("Task");
    return buildRoomRepository.updateTask(taskId, { assigneeId });
  }

  async getTasksByBuildRoom(buildRoomId: string): Promise<Task[]> {
    return buildRoomRepository.listTasksByBuildRoom(buildRoomId);
  }

  async postUpdate(userId: string, input: UpdateCreateInputType): Promise<Update> {
    const update = await buildRoomRepository.createUpdate({
      ...input,
      authorId: userId,
    });

    await scoreService.logActivity({
      userId,
      kind: "update_posted",
      metadata: { updateId: update.id, buildRoomId: input.buildRoomId },
    });

    await sendEvent({
      name: "update/posted",
      data: { updateId: update.id, userId, buildRoomId: input.buildRoomId },
    });

    return update;
  }

  async getUpdatesByBuildRoom(buildRoomId: string): Promise<Update[]> {
    return buildRoomRepository.listUpdatesByBuildRoom(buildRoomId);
  }

  async createMilestone(userId: string, input: MilestoneCreateInputType): Promise<Milestone> {
    return buildRoomRepository.createMilestone({
      ...input,
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
    });
  }

  async verifyMilestone(milestoneId: string, verifierId: string): Promise<Milestone> {
    const milestone = await buildRoomRepository.updateMilestone(milestoneId, {
      achievedAt: new Date(),
    });

    await scoreService.logActivity({
      userId: verifierId,
      kind: "milestone_shipped",
      metadata: { milestoneId, buildRoomId: milestone.buildRoomId },
    });

    return milestone;
  }

  async getMilestonesByBuildRoom(buildRoomId: string): Promise<Milestone[]> {
    return buildRoomRepository.listMilestonesByBuildRoom(buildRoomId);
  }
}

export const buildRoomService = new BuildRoomService();
