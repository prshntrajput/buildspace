"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { postUpdateAction } from "@/modules/build-room/_actions";
import type { Update } from "@/modules/build-room/types";
import { formatDate } from "@/lib/utils";
import { getWeekNumber } from "@/lib/utils";

type Props = {
  buildRoomId: string;
  initialUpdates: Update[];
};

export function UpdateSection({ buildRoomId, initialUpdates }: Props) {
  const [updates, setUpdates] = useState(initialUpdates);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function handlePost() {
    if (!body.trim()) return;
    setError(null);
    const now = new Date();
    startTransition(async () => {
      const result = await postUpdateAction({
        buildRoomId,
        body: { text: body.trim() },
        weekNumber: getWeekNumber(now),
        year: now.getFullYear(),
      });

      if (result.ok) {
        setUpdates((prev) => [result.data, ...prev]);
        setBody("");
        setShowForm(false);
      } else {
        setError(result.message ?? "Failed to post update");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Updates</h3>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Post Update"}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you work on this week? Share progress, blockers, or wins."
            rows={4}
            maxLength={5000}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handlePost} disabled={isPending || !body.trim()}>
              {isPending ? "Posting..." : "Post Update"}
            </Button>
          </div>
        </div>
      )}

      {updates.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No updates yet. Post your first weekly update.</p>
      ) : (
        <div className="space-y-3">
          {updates.map((u) => (
            <Card key={u.id}>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Week {u.weekNumber} · {formatDate(u.createdAt)}
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {typeof u.body === "object" && u.body !== null && "text" in u.body
                    ? String((u.body as { text: string }).text)
                    : JSON.stringify(u.body)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
