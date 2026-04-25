import { eq, and, isNull, desc, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, buildRooms, users } from "../../../../drizzle/schema";
import type { Product, BuildRoom } from "../types";

function mapToProduct(row: typeof products.$inferSelect): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    ownerId: row.ownerId,
    ideaId: row.ideaId,
    stage: row.stage,
    techStack: row.techStack ?? [],
    demoUrl: row.demoUrl,
    repoUrl: row.repoUrl,
    bannerUrl: row.bannerUrl,
    metrics: (row.metrics as Record<string, unknown>) ?? {},
    visibility: row.visibility,
    lastActivityAt: row.lastActivityAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapToBuildRoom(row: typeof buildRooms.$inferSelect): BuildRoom {
  return {
    id: row.id,
    productId: row.productId,
    title: row.title,
    description: row.description,
    progressPct: row.progressPct,
    executionMode: row.executionMode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class ProductRepository {
  async create(data: Omit<typeof products.$inferInsert, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const rows = await db.insert(products).values(data).returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to create product");
    return mapToProduct(row);
  }

  async createBuildRoom(productId: string, title: string): Promise<BuildRoom> {
    const rows = await db
      .insert(buildRooms)
      .values({ productId, title })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Failed to create build room");
    return mapToBuildRoom(row);
  }

  async findById(id: string): Promise<Product | null> {
    const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
    const row = rows[0];
    return row ? mapToProduct(row) : null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), isNull(products.deletedAt)))
      .limit(1);
    const row = rows[0];
    return row ? mapToProduct(row) : null;
  }

  async findBuildRoomByProductId(productId: string): Promise<BuildRoom | null> {
    const rows = await db
      .select()
      .from(buildRooms)
      .where(eq(buildRooms.productId, productId))
      .limit(1);
    const row = rows[0];
    return row ? mapToBuildRoom(row) : null;
  }

  async findBuildRoomById(id: string): Promise<BuildRoom | null> {
    const rows = await db.select().from(buildRooms).where(eq(buildRooms.id, id)).limit(1);
    const row = rows[0];
    return row ? mapToBuildRoom(row) : null;
  }

  async update(id: string, data: Partial<typeof products.$inferInsert>): Promise<Product> {
    const rows = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    const row = rows[0];
    if (!row) throw new Error("Product not found");
    return mapToProduct(row);
  }

  async listPublic(opts: { limit: number; stage?: string; cursor?: string }): Promise<Product[]> {
    const conditions = [eq(products.visibility, "public"), isNull(products.deletedAt)];
    if (opts.stage) conditions.push(eq(products.stage, opts.stage as Product["stage"]));

    const rows = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.updatedAt))
      .limit(opts.limit);

    return rows.map(mapToProduct);
  }

  async listByOwner(ownerId: string): Promise<Product[]> {
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.ownerId, ownerId), isNull(products.deletedAt)))
      .orderBy(desc(products.updatedAt));
    return rows.map(mapToProduct);
  }

  async findInactiveForArchive(inactiveDays: number): Promise<Product[]> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - inactiveDays);

    const rows = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.stage, "building"),
          isNull(products.deletedAt),
          lt(products.lastActivityAt, threshold)
        )
      );
    return rows.map(mapToProduct);
  }
}

export const productRepository = new ProductRepository();
