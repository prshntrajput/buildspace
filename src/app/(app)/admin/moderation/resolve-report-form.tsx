"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { resolveReportAction } from "@/modules/moderation/_actions";

type Props = { reportId: string };

export function ResolveReportForm({ reportId }: Props) {
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function act(action: "resolve" | "dismiss") {
    setError(null);
    startTransition(async () => {
      const result = await resolveReportAction({
        reportId,
        action,
        ...(note.trim() ? { resolutionNote: note.trim() } : {}),
      });
      if (result.ok) {
        setDone(true);
      } else {
        setError(result.message);
      }
    });
  }

  if (done) {
    return <p className="text-xs text-muted-foreground">Resolved.</p>;
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Resolution note (optional)"
        maxLength={500}
        rows={2}
        className="text-xs"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => act("resolve")}
          disabled={isPending}
        >
          Resolve
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => act("dismiss")}
          disabled={isPending}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
