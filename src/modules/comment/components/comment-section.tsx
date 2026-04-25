"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { Trash2, MessageSquare } from "lucide-react";
import { createCommentAction, deleteCommentAction } from "../_actions";
import { ReportButton } from "@/modules/moderation/components/report-button";
import type { CommentWithAuthor } from "../repositories/comment.repository";

type Props = {
  parentType: "idea" | "product" | "update" | "milestone";
  parentId: string;
  initialComments: CommentWithAuthor[];
  currentUserId?: string | undefined;
};

export function CommentSection({ parentType, parentId, initialComments, currentUserId }: Props) {
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !currentUserId) return;
    setError(null);

    startTransition(async () => {
      const result = await createCommentAction({ parentType, parentId, body: body.trim() });
      if (!result.ok) {
        setError(result.message ?? "Failed to post comment");
        return;
      }
      const newComment: CommentWithAuthor = {
        ...result.data,
        author: { id: currentUserId, handle: "", displayName: "You", avatarUrl: null },
      };
      setComments((prev) => [newComment, ...prev]);
      setBody("");
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      await deleteCommentAction(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        Comments ({comments.length})
      </h2>

      {currentUserId && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Share your thoughts..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
            disabled={isPending}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
              {isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No comments yet. Be the first to comment.
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                <AvatarImage src={comment.author.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {comment.author.displayName.slice(0, 2).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{comment.author.displayName}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                  {comment.body}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {currentUserId && currentUserId !== comment.authorId && (
                  <ReportButton targetType="comment" targetId={comment.id} />
                )}
                {currentUserId === comment.authorId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(comment.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
