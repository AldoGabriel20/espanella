/**
 * Fulfillment API module — server-side only (BFF layer).
 *
 * Handles:
 *   GET  /admin/fulfillment/recommendations
 *   POST /admin/fulfillment/batches
 *   GET  /admin/fulfillment/batches
 *   GET  /admin/fulfillment/batches/:id
 *   PATCH /admin/fulfillment/batches/:id/status
 */

import { apiFetch } from "./client";
import {
  RawRecommendationsResponseSchema,
  RawFulfillmentBatchListSchema,
  RawFulfillmentBatchSchema,
} from "./schemas";
import {
  adaptRecommendationsResponse,
  adaptFulfillmentBatch,
  adaptFulfillmentBatchList,
} from "./adapters";
import type {
  RecommendationsResponse,
  FulfillmentBatch,
  PaginatedResponse,
  CreateBatchPayload,
  UpdateBatchStatusPayload,
  BatchRecommendation,
} from "@/types";

export type RecommendationParams = {
  from?: string;         // YYYY-MM-DD
  to?: string;           // YYYY-MM-DD
  includePending?: boolean;
  maxBatchSize?: number;
  maxUnits?: number;
};

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== false) {
      q.set(k, String(v));
    }
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function getRecommendations(
  params: RecommendationParams = {}
): Promise<RecommendationsResponse> {
  const raw = await apiFetch<unknown>(
    `/admin/fulfillment/recommendations${buildQuery({
      from: params.from,
      to: params.to,
      include_pending: params.includePending,
      max_batch_size: params.maxBatchSize,
      max_units: params.maxUnits,
    })}`
  );
  const parsed = RawRecommendationsResponseSchema.parse(raw);
  return adaptRecommendationsResponse(parsed);
}

export async function createBatch(payload: CreateBatchPayload): Promise<FulfillmentBatch> {
  const raw = await apiFetch<unknown>("/admin/fulfillment/batches", {
    method: "POST",
    body: payload,
  });
  const parsed = RawFulfillmentBatchSchema.parse(raw);
  return adaptFulfillmentBatch(parsed);
}

export async function listBatches(params?: {
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<FulfillmentBatch>> {
  const raw = await apiFetch<unknown>(
    `/admin/fulfillment/batches${buildQuery({
      limit: params?.limit,
      offset: params?.offset,
    })}`
  );
  const parsed = RawFulfillmentBatchListSchema.parse(raw);
  return {
    data: adaptFulfillmentBatchList(parsed.data),
    total: parsed.total,
    limit: parsed.limit,
    offset: parsed.offset,
  };
}

export async function getBatch(id: string): Promise<FulfillmentBatch> {
  const raw = await apiFetch<unknown>(`/admin/fulfillment/batches/${id}`);
  const parsed = RawFulfillmentBatchSchema.parse(raw);
  return adaptFulfillmentBatch(parsed);
}

export async function updateBatchStatus(
  id: string,
  payload: UpdateBatchStatusPayload
): Promise<FulfillmentBatch> {
  const raw = await apiFetch<unknown>(`/admin/fulfillment/batches/${id}/status`, {
    method: "PATCH",
    body: payload,
  });
  const parsed = RawFulfillmentBatchSchema.parse(raw);
  return adaptFulfillmentBatch(parsed);
}

// Helper to build CreateBatchPayload from a recommendation.
export function recommendationToPayload(
  rec: BatchRecommendation,
  name?: string
): CreateBatchPayload {
  return {
    name: name ?? rec.rationaleSummary,
    order_ids: rec.orders.map((o) => o.id),
    recommendation: rec,
  };
}
