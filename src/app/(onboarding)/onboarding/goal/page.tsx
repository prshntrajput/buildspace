"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { completeOnboardingAction } from "@/modules/user/_actions";
import { Rocket, Users, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const GOALS = [
  {
    id: "build_idea" as const,
    label: "Build my idea",
    description: "I have something I want to ship and want to do it in public",
    icon: Rocket,
  },
  {
    id: "join_team" as const,
    label: "Join a team",
    description: "I want to contribute to projects that are already building",
    icon: Users,
  },
  {
    id: "explore" as const,
    label: "Explore the community",
    description: "I want to see what others are building and maybe get inspired",
    icon: Compass,
  },
];

export default function OnboardingGoalPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDone() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await completeOnboardingAction({ goal: selected });
      if (result.ok) {
        router.push("/feed");
      } else {
        setError(result.message ?? "Something went wrong");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span className="font-medium text-primary">Step 3</span> of 3
        </div>
        <CardTitle>What&apos;s your primary goal?</CardTitle>
        <CardDescription>This helps us personalise your feed. You can always change it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {GOALS.map((goal) => {
            const Icon = goal.icon;
            const isSelected = selected === goal.id;
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => setSelected(goal.id)}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-lg border text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <p className="font-medium text-sm">{goal.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          className="w-full"
          onClick={handleDone}
          disabled={isPending || !selected}
        >
          {isPending ? "Almost there..." : "Go to Feed →"}
        </Button>
      </CardContent>
    </Card>
  );
}
