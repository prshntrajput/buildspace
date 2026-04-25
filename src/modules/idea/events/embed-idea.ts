import { inngest } from "@/inngest/client";
import { ideaRepository } from "../repositories/idea.repository";
import { getPrimaryProvider } from "@/modules/ai/providers";
import { logger } from "@/lib/telemetry/logger";

export const embedIdea = inngest.createFunction(
  {
    id: "idea.embed",
    name: "Embed Idea + Detect Duplicates",
    triggers: [{ event: "idea/created" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { ideaId } = event.data as { ideaId: string; authorId: string };

    await step.run("embed-and-detect-duplicates", async () => {
      const idea = await ideaRepository.findById(ideaId);
      if (!idea) return;

      const text = `${idea.title}\n${idea.problem}\n${idea.solution}`;

      let embedding: number[];
      try {
        embedding = await getPrimaryProvider().embed(text);
      } catch (err) {
        logger.warn("Idea embedding failed", { ideaId, err });
        return;
      }

      await ideaRepository.updateEmbedding(ideaId, embedding);
      logger.info("Idea embedded", { ideaId, dims: embedding.length });

      // Only run duplicate detection for published ideas
      if (idea.status !== "published") return;

      const similar = await ideaRepository.findSimilarByEmbedding(embedding, ideaId);
      if (similar.length > 0) {
        await ideaRepository.update(ideaId, {
          duplicatesDetected: similar.map((s) => ({
            id: s.id,
            slug: s.slug,
            title: s.title,
            similarity: s.similarity,
          })),
        });
        logger.info("Duplicates detected", { ideaId, count: similar.length });
      }
    });
  }
);
