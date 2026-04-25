import { Metadata } from "next";
import { ideaService } from "@/modules/idea/services/idea.service";
import { productService } from "@/modules/product/services/product.service";
import { IdeaCard } from "@/modules/idea/components/idea-card";
import { ProductCard } from "@/modules/product/components/product-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Feed — BuildSpace" };

export default async function FeedPage() {
  const [ideas, products] = await Promise.all([
    ideaService.search({ limit: 10 }),
    productService.listPublic({ limit: 6 }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feed</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Discover ideas and products being built in public
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/ideas/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Idea
            </Button>
          </Link>
          <Link href="/products/new">
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Latest Products */}
      {products.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Active Builds</h2>
            <Link href="/products" className="text-sm text-muted-foreground hover:underline">
              See all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Ideas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Latest Ideas</h2>
          <Link href="/ideas" className="text-sm text-muted-foreground hover:underline">
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
          <div className="grid gap-4 sm:grid-cols-2">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
