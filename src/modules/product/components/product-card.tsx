import Link from "next/link";
import { Package, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Product } from "../types";

type Props = { product: Product };

const STAGE_COLOR: Record<Product["stage"], string> = {
  ideation: "secondary",
  building: "default",
  shipped: "default",
  maintained: "default",
  archived: "outline",
};

export function ProductCard({ product }: Props) {
  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">{product.name}</h3>
            </div>
            <Badge
              variant={STAGE_COLOR[product.stage] as "default" | "secondary" | "outline"}
              className="text-[10px] shrink-0"
            >
              {product.stage}
            </Badge>
          </div>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {product.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {product.techStack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.techStack.slice(0, 4).map((tech) => (
                <Badge key={tech} variant="outline" className="text-[10px] py-0">
                  {tech}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {product.repoUrl && (
              <span className="flex items-center gap-1">
                Repo
              </span>
            )}
            {product.demoUrl && (
              <span className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Demo
              </span>
            )}
            <span className="ml-auto">{formatDate(product.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
