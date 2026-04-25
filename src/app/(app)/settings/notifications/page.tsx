import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Notification Settings — BuildSpace",
};

const NOTIFICATION_KINDS = [
  { id: "mention", label: "Mentions", description: "When someone @mentions you in a comment" },
  { id: "application.received", label: "Applications", description: "When someone applies to a role on your team" },
  { id: "application.decided", label: "Application updates", description: "When your application is accepted or rejected" },
  { id: "task.assigned", label: "Task assignments", description: "When a task is assigned to you" },
  { id: "task.due_soon", label: "Task reminders", description: "When a task is due within 24 hours" },
  { id: "update.posted_in_followed", label: "Followed product updates", description: "When a product you follow posts an update" },
  { id: "streak.broken", label: "Inactivity warnings", description: "When your build streak is at risk" },
  { id: "weekly.digest", label: "Weekly digest", description: "A weekly email summary of activity" },
] as const;

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose how and when you want to be notified. In-app notifications are always on.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground pb-2">
            <span className="col-span-2">Notification</span>
            <span className="text-right">Email</span>
          </div>
          <Separator />
          {NOTIFICATION_KINDS.map((kind, i) => (
            <div key={kind.id}>
              {i > 0 && <Separator className="my-3" />}
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="col-span-2">
                  <Label htmlFor={`email-${kind.id}`} className="font-medium">{kind.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{kind.description}</p>
                </div>
                <div className="flex justify-end">
                  <Switch id={`email-${kind.id}`} defaultChecked={kind.id === "weekly.digest"} />
                </div>
              </div>
            </div>
          ))}

          <Separator className="mt-4" />
          <p className="text-xs text-muted-foreground">
            Notification preferences are saved locally for now. Full persistence coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
