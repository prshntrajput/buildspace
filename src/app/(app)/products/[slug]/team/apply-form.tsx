"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { submitApplicationAction } from "@/modules/team/_actions";

type Props = { teamRoleId: string; roleTitle: string };

export function ApplyForm({ teamRoleId, roleTitle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [links, setLinks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addLink() {
    const l = linkInput.trim();
    if (!l) return;
    try {
      new URL(l);
    } catch {
      setLinkError("Please enter a full URL including https://");
      return;
    }
    if (links.length >= 5) return;
    setLinkError(null);
    setLinks((prev) => [...prev, l]);
    setLinkInput("");
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);

    if (coverNote.trim().length < 50) {
      setError(`Cover note is too short — please write at least ${50 - coverNote.trim().length} more characters.`);
      return;
    }

    startTransition(async () => {
      const result = await submitApplicationAction({
        teamRoleId,
        coverNote: coverNote.trim(),
        links,
      });
      if (!result.ok) {
        setError(result.message ?? "Failed to submit application");
        return;
      }
      setSubmitted(true);
      router.refresh();
    });
  }

  if (submitted) {
    return (
      <p className="text-sm text-green-600 font-medium py-1">
        ✓ Application submitted! The team owner will review it shortly.
      </p>
    );
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>Apply</Button>
    );
  }

  const remaining = Math.max(0, 50 - coverNote.trim().length);

  return (
    // noValidate prevents the browser from blocking submit on the URL input field
    <form onSubmit={handleSubmit} noValidate className="border rounded-lg p-4 space-y-3 bg-card mt-2">
      <p className="text-sm font-medium">Apply for: {roleTitle}</p>

      <div className="space-y-1">
        <Label htmlFor="cover-note">
          Cover Note{" "}
          {remaining > 0 ? (
            <span className="text-muted-foreground text-xs">({remaining} more chars needed)</span>
          ) : (
            <span className="text-green-600 text-xs">✓</span>
          )}
        </Label>
        <Textarea
          id="cover-note"
          placeholder="Tell them why you're a great fit..."
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
          rows={4}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground text-right">{coverNote.length}/2000</p>
      </div>

      <div className="space-y-1">
        <Label>Links (portfolio, GitHub, etc.) — optional</Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://github.com/..."
            value={linkInput}
            onChange={(e) => { setLinkInput(e.target.value); setLinkError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addLink}
            disabled={links.length >= 5}
          >
            Add
          </Button>
        </div>
        {linkError && <p className="text-xs text-destructive">{linkError}</p>}
        {links.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
            {links.map((l, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="truncate">{l}</span>
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
    </form>
  );
}
