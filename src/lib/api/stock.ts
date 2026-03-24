/**
 * Stock movements API module — server-side only.
 *
 * All functions return normalized camelCase StockMovement types.
 * Raw PascalCase responses are adapted inside this module.
 */

import { apiFetch } from "./client";
import { RawStockMovementListSchema } from "./schemas";
import { adaptStockMovementList } from "./adapters";
import type { StockMovement, PaginatedResponse } from "@/types";

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
export async function getStockMovements(params: StockListParams = {}): Promise<PaginatedResponse<StockMovement>> {
  const raw = await apiFetch<unknown>(`/stock-movements${buildQuery(params)}`);
  const parsed = RawStockMovementListSchema.parse(raw);
  return {
    data: adaptStockMovementList(parsed.data),
    total: parsed.total,
    limit: parsed.limit,
    offset: parsed.offset,
  };
}

/**
 * Stock movements for a specific item.
 */
export async function getItemStockMovements(
  itemId: string,
  params: StockListParams = {}
): Promise<PaginatedResponse<StockMovement>> {
  const raw = await apiFetch<unknown>(`/items/${itemId}/stock-movements${buildQuery(params)}`);
  const parsed = RawStockMovementListSchema.parse(raw);
  return {
    data: adaptStockMovementList(parsed.data),
    total: parsed.total,
    limit: parsed.limit,
    offset: parsed.offset,
  };
}
