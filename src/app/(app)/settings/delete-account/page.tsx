"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccountAction } from "./_actions";
import { createSupabaseBrowserClient } from "@/lib/auth/client";

export default function DeleteAccountPage() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccountAction({ confirmHandle: handle });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      // Sign out client-side then redirect
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/");
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-destructive">Delete Account</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Permanently delete your BuildSpace account and all associated data.
        </p>
      </div>

      <Card className="border-destructive/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">This action cannot be undone</CardTitle>
          </div>
          <CardDescription>
            Deleting your account will permanently remove your profile, ideas, products, activity
            history, and score. This cannot be reversed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Your profile and public presence will be removed</li>
            <li>Your ideas and products will be soft-deleted</li>
            <li>Your execution score and history will be erased</li>
            <li>You will be removed from all team memberships</li>
            <li>Your login credentials will stop working immediately</li>
          </ul>

          <div className="space-y-2">
            <Label htmlFor="confirm-handle">
              Type your handle to confirm deletion
            </Label>
            <Input
              id="confirm-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="your-handle"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || !handle.trim()}
          >
            {isPending ? "Deleting account…" : "Permanently delete my account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
