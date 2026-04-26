"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { upvoteIdeaAction } from "@/modules/idea/_actions";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type Props = { ideaId: string; initialCount: number; initialUpvoted: boolean };

export function UpvoteButton({ ideaId, initialCount, initialUpvoted }: Props) {
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [isPending, startTransition] = useTransition();
  const isPendingRef = useRef(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`idea:${ideaId}:upvotes`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ideas", filter: `id=eq.${ideaId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (isPendingRef.current) return;
          const row = payload.new as Record<string, unknown>;
          if (row["upvote_count"] !== undefined) {
            setCount(Number(row["upvote_count"]));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ideaId]);

  function handleUpvote() {
    isPendingRef.current = true;
    startTransition(async () => {
      const result = await upvoteIdeaAction(ideaId);
      if (result.ok) {
        setUpvoted(result.data.upvoted);
        setCount((prev) => (result.data.upvoted ? prev + 1 : prev - 1));
      }
      isPendingRef.current = false;
    });
  }

  return (
    <Button
      variant={upvoted ? "default" : "outline"}
      size="sm"
      onClick={handleUpvote}
      disabled={isPending}
    >
      <ArrowUp className="h-4 w-4 mr-1" />
      {count} {count === 1 ? "Upvote" : "Upvotes"}
    </Button>
  );
}
