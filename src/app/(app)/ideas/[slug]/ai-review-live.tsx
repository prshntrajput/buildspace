"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { IdeaAIReview } from "@/modules/idea/types";

type Props = { ideaId: string; initialReview: IdeaAIReview | null };

export function AiReviewLive({ ideaId, initialReview }: Props) {
  const [review, setReview] = useState(initialReview);

  useEffect(() => {
    if (review?.status === "complete") return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`idea:${ideaId}:ai-review`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ideas", filter: `id=eq.${ideaId}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = payload.new as Record<string, unknown>;
          if (row["ai_review"] != null) {
            setReview(row["ai_review"] as IdeaAIReview);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ideaId, review?.status]);

  if (!review) return null;

  return (
    <Card className={
      review.status === "complete"
        ? "border-primary/30 bg-primary/5"
        : review.status === "pending" || review.status === undefined
        ? "border-yellow-500/30 bg-yellow-500/5"
        : "border-muted"
    }>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {review.status === "complete" ? (
            <><CheckCircle className="h-4 w-4 text-primary" /> AI Suggestion <span className="text-muted-foreground font-normal">(not a verdict)</span></>
          ) : review.status === "pending" ? (
            <><Clock className="h-4 w-4 text-yellow-500" /> AI Review In Progress...</>
          ) : (
            <><AlertTriangle className="h-4 w-4" /> AI Review Pending</>
          )}
        </CardTitle>
      </CardHeader>
      {review.status === "complete" && (
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Clarity Score:</span>
            <Badge variant={review.clarityScore >= 7 ? "default" : review.clarityScore >= 5 ? "secondary" : "destructive"}>
              {review.clarityScore}/10
            </Badge>
            <Badge variant={review.overallVerdict === "strong" ? "default" : review.overallVerdict === "moderate" ? "secondary" : "destructive"}>
              {review.overallVerdict}
            </Badge>
          </div>
          <p className="text-sm"><strong>Market Signal:</strong> {review.marketSignal}</p>
          {review.risks?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Risks:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {review.risks.map((r, i) => <li key={i} className="flex gap-2"><span>•</span>{r}</li>)}
              </ul>
            </div>
          )}
          {review.suggestions?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Suggestions:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {review.suggestions.map((s, i) => <li key={i} className="flex gap-2"><span>→</span>{s}</li>)}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
