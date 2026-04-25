"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteIdeaAction } from "@/modules/idea/_actions";

type Props = { ideaId: string };

export function DeleteIdeaButton({ ideaId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteIdeaAction(ideaId);
      if (result.ok) {
        router.push("/ideas");
      }
    });
  }

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-destructive">Delete this idea?</span>
      <Button variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
        {isPending ? "Deleting..." : "Confirm Delete"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={isPending}>
        Cancel
      </Button>
    </div>
  );
}
