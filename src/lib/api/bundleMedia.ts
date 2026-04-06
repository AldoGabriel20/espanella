/**
 * Bundle media API — server-side only.
 * All functions return normalized camelCase types.
 */

import { apiFetch } from "./client";
import { RawBundleMediaSchema } from "./schemas";
import { adaptBundleMedia } from "./adapters";
import type { BundleMedia } from "@/types";
import { z } from "zod";
import type { PresignRequest, PresignResponse, CompleteRequest } from "./media";

const RawBundleMediaListSchema = z.array(RawBundleMediaSchema);

export async function listBundleMedia(bundleId: string): Promise<BundleMedia[]> {
  const raw = await apiFetch<unknown>(`/bundles/${bundleId}/media`);
  return RawBundleMediaListSchema.parse(raw).map(adaptBundleMedia);
}

export async function presignBundleMedia(
  bundleId: string,
  body: PresignRequest
): Promise<PresignResponse> {
  const raw = await apiFetch<{
    upload_url: string;
    storage_bucket: string;
    storage_path: string;
    public_url: string;
    expires_in_seconds: number;
  }>(`/bundles/${bundleId}/media/presign`, { method: "POST", body });
  return {
    uploadUrl: raw.upload_url,
    storageBucket: raw.storage_bucket,
    storagePath: raw.storage_path,
    publicUrl: raw.public_url,
    expiresInSeconds: raw.expires_in_seconds,
  };
}

export async function completeBundleMedia(
  bundleId: string,
  body: CompleteRequest
): Promise<BundleMedia> {
  const raw = await apiFetch<unknown>(`/bundles/${bundleId}/media/complete`, {
    method: "POST",
    body,
  });
  return adaptBundleMedia(RawBundleMediaSchema.parse(raw));
}

export async function reorderBundleMedia(
  bundleId: string,
  orderedIds: string[]
): Promise<void> {
  await apiFetch<void>(`/bundles/${bundleId}/media/reorder`, {
    method: "PATCH",
    body: { ordered_ids: orderedIds },
  });
}

export async function setPrimaryBundleMedia(
  bundleId: string,
  mediaId: string
): Promise<void> {
  await apiFetch<void>(`/bundles/${bundleId}/media/${mediaId}/primary`, {
    method: "PATCH",
  });
}

export async function deleteBundleMedia(
  bundleId: string,
  mediaId: string
): Promise<void> {
  await apiFetch<void>(`/bundles/${bundleId}/media/${mediaId}`, {
    method: "DELETE",
  });
}
