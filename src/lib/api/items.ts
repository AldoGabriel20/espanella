/**
 * Items API module — server-side only.
 *
 * All functions return normalized camelCase Item types.
 * Raw PascalCase responses are adapted inside this module.
 */

import { apiFetch } from "./client";
import { RawItemSchema, RawItemListSchema } from "./schemas";
import { adaptItem, adaptItemList } from "./adapters";
import type { Item, PaginatedResponse } from "@/types";

export type ItemsListParams = {
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: "price_asc" | "price_desc" | "updated_at_asc" | "updated_at_desc" | "name_desc" | "most_ordered";
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
};

function buildQuery(params: ItemsListParams): string {
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  if (params.search) q.set("search", params.search);
  if (params.sortBy) q.set("sort_by", params.sortBy);
  if (params.minPrice !== undefined) q.set("min_price", String(params.minPrice));
  if (params.maxPrice !== undefined) q.set("max_price", String(params.maxPrice));
  if (params.inStock) q.set("in_stock", "true");
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function getItems(params: ItemsListParams = {}): Promise<PaginatedResponse<Item>> {
  const raw = await apiFetch<unknown>(`/items${buildQuery(params)}`);
  const parsed = RawItemListSchema.parse(raw);
  return {
    data: adaptItemList(parsed.data),
    total: parsed.total,
    limit: parsed.limit,
    offset: parsed.offset,
  };
}

export async function getItemById(id: string): Promise<Item> {
  const raw = await apiFetch<unknown>(`/items/${id}`);
  return adaptItem(RawItemSchema.parse(raw));
}

// ─── Writes (admin only) ──────────────────────────────────────────────────────

export type CreateItemBody = {
  name: string;
  description?: string;
  stock: number;
  unit: string;
  price: number;
};

export async function createItem(body: CreateItemBody): Promise<Item> {
  const raw = await apiFetch<unknown>("/items", {
    method: "POST",
    body,
  });
  return adaptItem(RawItemSchema.parse(raw));
}

export type UpdateItemBody = Partial<CreateItemBody>;

export async function updateItem(id: string, body: UpdateItemBody): Promise<Item> {
  const raw = await apiFetch<unknown>(`/items/${id}`, {
    method: "PUT",
    body,
  });
  return adaptItem(RawItemSchema.parse(raw));
}

export async function deleteItem(id: string): Promise<void> {
  await apiFetch<void>(`/items/${id}`, { method: "DELETE" });
}
