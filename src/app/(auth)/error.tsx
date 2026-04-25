"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

type Props = { error: Error & { digest?: string }; reset: () => void };

export default function AuthError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-4">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <h2 className="text-xl font-semibold">Authentication error</h2>
      <p className="text-muted-foreground text-sm max-w-sm">
        {error.message || "Something went wrong during sign in. Please try again."}
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Link href="/login">
          <Button variant="outline">Back to login</Button>
        </Link>
      </div>
    </div>
  );
}
