"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { upvoteIdeaAction } from "@/modules/idea/_actions";

type Props = { ideaId: string; initialCount: number; initialUpvoted: boolean };

export function UpvoteButton({ ideaId, initialCount, initialUpvoted }: Props) {
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [isPending, startTransition] = useTransition();

  function handleUpvote() {
    startTransition(async () => {
      const result = await upvoteIdeaAction(ideaId);
      if (result.ok) {
        setUpvoted(result.data.upvoted);
        setCount((prev) => (result.data.upvoted ? prev + 1 : prev - 1));
      }
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
