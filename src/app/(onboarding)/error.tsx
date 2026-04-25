"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function OnboardingError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-4">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h2 className="text-xl font-semibold">Onboarding error</h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        {error.message || "Something went wrong. Your progress has been saved — you can continue where you left off."}
      </p>
      <Button onClick={reset}>Continue</Button>
    </div>
  );
}
