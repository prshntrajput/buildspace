"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { setOnboardingRoleAction } from "@/modules/user/_actions";
import { Lightbulb, Wrench, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    id: "founder" as const,
    label: "Founder",
    description: "I have an idea and want to build a product",
    icon: Lightbulb,
  },
  {
    id: "builder" as const,
    label: "Builder",
    description: "I want to join teams and help build products",
    icon: Wrench,
  },
  {
    id: "backer" as const,
    label: "Supporter",
    description: "I want to discover and support builders",
    icon: TrendingUp,
  },
];

export default function OnboardingRolePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  }

  function handleNext() {
    if (selected.length === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await setOnboardingRoleAction({ roles: selected });
      if (result.ok) {
        router.push("/onboarding/skills");
      } else {
        setError(result.message ?? "Something went wrong");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <span className="font-medium text-primary">Step 1</span> of 3
        </div>
        <CardTitle>What brings you here?</CardTitle>
        <CardDescription>Select all that apply — you can change this later.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selected.includes(role.id);
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => toggle(role.id)}
                className={cn(
                  "w-full flex items-start gap-4 p-4 rounded-lg border text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <p className="font-medium text-sm">{role.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          className="w-full"
          onClick={handleNext}
          disabled={isPending || selected.length === 0}
        >
          {isPending ? "Saving..." : "Continue"}
        </Button>
      </CardContent>
    </Card>
  );
}
