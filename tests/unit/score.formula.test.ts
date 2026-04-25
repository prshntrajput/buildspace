import { describe, it, expect } from "vitest";
import { computeDecayedScore, ageInDays } from "@/modules/execution/score.formula";

describe("computeDecayedScore", () => {
  it("returns 0 for empty signals", () => {
    expect(computeDecayedScore([])).toBe(0);
  });

  it("returns full weight for a signal from today (age 0)", () => {
    const score = computeDecayedScore([{ weight: 100, ageDays: 0 }]);
    expect(score).toBeCloseTo(100, 4);
  });

  it("returns half weight at the 90-day half-life", () => {
    const score = computeDecayedScore([{ weight: 100, ageDays: 90 }]);
    expect(score).toBeCloseTo(50, 1);
  });

  it("sums multiple signals", () => {
    const score = computeDecayedScore([
      { weight: 10, ageDays: 0 },
      { weight: 10, ageDays: 0 },
    ]);
    expect(score).toBeCloseTo(20, 4);
  });

  it("clamps at 1000 maximum", () => {
    const signals = Array.from({ length: 500 }, () => ({ weight: 100, ageDays: 0 }));
    expect(computeDecayedScore(signals)).toBe(1000);
  });

  it("clamps at 0 minimum (negative weights)", () => {
    const score = computeDecayedScore([{ weight: -999, ageDays: 0 }]);
    expect(score).toBe(0);
  });

  it("older signals contribute less than newer ones", () => {
    const recent = computeDecayedScore([{ weight: 5, ageDays: 0 }]);
    const old = computeDecayedScore([{ weight: 5, ageDays: 180 }]);
    expect(recent).toBeGreaterThan(old);
  });

  it("decay is exponential — 180 days = quarter of original weight", () => {
    // Two half-lives = (1/2)^2 = 1/4
    const score = computeDecayedScore([{ weight: 100, ageDays: 180 }]);
    expect(score).toBeCloseTo(25, 1);
  });
});

describe("ageInDays", () => {
  it("returns ~0 for a date just now", () => {
    const age = ageInDays(new Date());
    expect(age).toBeGreaterThanOrEqual(0);
    expect(age).toBeLessThan(0.01);
  });

  it("returns ~1 for a date 24h ago", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const age = ageInDays(yesterday);
    expect(age).toBeCloseTo(1, 1);
  });

  it("returns ~7 for a week ago", () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    expect(ageInDays(weekAgo)).toBeCloseTo(7, 1);
  });
});
