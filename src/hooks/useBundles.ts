import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Bundle, PaginatedResponse } from "@/types";

export const bundleKeys = {
  all: ["bundles"] as const,
  list: (params?: BundleListParams) =>
    ["bundles", "list", params] as const,
  detail: (id: string) => ["bundles", "detail", id] as const,
};

export type BundleListParams = {
  limit?: number;
  offset?: number;
  sortBy?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
};

async function fetchBundles(params?: BundleListParams): Promise<PaginatedResponse<Bundle>> {
  const q = new URLSearchParams();
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  if (params?.offset !== undefined) q.set("offset", String(params.offset));
  if (params?.sortBy) q.set("sort_by", params.sortBy);
  if (params?.minPrice !== undefined) q.set("min_price", String(params.minPrice));
  if (params?.maxPrice !== undefined) q.set("max_price", String(params.maxPrice));
  if (params?.inStock !== undefined) q.set("in_stock", String(params.inStock));
  const url = `/api/catalog/bundles${q.toString() ? `?${q}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to fetch bundles" }));
    throw Object.assign(new Error(err.message ?? "Failed to fetch bundles"), {
      status: res.status,
    });
  }
  return res.json();
}

async function fetchBundleById(id: string): Promise<Bundle> {
  const res = await fetch(`/api/catalog/bundles/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Bundle not found" }));
    throw Object.assign(new Error(err.message ?? "Bundle not found"), { status: res.status });
  }
  return res.json();
}

export function useBundles(params?: BundleListParams) {
  const query = useQuery({
    queryKey: bundleKeys.list(params),
    queryFn: () => fetchBundles(params),
  });
  return {
    ...query,
    bundles: query.data?.data ?? [],
    total: query.data?.total ?? 0,
  };
}

export function useBundle(id: string) {
  return useQuery({
    queryKey: bundleKeys.detail(id),
    queryFn: () => fetchBundleById(id),
    enabled: !!id,
  });
}

// ─── Mutation types ───────────────────────────────────────────────────────────

export type BundleLineInput = { itemId: string; quantity: number };
export type CreateBundleInput = {
  name: string;
  description?: string;
  price?: number;
  stock?: number;
  items: BundleLineInput[];
};
export type UpdateBundleInput = Partial<CreateBundleInput>;

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useCreateBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBundleInput): Promise<Bundle> => {
      const res = await fetch("/api/catalog/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to create bundle" }));
        throw Object.assign(new Error(err.message ?? "Failed to create bundle"), { status: res.status });
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.all });
    },
  });
}

export function useUpdateBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBundleInput }): Promise<Bundle> => {
      const res = await fetch(`/api/catalog/bundles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to update bundle" }));
        throw Object.assign(new Error(err.message ?? "Failed to update bundle"), { status: res.status });
      }
      return res.json();
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: bundleKeys.all });
      queryClient.invalidateQueries({ queryKey: bundleKeys.detail(id) });
    },
  });
}

export function useDeleteBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/catalog/bundles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to delete bundle" }));
        throw Object.assign(new Error(err.message ?? "Failed to delete bundle"), { status: res.status });
      }
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: bundleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: bundleKeys.all });
    },
  });
}
