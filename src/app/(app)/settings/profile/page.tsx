import { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/auth/server";
import { userService } from "@/modules/user/services/user.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "./profile-form";
import { GitCommitHorizontal, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Profile Settings — BuildSpace",
};

export default async function ProfileSettingsPage() {
  const authUser = await getUser();
  const user = await userService.getById(authUser.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Update your public profile. Your handle @{user.handle} cannot be changed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} />
        </CardContent>
      </Card>

      {/* Connected accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected Accounts</CardTitle>
          <CardDescription>
            Connect accounts to enable score verification features like linked commits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <GitCommitHorizontal className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium">GitHub</p>
                {user.githubUsername ? (
                  <p className="text-xs text-muted-foreground">@{user.githubUsername}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Not connected</p>
                )}
              </div>
            </div>
            {user.githubUsername ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Connected
              </Badge>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/api/github/connect">Connect</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
