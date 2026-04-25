import { inngest } from "@/inngest/client";
import { ideaRepository } from "../repositories/idea.repository";
import { validateIdea } from "@/modules/ai/agents/idea-validator";
import { logger } from "@/lib/telemetry/logger";

export const onIdeaCreated = inngest.createFunction(
  { 
    id: "idea.created", 
    name: "Idea Created Handler", 
    triggers: [{ event: "idea/created" }],
    retries: 3 
  },
  async ({ event, step }) => {
    const { ideaId, authorId } = event.data as { ideaId: string; authorId: string };

    await step.run("run-idea-validator", async () => {
      const idea = await ideaRepository.findById(ideaId);
      if (!idea) return;

      await ideaRepository.update(ideaId, {
        aiReview: { status: "pending", clarityScore: 0, marketSignal: "", risks: [], suggestions: [], overallVerdict: "weak" },
      });

      const result = await validateIdea(
        {
          title: idea.title,
          problem: idea.problem,
          targetUser: idea.targetUser,
          solution: idea.solution,
          ...(idea.mvpPlan ? { mvpPlan: idea.mvpPlan } : {}),
          tags: idea.tags,
        },
        authorId
      );

      if (result) {
        await ideaRepository.update(ideaId, {
          aiReview: {
            status: "complete",
            ...result,
            reviewedAt: new Date().toISOString(),
          },
        });
        logger.info("Idea AI review complete", { ideaId });
      } else {
        await ideaRepository.update(ideaId, {
          aiReview: { status: "failed", clarityScore: 0, marketSignal: "", risks: [], suggestions: [], overallVerdict: "weak" },
        });
        logger.warn("Idea AI review failed", { ideaId });
        throw new Error("Idea AI review failed, triggering Inngest retry");
      }
    });
  }
);
