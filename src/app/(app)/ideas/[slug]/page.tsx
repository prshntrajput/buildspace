import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ideaService } from "@/modules/idea/services/idea.service";
import { getUserOrNull } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { ArrowUp, GitFork, Lightbulb } from "lucide-react";
import Link from "next/link";
import type { IdeaAIReview } from "@/modules/idea/types";
import { commentService } from "@/modules/comment/services/comment.service";
import { commentRepository } from "@/modules/comment/repositories/comment.repository";
import { CommentSection } from "@/modules/comment/components/comment-section";
import { ReactionBar } from "@/modules/comment/components/reaction-bar";
import { ReportButton } from "@/modules/moderation/components/report-button";
import { Separator } from "@/components/ui/separator";
import { UpvoteButton } from "./upvote-button";
import { DeleteIdeaButton } from "./delete-idea-button";
import { AiReviewLive } from "./ai-review-live";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const idea = await ideaService.getBySlug(slug).catch(() => null);
  if (!idea) return { title: "Idea Not Found" };
  return {
    title: `${idea.title} — BuildSpace`,
    description: idea.problem.slice(0, 160),
  };
}

export default async function IdeaDetailPage({ params }: Props) {
  const { slug } = await params;
  const authUser = await getUserOrNull();
  const idea = await ideaService.getBySlug(slug, authUser?.id).catch(() => null);

  if (!idea) notFound();

  const aiReview = idea.aiReview as IdeaAIReview | null;
  const hasUpvoted = authUser
    ? await ideaService.hasUpvoted(idea.id, authUser.id).catch(() => false)
    : false;
  const [comments, reactionCounts, userReactions] = await Promise.all([
    commentService.getThreadWithAuthors("idea", idea.id),
    commentRepository.getReactionCounts("idea", idea.id),
    authUser
      ? commentRepository.getUserReactions(authUser.id, "idea", idea.id)
      : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">{idea.title}</h1>
          <div className="flex gap-2 shrink-0">
            <Badge variant="outline">{idea.status}</Badge>
            <Badge variant="outline">{idea.visibility}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/profile/${idea.author.handle}`} className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={idea.author.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">
                {idea.author.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{idea.author.displayName}</span>
          </Link>
          <span className="text-muted-foreground text-sm">·</span>
          <span className="text-muted-foreground text-sm">{formatDate(idea.createdAt)}</span>
        </div>

        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {idea.tags.map((tag) => (
              <Link key={tag} href={`/ideas?tag=${tag}`}>
                <Badge variant="secondary">{tag}</Badge>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          {authUser ? (
            <UpvoteButton
              ideaId={idea.id}
              initialCount={idea.upvoteCount}
              initialUpvoted={hasUpvoted}
            />
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">
                <ArrowUp className="h-4 w-4 mr-1" />
                {idea.upvoteCount} Upvotes
              </Link>
            </Button>
          )}
          {authUser && authUser.id !== idea.authorId && (
            <Button variant="outline" size="sm">
              <GitFork className="h-4 w-4 mr-1" />
              Fork
            </Button>
          )}
          {authUser?.id === idea.authorId && idea.status === "draft" && (
            <Button size="sm">Publish</Button>
          )}
          {authUser?.id === idea.authorId && (
            <DeleteIdeaButton ideaId={idea.id} />
          )}
          {authUser && authUser.id !== idea.authorId && (
            <ReportButton targetType="idea" targetId={idea.id} />
          )}
        </div>

        <ReactionBar
          targetType="idea"
          targetId={idea.id}
          initialCounts={reactionCounts}
          initialUserKinds={userReactions}
          currentUserId={authUser?.id}
        />
      </div>

      {/* AI Review Banner */}
      <AiReviewLive ideaId={idea.id} initialReview={aiReview} />

      {/* Idea Content */}
      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-muted-foreground" />
            The Problem
          </h2>
          <p className="text-muted-foreground leading-relaxed">{idea.problem}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Target User</h2>
          <p className="text-muted-foreground leading-relaxed">{idea.targetUser}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Solution Hypothesis</h2>
          <p className="text-muted-foreground leading-relaxed">{idea.solution}</p>
        </section>

        {idea.mvpPlan && (
          <section>
            <h2 className="text-lg font-semibold mb-2">MVP Plan</h2>
            <p className="text-muted-foreground leading-relaxed">{idea.mvpPlan}</p>
          </section>
        )}
      </div>

      {/* Convert to Product CTA */}
      {authUser?.id === idea.authorId && (
        <Card>
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Ready to start building?</p>
              <p className="text-sm text-muted-foreground">Convert this idea into a product</p>
            </div>
            <Link href={`/products/new?ideaId=${idea.id}`}>
              <Button>Start Building</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Separator />

      <CommentSection
        parentType="idea"
        parentId={idea.id}
        initialComments={comments}
        currentUserId={authUser?.id}
      />
    </div>
  );
}
