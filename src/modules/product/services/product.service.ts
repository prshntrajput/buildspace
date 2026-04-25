import { productRepository } from "../repositories/product.repository";
import { teams, teamMemberships } from "../../../../drizzle/schema";
import { db } from "@/lib/db";
import { sendEvent } from "@/inngest/send";
import type { Product, BuildRoom, ProductWithBuildRoom } from "../types";
import type { ProductCreateInputType, ProductUpdateInputType } from "../schemas";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

const VALID_TRANSITIONS: Record<Product["stage"], Product["stage"][]> = {
  ideation: ["building", "archived"],
  building: ["shipped", "archived"],
  shipped: ["maintained", "archived"],
  maintained: ["archived"],
  archived: [],
};

function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

export class ProductService {
  async createFromIdea(
    userId: string,
    input: ProductCreateInputType
  ): Promise<ProductWithBuildRoom> {
    const slug = generateSlug(input.name);

    const product = await productRepository.create({
      slug,
      name: input.name,
      description: input.description,
      ownerId: userId,
      ideaId: input.ideaId,
      techStack: input.techStack,
      demoUrl: input.demoUrl ?? null,
      repoUrl: input.repoUrl ?? null,
      visibility: input.visibility,
      stage: "building",
    });

    const buildRoom = await productRepository.createBuildRoom(product.id, product.name);

    // Create Team + owner membership
    const teamRows = await db
      .insert(teams)
      .values({ productId: product.id })
      .returning();
    const team = teamRows[0];
    if (team) {
      await db
        .insert(teamMemberships)
        .values({ teamId: team.id, userId, role: "owner" });
    }

    await sendEvent({
      name: "product/created",
      data: { productId: product.id, ownerId: userId },
    });

    return { ...product, buildRoom };
  }

  async getBySlug(slug: string, viewerId?: string): Promise<ProductWithBuildRoom> {
    const product = await productRepository.findBySlug(slug);
    if (!product) throw new NotFoundError("Product");

    if (product.visibility === "private" && product.ownerId !== viewerId) {
      throw new ForbiddenError("This product is private");
    }

    const buildRoom = await productRepository.findBuildRoomByProductId(product.id);
    if (!buildRoom) throw new NotFoundError("Build Room");

    return { ...product, buildRoom };
  }

  async update(productId: string, userId: string, input: ProductUpdateInputType): Promise<Product> {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError("Product");
    if (product.ownerId !== userId) throw new ForbiddenError("Only the owner can edit this product");
    return productRepository.update(productId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.techStack !== undefined ? { techStack: input.techStack } : {}),
      ...(input.demoUrl !== undefined ? { demoUrl: input.demoUrl || null } : {}),
      ...(input.repoUrl !== undefined ? { repoUrl: input.repoUrl || null } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      ...(input.bannerUrl !== undefined ? { bannerUrl: input.bannerUrl } : {}),
    });
  }

  async transitionStage(
    productId: string,
    userId: string,
    newStage: Product["stage"]
  ): Promise<Product> {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError("Product");
    if (product.ownerId !== userId) throw new ForbiddenError("Only the owner can change the stage");

    const allowed = VALID_TRANSITIONS[product.stage] ?? [];
    if (!allowed.includes(newStage)) {
      throw new ForbiddenError(`Cannot transition from ${product.stage} to ${newStage}`);
    }

    const updated = await productRepository.update(productId, { stage: newStage });

    if (newStage === "building") {
      await sendEvent({
        name: "product/entered.building",
        data: { productId, ownerId: userId },
      });
    }

    return updated;
  }

  async listPublic(opts: { limit?: number; stage?: string }): Promise<Product[]> {
    return productRepository.listPublic({
      limit: opts.limit ?? 20,
      ...(opts.stage !== undefined ? { stage: opts.stage } : {}),
    });
  }

  async listByOwner(ownerId: string): Promise<Product[]> {
    return productRepository.listByOwner(ownerId);
  }

  async autoArchiveInactive(): Promise<void> {
    const inactive = await productRepository.findInactiveForArchive(60);
    for (const product of inactive) {
      await productRepository.update(product.id, { stage: "archived" });
      await sendEvent({
        name: "product/auto.archived",
        data: { productId: product.id, ownerId: product.ownerId },
      });
    }
  }
}

export const productService = new ProductService();
