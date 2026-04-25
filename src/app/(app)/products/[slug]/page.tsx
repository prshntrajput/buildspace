import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getUserOrNull } from "@/lib/auth/server";
import { productService } from "@/modules/product/services/product.service";
import { teamService } from "@/modules/team/services/team.service";
import { teamRepository } from "@/modules/team/repositories/team.repository";
import { commentRepository } from "@/modules/comment/repositories/comment.repository";
import { ReactionBar } from "@/modules/comment/components/reaction-bar";
import { ReportButton } from "@/modules/moderation/components/report-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { ExternalLink, Package, Users, Wrench, ArrowRight } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await productService.getBySlug(slug).catch(() => null);
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} — BuildSpace`,
    description: product.description ?? `Building ${product.name} in public.`,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const authUser = await getUserOrNull();
  const product = await productService.getBySlug(slug, authUser?.id).catch(() => null);

  if (!product) notFound();

  const team = await teamRepository.findTeamByProductId(product.id).catch(() => null);
  const [openRoles, members, reactionCounts, userReactions] = await Promise.all([
    team ? teamService.getOpenRoles(team.id).catch(() => []) : Promise.resolve([]),
    team ? teamService.getMembers(team.id).catch(() => []) : Promise.resolve([]),
    commentRepository.getReactionCounts("product", product.id),
    authUser
      ? commentRepository.getUserReactions(authUser.id, "product", product.id)
      : Promise.resolve([]),
  ]);

  const isOwner = authUser?.id === product.ownerId;

  const STAGE_LABELS: Record<typeof product.stage, string> = {
    ideation: "Ideation",
    building: "Building",
    shipped: "Shipped",
    maintained: "Maintained",
    archived: "Archived",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold">{product.name}</h1>
          </div>
          <div className="flex gap-2 shrink-0">
            <Badge variant={product.stage === "archived" ? "outline" : "default"}>
              {STAGE_LABELS[product.stage]}
            </Badge>
            <Badge variant="outline">{product.visibility}</Badge>
          </div>
        </div>

        {product.description && (
          <p className="text-muted-foreground leading-relaxed">{product.description}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {product.repoUrl && (
            <a href={product.repoUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Repository
              </Button>
            </a>
          )}
          {product.demoUrl && (
            <a href={product.demoUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-1" />
                Live Demo
              </Button>
            </a>
          )}
          {isOwner && (
            <Link href={`/build-room/${product.buildRoom.id}`}>
              <Button size="sm">
                <Wrench className="h-4 w-4 mr-1" />
                Build Room
              </Button>
            </Link>
          )}
          {!isOwner && authUser && openRoles.length > 0 && (
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-1" />
              {openRoles.length} Open Role{openRoles.length !== 1 ? "s" : ""}
            </Button>
          )}
          {authUser && !isOwner && (
            <ReportButton targetType="product" targetId={product.id} />
          )}
        </div>

        <ReactionBar
          targetType="product"
          targetId={product.id}
          initialCounts={reactionCounts}
          initialUserKinds={userReactions}
          currentUserId={authUser?.id}
        />
      </div>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-normal">Build Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={product.buildRoom.progressPct} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{product.buildRoom.progressPct}% complete</span>
              <span>Updated {formatDate(product.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      {product.techStack.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {product.techStack.map((tech) => (
              <Badge key={tech} variant="secondary">{tech}</Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Team */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Team ({members.length})
          </h2>
          {isOwner && team && (
            <Link href={`/products/${slug}/team`}>
              <Button variant="outline" size="sm">Manage Team</Button>
            </Link>
          )}
        </div>

        {members.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <Badge key={m.id} variant="outline" className="capitalize">
                {m.role}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No team members yet.</p>
        )}

        {openRoles.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Open Roles</h3>
            {openRoles.map((role) => (
              <Card key={role.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{role.title}</p>
                    {role.requiredSkills.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {role.requiredSkills.map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px] py-0">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {authUser && !isOwner && (
                    <Link href={`/products/${slug}/team`}>
                      <Button size="sm" variant="outline">
                        Apply
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Linked Idea */}
      {product.ideaId && (
        <>
          <Separator />
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-1">Originated from an Idea</h2>
            <p className="text-sm text-muted-foreground">
              This product was created from an idea on BuildSpace.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
