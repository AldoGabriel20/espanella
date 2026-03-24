import { useQuery } from "@tanstack/react-query";
import type { StockMovement, PaginatedResponse } from "@/types";

export const stockKeys = {
  all: ["stock-movements"] as const,
  list: (params?: { limit?: number; offset?: number }) =>
    ["stock-movements", "list", params] as const,
  itemMovements: (itemId: string, params?: { limit?: number; offset?: number }) =>
    ["stock-movements", "item", itemId, params] as const,
};

async function fetchStockMovements(params?: {
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<StockMovement>> {
  const q = new URLSearchParams();
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  if (params?.offset !== undefined) q.set("offset", String(params.offset));
  const url = `/api/stock${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: "Failed to fetch stock movements" }));
    throw Object.assign(
      new Error(err.message ?? "Failed to fetch stock movements"),
      { status: res.status }
    );
  }
  return res.json();
}

async function fetchItemStockMovements(
  itemId: string,
  params?: { limit?: number; offset?: number }
): Promise<PaginatedResponse<StockMovement>> {
  const q = new URLSearchParams();
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  if (params?.offset !== undefined) q.set("offset", String(params.offset));
  const url = `/api/catalog/items/${itemId}/stock-movements${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: "Failed to fetch item stock movements" }));
    throw Object.assign(
      new Error(err.message ?? "Failed to fetch item stock movements"),
      { status: res.status }
    );
  }
  return res.json();
}

export function useStockMovements(params?: { limit?: number; offset?: number }) {
  const query = useQuery({
    queryKey: stockKeys.list(params),
    queryFn: () => fetchStockMovements(params),
  });
  return {
    ...query,
    movements: query.data?.data ?? [],
    total: query.data?.total ?? 0,
  };
}

export function useItemStockMovements(
  itemId: string,
  params?: { limit?: number; offset?: number }
) {
  const query = useQuery({
    queryKey: stockKeys.itemMovements(itemId, params),
    queryFn: () => fetchItemStockMovements(itemId, params),
    enabled: !!itemId,
  });
  return {
    ...query,
    movements: query.data?.data ?? [],
    total: query.data?.total ?? 0,
  };
}
