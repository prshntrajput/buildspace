"use client";

import { useState, useTransition } from "react";
import { toggleReactionAction } from "../_actions";

const REACTIONS = ["👍", "❤️", "🚀", "💡"] as const;
type ReactionKind = (typeof REACTIONS)[number];

type Props = {
  targetType: "idea" | "product" | "comment" | "update";
  targetId: string;
  initialCounts: { kind: string; count: number }[];
  initialUserKinds: string[];
  currentUserId?: string | undefined;
};

export function ReactionBar({
  targetType,
  targetId,
  initialCounts,
  initialUserKinds,
  currentUserId,
}: Props) {
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const { kind, count } of initialCounts) map[kind] = count;
    return map;
  });
  const [userKinds, setUserKinds] = useState<Set<string>>(new Set(initialUserKinds));
  const [isPending, startTransition] = useTransition();

  function handleToggle(kind: ReactionKind) {
    if (!currentUserId) return;

    const wasReacted = userKinds.has(kind);
    // Optimistic update
    setCounts((prev) => ({
      ...prev,
      [kind]: Math.max(0, (prev[kind] ?? 0) + (wasReacted ? -1 : 1)),
    }));
    setUserKinds((prev) => {
      const next = new Set(prev);
      if (wasReacted) next.delete(kind);
      else next.add(kind);
      return next;
    });

    startTransition(async () => {
      const result = await toggleReactionAction({ targetType, targetId, kind });
      if (!result.ok) {
        // Revert on failure
        setCounts((prev) => ({
          ...prev,
          [kind]: Math.max(0, (prev[kind] ?? 0) + (wasReacted ? 1 : -1)),
        }));
        setUserKinds((prev) => {
          const next = new Set(prev);
          if (wasReacted) next.add(kind);
          else next.delete(kind);
          return next;
        });
      }
    });
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {REACTIONS.map((kind) => {
        const count = counts[kind] ?? 0;
        const active = userKinds.has(kind);
        return (
          <button
            key={kind}
            onClick={() => handleToggle(kind)}
            disabled={isPending || !currentUserId}
            aria-label={`React with ${kind}`}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border transition-colors ${
              active
                ? "bg-primary/10 border-primary/40 text-primary"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span>{kind}</span>
            {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
