// Half-life of 90 days: λ = ln(2)/90
const LAMBDA = Math.LN2 / 90;

export type SignalEntry = {
  weight: number;
  ageDays: number;
};

export function computeDecayedScore(signals: SignalEntry[]): number {
  const effective = signals.reduce((sum, s) => {
    return sum + s.weight * Math.exp(-LAMBDA * s.ageDays);
  }, 0);
  return Math.min(1000, Math.max(0, effective));
}

export function ageInDays(date: Date): number {
  const now = Date.now();
  const then = date.getTime();
  return (now - then) / (1000 * 60 * 60 * 24);
}
