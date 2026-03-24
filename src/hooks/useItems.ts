import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Item } from "@/types";

export const itemKeys = {
  all: ["items"] as const,
  list: (params?: { limit?: number; offset?: number }) =>
    ["items", "list", params] as const,
  detail: (id: string) => ["items", "detail", id] as const,
};

async function fetchItems(params?: { limit?: number; offset?: number }): Promise<Item[]> {
  const q = new URLSearchParams();
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  if (params?.offset !== undefined) q.set("offset", String(params.offset));
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

export function useItems(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: itemKeys.list(params),
    queryFn: () => fetchItems(params),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => fetchItemById(id),
    enabled: !!id,
  });
}

// ─── Mutation types ───────────────────────────────────────────────────────────

export type CreateItemInput = { name: string; stock: number; unit: string };
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
