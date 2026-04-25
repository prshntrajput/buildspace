import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ideas, products } from "../../drizzle/schema";
import { env } from "@/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  const [publishedIdeas, publicProducts] = await Promise.all([
    db
      .select({ slug: ideas.slug, updatedAt: ideas.updatedAt })
      .from(ideas)
      .where(eq(ideas.status, "published")),
    db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.visibility, "public")),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: appUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${appUrl}/ideas`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${appUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  const ideaRoutes: MetadataRoute.Sitemap = publishedIdeas.map((idea) => ({
    url: `${appUrl}/ideas/${idea.slug}`,
    lastModified: idea.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = publicProducts.map((product) => ({
    url: `${appUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...ideaRoutes, ...productRoutes];
}
