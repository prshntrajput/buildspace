import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { productService } from "@/modules/product/services/product.service";
import { ProductCard } from "@/modules/product/components/product-card";

export const metadata: Metadata = {
  title: "Products — BuildSpace",
  description: "Browse products being built in public.",
};

type Props = { searchParams: Promise<{ stage?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const { stage } = await searchParams;
  const products = await productService.listPublic({ ...(stage ? { stage } : {}) }).catch(() => []);

  const stages = ["building", "shipped", "maintained", "ideation"] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real products being built in public, with proof.
          </p>
        </div>
        <Link href="/products/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Product
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link href="/products">
          <Button variant={!stage ? "default" : "outline"} size="sm">
            All
          </Button>
        </Link>
        {stages.map((s) => (
          <Link key={s} href={`/products?stage=${s}`}>
            <Button variant={stage === s ? "default" : "outline"} size="sm" className="capitalize">
              {s}
            </Button>
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">No products found.</p>
          <Link href="/products/new">
            <Button>Be the first to build</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
