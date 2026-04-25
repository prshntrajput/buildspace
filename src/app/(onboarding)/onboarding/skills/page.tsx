"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { setOnboardingSkillsAction } from "@/modules/user/_actions";
import { Plus, X } from "lucide-react";

const SUGGESTED_SKILLS = [
  "React", "Next.js", "TypeScript", "Python", "Node.js",
  "PostgreSQL", "UI/UX Design", "Product Management", "Marketing",
  "DevOps", "iOS", "Android", "Machine Learning", "Go", "Rust",
];

export default function OnboardingSkillsPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [availability, setAvailability] = useState<"full_time" | "part_time" | "weekends" | "unavailable">("part_time");
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function addSkill(s: string) {
    const trimmed = s.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 20) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  }

  function removeSkill(s: string) {
    setSkills(skills.filter((sk) => sk !== s));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    }
  }

  function handleNext() {
    if (skills.length === 0) {
      setError("Add at least one skill");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setOnboardingSkillsAction({ skills, availability, timezone });
      if (result.ok) {
        router.push("/onboarding/goal");
      } else {
        setError(result.message ?? "Something went wrong");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span className="font-medium text-primary">Step 2</span> of 3
        </div>
        <CardTitle>What do you bring to the table?</CardTitle>
        <CardDescription>Add your skills and tell us how available you are.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label>Skills</Label>
          <div className="flex gap-2">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a skill and press Enter"
              maxLength={50}
              disabled={skills.length >= 20}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => addSkill(skillInput)} disabled={skills.length >= 20}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1 mt-1">
            {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSkill(s)}
                className="text-xs px-2 py-0.5 rounded border border-dashed border-muted-foreground/40 hover:border-primary text-muted-foreground hover:text-foreground transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeSkill(s)}>
                  {s}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Availability</Label>
          <Select value={availability} onValueChange={(v) => setAvailability(v as typeof availability)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full-time (40+ hrs/week)</SelectItem>
              <SelectItem value="part_time">Part-time (10–20 hrs/week)</SelectItem>
              <SelectItem value="weekends">Weekends only</SelectItem>
              <SelectItem value="unavailable">Not available right now</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tz">Timezone</Label>
          <Input
            id="tz"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="e.g. Asia/Kolkata"
          />
        </div>

        <Button className="w-full" onClick={handleNext} disabled={isPending}>
          {isPending ? "Saving..." : "Continue"}
        </Button>
      </CardContent>
    </Card>
  );
}
