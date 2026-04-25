"use server";

import { getUser } from "@/lib/auth/server";
import { handleError } from "@/lib/errors";
import { productService } from "./services/product.service";
import { ProductCreateInput, ProductUpdateInput, StageTransitionInput } from "./schemas";
import { checkRateLimit, rateLimits } from "@/lib/ratelimit";

export async function createProductAction(raw: unknown) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const input = ProductCreateInput.parse(raw);
    const product = await productService.createFromIdea(user.id, input);
    return { ok: true as const, data: product };
  } catch (e) {
    return handleError(e);
  }
}

export async function updateProductAction(productId: string, raw: unknown) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const input = ProductUpdateInput.parse(raw);
    const product = await productService.update(productId, user.id, input);
    return { ok: true as const, data: product };
  } catch (e) {
    return handleError(e);
  }
}

export async function transitionStageAction(productId: string, raw: unknown) {
  try {
    const user = await getUser();
    await checkRateLimit(rateLimits.authedMutation, user.id);
    const { stage } = StageTransitionInput.parse(raw);
    const product = await productService.transitionStage(productId, user.id, stage);
    return { ok: true as const, data: product };
  } catch (e) {
    return handleError(e);
  }
}
