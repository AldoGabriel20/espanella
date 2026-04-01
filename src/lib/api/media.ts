/**
 * Product media API — server-side only.
 * All functions return normalized camelCase types.
 */

import { apiFetch } from "./client";
import { RawItemMediaSchema } from "./schemas";
import { adaptItemMedia } from "./adapters";
import type { ItemMedia } from "@/types";
import { z } from "zod";

const RawItemMediaListSchema = z.array(RawItemMediaSchema);

export type PresignRequest = {
  filename: string;
  content_type: string;
  size_bytes: number;
  media_type: "image" | "video";
};

export type PresignResponse = {
  uploadUrl: string;
  storageBucket: string;
  storagePath: string;
  publicUrl: string;
  expiresInSeconds: number;
};

export type CompleteRequest = {
  storage_bucket: string;
  storage_path: string;
  public_url: string;
  media_type: "image" | "video";
  mime_type: string;
  file_size_bytes: number;
  width?: number | null;
  height?: number | null;
  duration_seconds?: number | null;
  alt_text?: string | null;
  is_primary: boolean;
};

export async function listMedia(itemId: string): Promise<ItemMedia[]> {
  const raw = await apiFetch<unknown>(`/items/${itemId}/media`);
  return RawItemMediaListSchema.parse(raw).map(adaptItemMedia);
}

export async function presignMedia(
  itemId: string,
  body: PresignRequest
): Promise<PresignResponse> {
  const raw = await apiFetch<{
    upload_url: string;
    storage_bucket: string;
    storage_path: string;
    public_url: string;
    expires_in_seconds: number;
  }>(`/items/${itemId}/media/presign`, { method: "POST", body });
  return {
    uploadUrl: raw.upload_url,
    storageBucket: raw.storage_bucket,
    storagePath: raw.storage_path,
    publicUrl: raw.public_url,
    expiresInSeconds: raw.expires_in_seconds,
  };
}

export async function completeMedia(
  itemId: string,
  body: CompleteRequest
): Promise<ItemMedia> {
  const raw = await apiFetch<unknown>(`/items/${itemId}/media/complete`, {
    method: "POST",
    body,
  });
  return adaptItemMedia(RawItemMediaSchema.parse(raw));
}

export async function reorderMedia(
  itemId: string,
  orderedIds: string[]
): Promise<void> {
  await apiFetch<void>(`/items/${itemId}/media/reorder`, {
    method: "PATCH",
    body: { ordered_ids: orderedIds },
  });
}

export async function setPrimaryMedia(
  itemId: string,
  mediaId: string
): Promise<void> {
  await apiFetch<void>(`/items/${itemId}/media/${mediaId}/primary`, {
    method: "PATCH",
  });
}

export async function deleteMedia(
  itemId: string,
  mediaId: string
): Promise<void> {
  await apiFetch<void>(`/items/${itemId}/media/${mediaId}`, {
    method: "DELETE",
  });
}
