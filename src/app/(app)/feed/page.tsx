import { Metadata } from "next";
import Link from "next/link";
import { ideaService } from "@/modules/idea/services/idea.service";
import { productService } from "@/modules/product/services/product.service";
import { IdeaCard } from "@/modules/idea/components/idea-card";
import { ProductCard } from "@/modules/product/components/product-card";
import { Button } from "@/components/ui/button";
import { Plus, Hash } from "lucide-react";

export const metadata: Metadata = { title: "Feed — BuildSpace" };

export default async function FeedPage() {
  const [ideas, products, trendingTags] = await Promise.all([
    ideaService.search({ limit: 10 }),
    productService.listPublic({ limit: 6 }),
    ideaService.getTrendingTags(10),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feed</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Discover ideas and products being built in public
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/ideas/new">
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              New Idea
            </Button>
          </Link>
          <Link href="/products/new">
            <Button size="sm" variant="outline" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Trending tags */}
      {trendingTags.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-muted-foreground">Trending tags</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map(({ tag, count }) => (
              <Link key={tag} href={`/ideas?tag=${encodeURIComponent(tag)}`}>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors">
                  #{tag}
                  <span className="text-[10px] opacity-60">{count}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Products */}
      {products.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold">Active Builds</h2>
            <Link href="/products" className="text-sm text-muted-foreground hover:underline shrink-0">
              See all
            </Link>
          </div>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Ideas */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold">Latest Ideas</h2>
          <Link href="/ideas" className="text-sm text-muted-foreground hover:underline shrink-0">
            See all
          </Link>
        </div>
        {ideas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No ideas yet. Be the first to share one!</p>
            <Link href="/ideas/new">
              <Button className="mt-4">Post Your Idea</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
