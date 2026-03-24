/**
 * Bundles API module — server-side only.
 *
 * All functions return normalized camelCase Bundle types.
 * Raw PascalCase responses are adapted inside this module.
 */

import { apiFetch } from "./client";
import { RawBundleSchema, RawBundleListSchema } from "./schemas";
import { adaptBundle, adaptBundleList } from "./adapters";
import type { Bundle } from "@/types";

export type BundlesListParams = {
  limit?: number;
  offset?: number;
};

function buildQuery(params: BundlesListParams): string {
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function getBundles(params: BundlesListParams = {}): Promise<Bundle[]> {
  const raw = await apiFetch<unknown>(`/bundles${buildQuery(params)}`);
  return adaptBundleList(RawBundleListSchema.parse(raw));
}

export async function getBundleById(id: string): Promise<Bundle> {
  const raw = await apiFetch<unknown>(`/bundles/${id}`);
  return adaptBundle(RawBundleSchema.parse(raw));
}

// ─── Writes (admin only) ──────────────────────────────────────────────────────

export type BundleItemInput = {
  item_id: string;
  quantity: number;
};

export type CreateBundleBody = {
  name: string;
  items: BundleItemInput[];
};

export async function createBundle(body: CreateBundleBody): Promise<Bundle> {
  const raw = await apiFetch<unknown>("/bundles", {
    method: "POST",
    body,
  });
  return adaptBundle(RawBundleSchema.parse(raw));
}

export type UpdateBundleBody = Partial<CreateBundleBody>;

export async function updateBundle(id: string, body: UpdateBundleBody): Promise<Bundle> {
  const raw = await apiFetch<unknown>(`/bundles/${id}`, {
    method: "PUT",
    body,
  });
  return adaptBundle(RawBundleSchema.parse(raw));
}

export async function deleteBundle(id: string): Promise<void> {
  await apiFetch<void>(`/bundles/${id}`, { method: "DELETE" });
}
