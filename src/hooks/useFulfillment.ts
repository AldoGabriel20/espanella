import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  RecommendationsResponse,
  FulfillmentBatch,
  PaginatedResponse,
  CreateBatchPayload,
  UpdateBatchStatusPayload,
} from "@/types";

// ─── Query key factory ────────────────────────────────────────────────────────

export const fulfillmentKeys = {
  all: ["fulfillment"] as const,
  recommendations: (params?: object) => ["fulfillment", "recommendations", params] as const,
  batches: () => ["fulfillment", "batches"] as const,
  batchList: (params?: object) => ["fulfillment", "batches", "list", params] as const,
  batch: (id: string) => ["fulfillment", "batches", id] as const,
};

// ─── Recommendations ──────────────────────────────────────────────────────────

export type RecommendationQueryParams = {
  from?: string;
  to?: string;
  includePending?: boolean;
  maxBatchSize?: number;
  maxUnits?: number;
};

async function fetchRecommendations(
  params: RecommendationQueryParams
): Promise<RecommendationsResponse> {
  const q = new URLSearchParams();
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.includePending) q.set("include_pending", "true");
  if (params.maxBatchSize) q.set("max_batch_size", String(params.maxBatchSize));
  if (params.maxUnits) q.set("max_units", String(params.maxUnits));
  const url = `/api/admin/fulfillment/recommendations${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to fetch recommendations" }));
    throw Object.assign(new Error(err.message ?? "Failed to fetch recommendations"), {
      status: res.status,
    });
  }
  return res.json();
}

export function useRecommendations(params: RecommendationQueryParams, enabled = true) {
  return useQuery<RecommendationsResponse>({
    queryKey: fulfillmentKeys.recommendations(params),
    queryFn: () => fetchRecommendations(params),
    enabled,
    staleTime: 30_000,
  });
}

// ─── Save batch ───────────────────────────────────────────────────────────────

async function postBatch(payload: CreateBatchPayload): Promise<FulfillmentBatch> {
  const res = await fetch("/api/admin/fulfillment/batches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to save batch" }));
    throw Object.assign(new Error(err.message ?? "Failed to save batch"), {
      status: res.status,
    });
  }
  return res.json();
}

export function useSaveBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fulfillmentKeys.batches() });
    },
  });
}

// ─── List batches ─────────────────────────────────────────────────────────────

async function fetchBatches(params?: {
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<FulfillmentBatch>> {
  const q = new URLSearchParams();
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  if (params?.offset !== undefined) q.set("offset", String(params.offset));
  const url = `/api/admin/fulfillment/batches${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to fetch batches" }));
    throw Object.assign(new Error(err.message ?? "Failed to fetch batches"), {
      status: res.status,
    });
  }
  return res.json();
}

export function useBatches(params?: { limit?: number; offset?: number }) {
  return useQuery<PaginatedResponse<FulfillmentBatch>>({
    queryKey: fulfillmentKeys.batchList(params),
    queryFn: () => fetchBatches(params),
  });
}

// ─── Get single batch ─────────────────────────────────────────────────────────

async function fetchBatch(id: string): Promise<FulfillmentBatch> {
  const res = await fetch(`/api/admin/fulfillment/batches/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Batch not found" }));
    throw Object.assign(new Error(err.message ?? "Batch not found"), {
      status: res.status,
    });
  }
  return res.json();
}

export function useBatch(id: string) {
  return useQuery<FulfillmentBatch>({
    queryKey: fulfillmentKeys.batch(id),
    queryFn: () => fetchBatch(id),
    enabled: Boolean(id),
  });
}

// ─── Update batch status ──────────────────────────────────────────────────────

async function patchBatchStatus({
  id,
  payload,
}: {
  id: string;
  payload: UpdateBatchStatusPayload;
}): Promise<FulfillmentBatch> {
  const res = await fetch(`/api/admin/fulfillment/batches/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to update batch status" }));
    throw Object.assign(new Error(err.message ?? "Failed to update batch status"), {
      status: res.status,
    });
  }
  return res.json();
}

export function useUpdateBatchStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchBatchStatus,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: fulfillmentKeys.batches() });
      queryClient.setQueryData(fulfillmentKeys.batch(updated.id), updated);
    },
  });
}
