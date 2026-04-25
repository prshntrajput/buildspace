"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { decideApplicationAction } from "@/modules/team/_actions";
import { formatDate } from "@/lib/utils";
import type { Application } from "@/modules/team/types";

type Props = { application: Application };

export function ApplicationCard({ application: initial }: Props) {
  const [app, setApp] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function decide(decision: "accepted" | "rejected") {
    startTransition(async () => {
      const result = await decideApplicationAction(app.id, { decision });
      if (result.ok) setApp({ ...app, status: decision, decidedAt: new Date() });
    });
  }

  return (
    <div className="border rounded-md p-3 space-y-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Applied {formatDate(app.createdAt)}</span>
        <Badge variant={
          app.status === "accepted" ? "default" :
          app.status === "rejected" ? "destructive" :
          "secondary"
        }>
          {app.status}
        </Badge>
      </div>
      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{app.coverNote}</p>
      {app.links.length > 0 && (
        <ul className="space-y-0.5">
          {app.links.map((link, i) => (
            <li key={i}>
              <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline break-all">
                {link}
              </a>
            </li>
          ))}
        </ul>
      )}
      {app.status === "pending" && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={() => decide("accepted")} disabled={isPending}>Accept</Button>
          <Button size="sm" variant="outline" onClick={() => decide("rejected")} disabled={isPending}>Reject</Button>
        </div>
      )}
    </div>
  );
}
