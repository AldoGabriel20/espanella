import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Order, OrderStatus } from "@/types";

export const orderKeys = {
  all: ["orders"] as const,
  list: (params?: { limit?: number; offset?: number; status?: OrderStatus }) =>
    ["orders", "list", params] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchOrders(params?: {
  limit?: number;
  offset?: number;
  status?: OrderStatus;
}): Promise<Order[]> {
  const q = new URLSearchParams();
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  if (params?.offset !== undefined) q.set("offset", String(params.offset));
  if (params?.status) q.set("status", params.status);
  const url = `/api/orders${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to fetch orders" }));
    throw Object.assign(new Error(err.message ?? "Failed to fetch orders"), { status: res.status });
  }
  return res.json();
}

async function fetchOrderById(id: string): Promise<Order> {
  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Order not found" }));
    throw Object.assign(new Error(err.message ?? "Order not found"), { status: res.status });
  }
  return res.json();
}

// ─── Query hooks ──────────────────────────────────────────────────────────────

export function useOrders(params?: {
  limit?: number;
  offset?: number;
  status?: OrderStatus;
}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => fetchOrders(params),
  });
}

export function useOrderById(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => fetchOrderById(id),
    enabled: !!id,
  });
}

// ─── Mutation types ───────────────────────────────────────────────────────────

export type OrderDraftLine = {
  type: "item" | "bundle";
  sourceId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type CreateOrderDraft = {
  customerName: string;
  phone: string;
  deliveryDate: string;
  deliveryAmount: number;
  lines: OrderDraftLine[];
};

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: CreateOrderDraft): Promise<Order> => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to create order" }));
        throw Object.assign(new Error(err.message ?? "Failed to create order"), {
          status: res.status,
        });
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to delete order" }));
        throw Object.assign(new Error(err.message ?? "Failed to delete order"), {
          status: res.status,
        });
      }
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: OrderStatus;
    }): Promise<Order> => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ message: "Failed to update order status" }));
        throw Object.assign(
          new Error(err.message ?? "Failed to update order status"),
          { status: res.status }
        );
      }
      return res.json();
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
    },
  });
}
