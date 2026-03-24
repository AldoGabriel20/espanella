/**
 * Items API module — server-side only.
 *
 * All functions return normalized camelCase Item types.
 * Raw PascalCase responses are adapted inside this module.
 */

import { apiFetch } from "./client";
import { RawItemSchema, RawItemListSchema } from "./schemas";
import { adaptItem, adaptItemList } from "./adapters";
import type { Item } from "@/types";

export type ItemsListParams = {
  limit?: number;
  offset?: number;
};

function buildQuery(params: ItemsListParams): string {
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function getItems(params: ItemsListParams = {}): Promise<Item[]> {
  const raw = await apiFetch<unknown>(`/items${buildQuery(params)}`);
  return adaptItemList(RawItemListSchema.parse(raw));
}

export async function getItemById(id: string): Promise<Item> {
  const raw = await apiFetch<unknown>(`/items/${id}`);
  return adaptItem(RawItemSchema.parse(raw));
}

// ─── Writes (admin only) ──────────────────────────────────────────────────────

export type CreateItemBody = {
  name: string;
  stock: number;
  unit: string;
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
