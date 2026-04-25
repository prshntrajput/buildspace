import { StateGraph, Annotation, END } from "@langchain/langgraph";
import { withFallback } from "@/modules/ai/providers";
import { buildCacheKey, getCached, setCached, AI_CACHE_TTL } from "@/modules/ai/cache";
import { logAICall } from "@/modules/ai/ledger";
import {
  TaskPlannerInput,
  TaskPlannerOutput,
  TaskPlannerMilestone,
} from "./schema";
import type {
  TaskPlannerInputType,
  TaskPlannerOutputType,
  TaskPlannerMilestoneType,
} from "./schema";
import { z } from "zod";
import { logger } from "@/lib/telemetry/logger";

const AGENT_NAME = "TaskPlanner";
const AGENT_VERSION = "1.0";
const TIMEOUT_MS = 60_000;

// ---------------------------------------------------------------------------
// LangGraph state
// ---------------------------------------------------------------------------

const PlannerState = Annotation.Root({
  input: Annotation<TaskPlannerInputType>(),
  milestones: Annotation<TaskPlannerMilestoneType[]>({ default: () => [], reducer: (_, b) => b }),
  rationale: Annotation<string>({ default: () => "", reducer: (_, b) => b }),
  error: Annotation<string | null>({ default: () => null, reducer: (_, b) => b }),
  totalUsage: Annotation<{ promptTokens: number; completionTokens: number; totalTokens: number; costUsd: number }>({
    default: () => ({ promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: 0 }),
    reducer: (a, b) => ({
      promptTokens: a.promptTokens + b.promptTokens,
      completionTokens: a.completionTokens + b.completionTokens,
      totalTokens: a.totalTokens + b.totalTokens,
      costUsd: a.costUsd + b.costUsd,
    }),
  }),
});

type PlannerStateType = typeof PlannerState.State;

// ---------------------------------------------------------------------------
// Node 1: generate milestone titles + descriptions + week targets
// ---------------------------------------------------------------------------

const MilestonesOnlySchema = z.object({
  milestones: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      weekTarget: z.number(),
    })
  ),
  rationale: z.string(),
});

async function generateMilestonesNode(state: PlannerStateType): Promise<Partial<PlannerStateType>> {
  const { input } = state;

  const prompt = `
Plan milestones for this product:

Product: ${input.productName}
Idea: ${input.ideaTitle}
Problem: ${input.problem}
Solution: ${input.solution}
Team size: ${input.teamSize} person(s)
Timeline: ${input.timelineWeeks} weeks

Generate 2–5 milestones that break this product into shippable chunks. Each milestone should have a weekTarget (week number when it should be done), a short title, and a 1-2 sentence description of what it achieves.
  `.trim();

  const { object, usage } = await withFallback((p) =>
    p.generateObject({
      prompt,
      system: "You are a pragmatic project planner for indie builders. Bias to shipping. Be concise.",
      schema: MilestonesOnlySchema,
      maxTokens: 2048,
    })
  );

  return {
    milestones: object.milestones as TaskPlannerMilestoneType[],
    rationale: object.rationale,
    totalUsage: usage,
  };
}

// ---------------------------------------------------------------------------
// Node 2: expand each milestone with tasks
// ---------------------------------------------------------------------------

async function expandTasksNode(state: PlannerStateType): Promise<Partial<PlannerStateType>> {
  const { input, milestones } = state;

  const TasksForMilestoneSchema = z.object({
    tasks: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        estimateMinutes: z.number(),
      })
    ),
  });

  let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: 0 };
  const expanded: TaskPlannerMilestoneType[] = [];

  for (const milestone of milestones) {
    const prompt = `
Milestone: "${milestone.title}" (Week ${milestone.weekTarget})
${milestone.description}

Product: ${input.productName} — ${input.solution}
Team size: ${input.teamSize}

Generate 2–6 atomic, actionable tasks for this milestone. Each task should be completable in one session (30–480 min). Include clear titles and realistic time estimates in minutes.
    `.trim();

    const { object, usage } = await withFallback((p) =>
      p.generateObject({
        prompt,
        system: "You are a pragmatic project planner. Tasks must be atomic, specific, and shippable.",
        schema: TasksForMilestoneSchema,
        maxTokens: 2048,
      })
    );

    expanded.push({ ...milestone, tasks: object.tasks });
    totalUsage = {
      promptTokens: totalUsage.promptTokens + usage.promptTokens,
      completionTokens: totalUsage.completionTokens + usage.completionTokens,
      totalTokens: totalUsage.totalTokens + usage.totalTokens,
      costUsd: totalUsage.costUsd + usage.costUsd,
    };
  }

  return { milestones: expanded, totalUsage };
}

// ---------------------------------------------------------------------------
// Build the graph
// ---------------------------------------------------------------------------

function buildGraph() {
  const graph = new StateGraph(PlannerState)
    .addNode("generateMilestones", generateMilestonesNode)
    .addNode("expandTasks", expandTasksNode)
    .addEdge("__start__", "generateMilestones")
    .addEdge("generateMilestones", "expandTasks")
    .addEdge("expandTasks", END);

  return graph.compile();
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function planTasks(
  input: TaskPlannerInputType,
  userId?: string
): Promise<TaskPlannerOutputType | null> {
  const parsed = TaskPlannerInput.parse(input);
  const cacheKey = buildCacheKey(AGENT_NAME, AGENT_VERSION, parsed, "gemini");

  const cached = await getCached<TaskPlannerOutputType>(cacheKey);
  if (cached) {
    await logAICall({
      ...(userId !== undefined ? { userId } : {}),
      agent: AGENT_NAME,
      model: "cached",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: 0 },
      cached: true,
      latencyMs: 0,
      success: true,
    });
    return cached;
  }

  const start = Date.now();

  try {
    const graph = buildGraph();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TaskPlanner timeout")), TIMEOUT_MS)
    );

    const runPromise = graph.invoke({ input: parsed });
    const finalState = await Promise.race([runPromise, timeoutPromise]);

    const result = TaskPlannerOutput.parse({
      milestones: finalState.milestones,
      rationale: finalState.rationale,
    });

    const latencyMs = Date.now() - start;
    await setCached(cacheKey, result, AI_CACHE_TTL.TaskPlanner);
    await logAICall({
      ...(userId !== undefined ? { userId } : {}),
      agent: AGENT_NAME,
      model: "gemini-2.5-flash",
      usage: finalState.totalUsage,
      cached: false,
      latencyMs,
      success: true,
    });

    return result;
  } catch (e) {
    logger.error("TaskPlanner failed", { error: String(e) });
    await logAICall({
      ...(userId !== undefined ? { userId } : {}),
      agent: AGENT_NAME,
      model: "gemini-2.5-flash",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: 0 },
      cached: false,
      latencyMs: Date.now() - start,
      success: false,
    });
    return null;
  }
}
