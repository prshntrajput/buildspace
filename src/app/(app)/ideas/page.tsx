import { Metadata } from "next";
import { Suspense } from "react";
import { ideaService } from "@/modules/idea/services/idea.service";
import { IdeaCard } from "@/modules/idea/components/idea-card";
import { IdeasSearch } from "./ideas-search";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Ideas — BuildSpace" };

type Props = {
  searchParams: Promise<{ q?: string; tag?: string }>;
};

export default async function IdeasPage({ searchParams }: Props) {
  const params = await searchParams;
  const [ideas, trendingTags] = await Promise.all([
    ideaService.search({
      query: params.q,
      tags: params.tag ? [params.tag] : undefined,
      limit: 24,
    }),
    ideaService.getTrendingTags(12),
  ]);

  const hasFilter = !!(params.q || params.tag);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ideas</h1>
          <p className="text-muted-foreground text-sm">
            Explore ideas from builders around the world
          </p>
        </div>
        <Link href="/ideas/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            New Idea
          </Button>
        </Link>
      </div>

      {/* Search + tag filters — needs client interactivity */}
      <Suspense>
        <IdeasSearch trendingTags={trendingTags} />
      </Suspense>

      {/* Results */}
      {ideas.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {hasFilter ? (
            <>
              <p className="text-lg font-medium">No ideas match your search</p>
              <p className="text-sm mt-1">Try a different query or clear the filters.</p>
              <Link href="/ideas">
                <Button variant="outline" className="mt-4">Clear filters</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">No ideas yet</p>
              <p className="text-sm mt-1">Be the first to share your idea!</p>
              <Link href="/ideas/new">
                <Button className="mt-4">Post an Idea</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          {hasFilter && (
            <p className="text-sm text-muted-foreground">
              {ideas.length} result{ideas.length !== 1 ? "s" : ""}
              {params.q ? ` for "${params.q}"` : ""}
              {params.tag ? ` tagged #${params.tag}` : ""}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
