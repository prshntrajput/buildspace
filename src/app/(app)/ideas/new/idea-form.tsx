"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createIdeaAction } from "@/modules/idea/_actions";
import { X, Plus } from "lucide-react";

export function IdeaForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [solution, setSolution] = useState("");
  const [mvpPlan, setMvpPlan] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  function handleSubmit(status: "draft" | "published") {
    setError(null);
    startTransition(async () => {
      const result = await createIdeaAction({
        title,
        problem,
        targetUser,
        solution,
        mvpPlan: mvpPlan || undefined,
        tags,
        visibility,
        status,
      });

      if (!result.ok) {
        setError(result.message ?? "Something went wrong");
        return;
      }

      router.push(`/ideas/${result.data.slug}`);
    });
  }

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A short, memorable name for your idea"
          maxLength={120}
        />
        <p className="text-xs text-muted-foreground">{title.length}/120 — minimum 8 characters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="problem">
          The Problem <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="problem"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="What pain point does this solve? Be specific — describe who has this problem and why current solutions fall short."
          rows={4}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground">{problem.length}/2000 — minimum 20 characters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetUser">
          Target User <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="targetUser"
          value={targetUser}
          onChange={(e) => setTargetUser(e.target.value)}
          placeholder="Who exactly would use this? e.g. 'Indie founders building B2B SaaS who manage hiring without an HR team'"
          rows={2}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">{targetUser.length}/500</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="solution">
          Solution Hypothesis <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="solution"
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          placeholder="How do you plan to solve it? What's the core mechanism? What makes your approach different?"
          rows={4}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground">{solution.length}/2000 — minimum 20 characters</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mvpPlan">MVP Plan (optional)</Label>
        <Textarea
          id="mvpPlan"
          value={mvpPlan}
          onChange={(e) => setMvpPlan(e.target.value)}
          placeholder="What's the smallest version you could ship in 7–14 days to validate the core hypothesis?"
          rows={3}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">{mvpPlan.length}/1000</p>
      </div>

      <div className="space-y-2">
        <Label>Tags (up to 10)</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add a tag and press Enter"
            maxLength={30}
            disabled={tags.length >= 10}
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={tags.length >= 10}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTag(tag)}>
                {tag}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Visibility</Label>
        <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public — visible to everyone</SelectItem>
            <SelectItem value="unlisted">Unlisted — only via link</SelectItem>
            <SelectItem value="private">Private — only you</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit("draft")}
          disabled={isPending}
        >
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit("published")}
          disabled={isPending}
        >
          {isPending ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </form>
  );
}
