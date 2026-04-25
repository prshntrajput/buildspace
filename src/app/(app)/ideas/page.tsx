import { Metadata } from "next";
import { ideaService } from "@/modules/idea/services/idea.service";
import { IdeaCard } from "@/modules/idea/components/idea-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Ideas — BuildSpace" };

type Props = {
  searchParams: Promise<{ q?: string; tag?: string }>;
};

export default async function IdeasPage({ searchParams }: Props) {
  const params = await searchParams;
  const ideas = await ideaService.search({
    query: params.q,
    tags: params.tag ? [params.tag] : undefined,
    limit: 24,
  });

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

      {ideas.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No ideas yet</p>
          <p className="text-sm mt-1">Be the first to share your idea!</p>
          <Link href="/ideas/new">
            <Button className="mt-4">Post an Idea</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}
