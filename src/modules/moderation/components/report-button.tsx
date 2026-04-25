"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitReportAction } from "../_actions";
import type { ReportReason, TargetType } from "../types";

const REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam",
  harassment: "Harassment",
  plagiarism: "Plagiarism",
  misinformation: "Misinformation",
  other: "Other",
};

type Props = {
  targetType: TargetType;
  targetId: string;
};

export function ReportButton({ targetType, targetId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!reason) return;
    setError(null);
    startTransition(async () => {
      const result = await submitReportAction({
        targetType,
        targetId,
        reason,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.message);
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setReason("");
    setNote("");
    setSubmitted(false);
    setError(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
        aria-label="Report content"
      >
        <Flag className="h-3 w-3" />
        Report
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Content</DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="py-4 text-center space-y-2">
              <p className="text-sm font-medium">Report submitted</p>
              <p className="text-xs text-muted-foreground">
                Our moderation team will review it shortly.
              </p>
              <Button variant="outline" size="sm" onClick={handleClose}>
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Reason</Label>
                <Select
                  value={reason}
                  onValueChange={(v) => setReason(v as ReportReason)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(REASON_LABELS) as ReportReason[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {REASON_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-note">Additional context (optional)</Label>
                <Textarea
                  id="report-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe the issue…"
                  maxLength={500}
                  rows={3}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSubmit}
                  disabled={isPending || !reason}
                >
                  {isPending ? "Submitting…" : "Submit report"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
