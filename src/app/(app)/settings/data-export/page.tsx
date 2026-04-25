"use client";

import { useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { exportUserDataAction } from "./_actions";

export default function DataExportPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);
    startTransition(async () => {
      const result = await exportUserDataAction();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `buildspace-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Download Your Data</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Export a copy of your BuildSpace data in JSON format.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>
            Your export includes: profile, ideas, products, activity logs, notifications,
            applications, comments, endorsements, and score history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Profile details (handle, bio, skills, score)</li>
            <li>All ideas you have created</li>
            <li>All products you own</li>
            <li>Activity logs and execution score history</li>
            <li>Applications submitted</li>
            <li>Comments posted</li>
            <li>Endorsements received</li>
            <li>Notification history</li>
          </ul>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleExport} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Preparing export…
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download my data
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            The download will start automatically. Sensitive fields like email and authentication
            tokens are excluded.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
