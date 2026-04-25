"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { openRoleAction } from "@/modules/team/_actions";
import { Plus, X } from "lucide-react";

type Props = { teamId: string };

export function OpenRoleForm({ teamId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 10) {
      setSkills((prev) => [...prev, s]);
      setSkillInput("");
    }
  }

  function removeSkill(s: string) {
    setSkills((prev) => prev.filter((x) => x !== s));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await openRoleAction({
        teamId,
        title: title.trim(),
        description: description.trim() || undefined,
        requiredSkills: skills,
      });
      if (!result.ok) {
        setError(result.message ?? "Failed to create role");
        return;
      }
      setTitle("");
      setDescription("");
      setSkills([]);
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Add Role
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-3 bg-card">
      <div className="space-y-1">
        <Label htmlFor="role-title">Role Title</Label>
        <Input
          id="role-title"
          placeholder="e.g. Frontend Engineer"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={100}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="role-desc">Description (optional)</Label>
        <Textarea
          id="role-desc"
          placeholder="What will this person work on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={500}
        />
      </div>
      <div className="space-y-1">
        <Label>Required Skills</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a skill"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
          />
          <Button type="button" size="sm" variant="outline" onClick={addSkill}>Add</Button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 text-xs bg-secondary rounded px-2 py-0.5">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="submit" size="sm" disabled={isPending || !title.trim()}>
          {isPending ? "Creating..." : "Create Role"}
        </Button>
      </div>
    </form>
  );
}
