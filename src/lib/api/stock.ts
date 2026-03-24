/**
 * Stock movements API module — server-side only.
 *
 * All functions return normalized camelCase StockMovement types.
 * Raw PascalCase responses are adapted inside this module.
 */

import { apiFetch } from "./client";
import { RawStockMovementListSchema } from "./schemas";
import { adaptStockMovementList } from "./adapters";
import type { StockMovement } from "@/types";

export type StockListParams = {
  limit?: number;
  offset?: number;
};

function buildQuery(params: StockListParams): string {
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  const s = q.toString();
  return s ? `?${s}` : "";
}

/**
 * All stock movements across all items (admin only).
 */
export async function getStockMovements(params: StockListParams = {}): Promise<StockMovement[]> {
  const raw = await apiFetch<unknown>(`/stock-movements${buildQuery(params)}`);
  return adaptStockMovementList(RawStockMovementListSchema.parse(raw));
}

/**
 * Stock movements for a specific item.
 */
export async function getItemStockMovements(
  itemId: string,
  params: StockListParams = {}
): Promise<StockMovement[]> {
  const raw = await apiFetch<unknown>(`/items/${itemId}/stock-movements${buildQuery(params)}`);
  return adaptStockMovementList(RawStockMovementListSchema.parse(raw));
}
