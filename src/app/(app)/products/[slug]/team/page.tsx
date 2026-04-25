import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth/server";
import { productService } from "@/modules/product/services/product.service";
import { teamService } from "@/modules/team/services/team.service";
import { teamRepository } from "@/modules/team/repositories/team.repository";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Users, Briefcase } from "lucide-react";
import { OpenRoleForm } from "./open-role-form";
import { ApplyForm } from "./apply-form";
import { ApplicationCard } from "./application-card";

type Props = { params: Promise<{ slug: string }> };

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  const authUser = await getUser().catch(() => null);
  if (!authUser) redirect("/login");

  const product = await productService.getBySlug(slug, authUser.id).catch(() => null);
  if (!product) notFound();

  const team = await teamRepository.findTeamByProductId(product.id).catch(() => null);
  if (!team) notFound();

  const isOwner = authUser.id === product.ownerId;
  const membership = await teamRepository.findMembership(team.id, authUser.id).catch(() => null);
  const canManage = membership && ["owner", "maintainer"].includes(membership.role);

  const [members, roles] = await Promise.all([
    teamService.getMembers(team.id).catch(() => []),
    isOwner
      ? teamService.getAllRoles(team.id).catch(() => [])
      : teamService.getOpenRoles(team.id).catch(() => []),
  ]);

  const applicationsPerRole = canManage
    ? await Promise.all(
        roles.map(async (role) => ({
          roleId: role.id,
          apps: await teamRepository.listApplicationsForRole(role.id).catch(() => []),
        }))
      )
    : [];

  const appsByRole = Object.fromEntries(
    applicationsPerRole.map(({ roleId, apps }) => [roleId, apps])
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/products/${slug}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Product
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-muted-foreground" />
          Team — {product.name}
        </h1>
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">{m.userId.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{m.userId}</span>
                </div>
                <Badge variant="outline" className="capitalize">{m.role}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Roles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            Roles
          </h2>
          {canManage && (
            <OpenRoleForm teamId={team.id} />
          )}
        </div>

        {roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isOwner ? "No roles yet. Add one to start recruiting." : "No open roles right now."}
          </p>
        ) : (
          roles.map((role) => (
            <Card key={role.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{role.title}</CardTitle>
                  <Badge variant={
                    role.status === "open" ? "default" :
                    role.status === "filled" ? "secondary" :
                    "outline"
                  }>
                    {role.status}
                  </Badge>
                </div>
                {role.description && (
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                )}
                {role.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {role.requiredSkills.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                )}
              </CardHeader>

              {/* Applications — owner view */}
              {canManage && appsByRole[role.id] && appsByRole[role.id]!.length > 0 && (
                <CardContent className="pt-0 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Applications ({appsByRole[role.id]!.length})
                  </p>
                  {appsByRole[role.id]!.map((app) => (
                    <ApplicationCard key={app.id} application={app} />
                  ))}
                </CardContent>
              )}

              {/* Apply button — non-owner view */}
              {!canManage && authUser && role.status === "open" && (
                <CardContent className="pt-0">
                  <ApplyForm teamRoleId={role.id} roleTitle={role.title} />
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
