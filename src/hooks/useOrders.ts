import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Order, OrderStatus, PaginatedResponse } from "@/types";

export type OrderListQueryParams = {
  limit?: number;
  offset?: number;
  status?: OrderStatus;
  search?: string;
  delivery_date_from?: string;
  delivery_date_to?: string;
};

export const orderKeys = {
  all: ["orders"] as const,
  list: (params?: OrderListQueryParams) => ["orders", "list", params] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchOrders(params?: OrderListQueryParams): Promise<PaginatedResponse<Order>> {
  const q = new URLSearchParams();
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  if (params?.offset !== undefined) q.set("offset", String(params.offset));
  if (params?.status) q.set("status", params.status);
  if (params?.search) q.set("search", params.search);
  if (params?.delivery_date_from) q.set("delivery_date_from", params.delivery_date_from);
  if (params?.delivery_date_to) q.set("delivery_date_to", params.delivery_date_to);
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

export function useOrders(params?: OrderListQueryParams) {
  const query = useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => fetchOrders(params),
  });
  return {
    ...query,
    orders: query.data?.data ?? [],
    total: query.data?.total ?? 0,
  };
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
  address?: string | null;
  cardRequest?: boolean;
  notes?: string | null;
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

/** Cancel an order (pending/confirmed only). Both users and admins may call this. */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Order> => {
      const res = await fetch(`/api/orders/${id}/cancel`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to cancel order" }));
        throw Object.assign(new Error(err.message ?? "Failed to cancel order"), {
          status: res.status,
        });
      }
      return res.json();
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
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

/** Admin: edit order header + items. */
export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: {
        delivery_date?: string;
        delivery_amount?: number;
        items?: Array<{
          item_id?: string;
          bundle_id?: string;
          line_name: string;
          quantity: number;
          unit_price: number;
        }>;
      };
    }): Promise<Order> => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to update order" }));
        throw Object.assign(new Error(err.message ?? "Failed to update order"), {
          status: res.status,
        });
      }
      return res.json();
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

/** Admin: bulk update order statuses. */
export function useBulkUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[];
      status: OrderStatus;
    }): Promise<{ updated: number }> => {
      const res = await fetch("/api/orders/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to bulk update orders" }));
        throw Object.assign(new Error(err.message ?? "Failed to bulk update orders"), {
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

/** Admin: set airwaybill number and courier on a shipped/done order. */
export function useUpdateAirwaybill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      airwaybill_number,
      courier,
    }: {
      id: string;
      airwaybill_number?: string | null;
      courier?: string | null;
    }): Promise<Order> => {
      const res = await fetch(`/api/orders/${id}/airwaybill`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ airwaybill_number, courier }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to update airwaybill" }));
        throw Object.assign(new Error(err.message ?? "Failed to update airwaybill"), {
          status: res.status,
        });
      }
      return res.json();
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
