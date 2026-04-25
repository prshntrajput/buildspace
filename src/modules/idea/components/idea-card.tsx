import Link from "next/link";
import { ArrowUp, MessageCircle, Tag } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { truncate, formatDate } from "@/lib/utils";
import type { IdeaWithAuthor } from "../types";

type Props = { idea: IdeaWithAuthor };

const RANK_VARIANT: Record<string, "bronze" | "silver" | "gold" | "platinum"> = {
  bronze: "bronze",
  silver: "silver",
  gold: "gold",
  platinum: "platinum",
};

export function IdeaCard({ idea }: Props) {
  return (
    <Link href={`/ideas/${idea.slug}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">
              {idea.title}
            </h3>
            {idea.aiReview?.status === "complete" && (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                AI Reviewed
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Avatar className="h-5 w-5">
              <AvatarImage src={idea.author.avatarUrl ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {idea.author.displayName.slice(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {idea.author.displayName || idea.author.handle}
            </span>
            <Badge
              variant={RANK_VARIANT[idea.author.rankBucket] ?? "bronze"}
              className="text-[9px] py-0 px-1"
            >
              {idea.author.rankBucket}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <p className="text-xs text-muted-foreground line-clamp-3">
            {truncate(idea.problem, 150)}
          </p>

          {idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {idea.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] py-0">
                  {tag}
                </Badge>
              ))}
              {idea.tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{idea.tags.length - 3}</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <ArrowUp className="h-3 w-3" />
                {idea.upvoteCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {idea.commentCount}
              </span>
            </div>
            <span>{formatDate(idea.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
