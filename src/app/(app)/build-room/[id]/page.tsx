import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getUserOrNull } from "@/lib/auth/server";
import { productRepository } from "@/modules/product/repositories/product.repository";
import { teamRepository } from "@/modules/team/repositories/team.repository";
import { buildRoomService } from "@/modules/build-room/services/build-room.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { TaskBoard } from "./task-board";
import { UpdateSection } from "./update-form";
import { StartExecutionButton } from "./start-execution-button";
import { ArrowLeft, Target } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const buildRoom = await productRepository.findBuildRoomById(id).catch(() => null);
  if (!buildRoom) return { title: "Build Room Not Found" };
  return { title: `${buildRoom.title} — Build Room — BuildSpace` };
}

export default async function BuildRoomPage({ params }: Props) {
  const { id } = await params;
  const authUser = await getUserOrNull();

  const buildRoom = await productRepository.findBuildRoomById(id).catch(() => null);
  if (!buildRoom) notFound();

  const product = await productRepository.findById(buildRoom.productId).catch(() => null);
  if (!product) notFound();

  const isOwner = authUser?.id === product.ownerId;

  const team = await teamRepository.findTeamByProductId(product.id).catch(() => null);
  const membership =
    authUser && team && !isOwner
      ? await teamRepository.findMembership(team.id, authUser.id).catch(() => null)
      : null;
  const isMember = !!membership;

  const [tasks, updates, milestones] = await Promise.all([
    buildRoomService.getTasksByBuildRoom(id).catch(() => []),
    buildRoomService.getUpdatesByBuildRoom(id).catch(() => []),
    buildRoomService.getMilestonesByBuildRoom(id).catch(() => []),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/products/${product.slug}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {product.name}
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-lg font-bold">{buildRoom.title}</h1>
          <Badge variant={product.stage === "archived" ? "outline" : "default"} className="capitalize">
            {product.stage}
          </Badge>
        </div>
        {isOwner && buildRoom.executionMode !== "true" && (
          <StartExecutionButton productId={product.id} buildRoomId={buildRoom.id} />
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="updates">
            Updates ({updates.length})
          </TabsTrigger>
          <TabsTrigger value="milestones">
            Milestones ({milestones.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <TaskBoard
            buildRoomId={id}
            initialTasks={tasks}
            initialProgressPct={buildRoom.progressPct}
            canEdit={isOwner || isMember}
          />
        </TabsContent>

        <TabsContent value="updates" className="mt-4">
          {authUser ? (
            <UpdateSection buildRoomId={id} initialUpdates={updates} />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center py-4">
                Sign in to post updates.
              </p>
              {updates.length > 0 && (
                <UpdateSection buildRoomId={id} initialUpdates={updates} />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="mt-4">
          <div className="space-y-3">
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No milestones yet.</p>
            ) : (
              milestones.map((m) => (
                <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Target className={`h-5 w-5 mt-0.5 shrink-0 ${m.achievedAt ? "text-green-500" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{m.title}</p>
                      {m.achievedAt && (
                        <Badge variant="secondary" className="text-[10px] py-0">Achieved</Badge>
                      )}
                    </div>
                    {m.description && (
                      <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                    )}
                    {m.targetDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Target: {formatDate(m.targetDate)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
