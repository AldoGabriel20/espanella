import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Item, PaginatedResponse } from "@/types";
import type { ItemsListParams } from "@/lib/api/items";

export const itemKeys = {
  all: ["items"] as const,
  list: (params?: ItemsListParams) =>
    ["items", "list", params] as const,
  detail: (id: string) => ["items", "detail", id] as const,
};

async function fetchItems(params?: ItemsListParams): Promise<PaginatedResponse<Item>> {
  const q = new URLSearchParams();
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  if (params?.offset !== undefined) q.set("offset", String(params.offset));
  if (params?.search) q.set("search", params.search);
  if (params?.sortBy) q.set("sort_by", params.sortBy);
  if (params?.minPrice !== undefined) q.set("min_price", String(params.minPrice));
  if (params?.maxPrice !== undefined) q.set("max_price", String(params.maxPrice));
  if (params?.inStock) q.set("in_stock", "true");
  const url = `/api/catalog/items${q.toString() ? `?${q}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to fetch items" }));
    throw Object.assign(new Error(err.message ?? "Failed to fetch items"), { status: res.status });
  }
  return res.json();
}

async function fetchItemById(id: string): Promise<Item> {
  const res = await fetch(`/api/catalog/items/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Item not found" }));
    throw Object.assign(new Error(err.message ?? "Item not found"), { status: res.status });
  }
  return res.json();
}

export function useItems(params?: ItemsListParams) {
  const query = useQuery({
    queryKey: itemKeys.list(params),
    queryFn: () => fetchItems(params),
  });
  return {
    ...query,
    items: query.data?.data ?? [],
    total: query.data?.total ?? 0,
  };
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => fetchItemById(id),
    enabled: !!id,
  });
}

// ─── Mutation types ───────────────────────────────────────────────────────────

export type CreateItemInput = { name: string; description?: string; stock: number; unit: string; price: number };
export type UpdateItemInput = Partial<CreateItemInput>;

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateItemInput): Promise<Item> => {
      const res = await fetch("/api/catalog/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to create item" }));
        throw Object.assign(new Error(err.message ?? "Failed to create item"), { status: res.status });
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateItemInput }): Promise<Item> => {
      const res = await fetch(`/api/catalog/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to update item" }));
        throw Object.assign(new Error(err.message ?? "Failed to update item"), { status: res.status });
      }
      return res.json();
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(id) });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/catalog/items/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to delete item" }));
        throw Object.assign(new Error(err.message ?? "Failed to delete item"), { status: res.status });
      }
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: itemKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}
