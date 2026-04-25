export type SignalKind =
  | "task_completed"
  | "update_posted"
  | "milestone_shipped"
  | "commit_linked"
  | "peer_endorsed"
  | "backer_received"
  | "inactivity_penalty"
  | "abandoned_penalty";

export const SIGNAL_WEIGHTS: Record<SignalKind, number> = {
  task_completed: 3,
  update_posted: 5,
  milestone_shipped: 15,
  commit_linked: 2,
  peer_endorsed: 4,
  backer_received: 2,
  inactivity_penalty: -5,
  abandoned_penalty: -20,
};

export const DAILY_CAPS: Partial<Record<SignalKind, number>> = {
  task_completed: 10,
  commit_linked: 20,
};

export type RankBucket = "bronze" | "silver" | "gold" | "platinum";

export function getRankBucket(score: number): RankBucket {
  if (score >= 800) return "platinum";
  if (score >= 500) return "gold";
  if (score >= 200) return "silver";
  return "bronze";
}
