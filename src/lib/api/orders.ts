/**
 * Orders API module — server-side only.
 *
 * All functions return normalized camelCase Order types.
 * Raw PascalCase responses are adapted inside this module.
 */

import { apiFetch } from "./client";
import { RawOrderSchema, RawOrderListSchema } from "./schemas";
import { adaptOrder, adaptOrderList } from "./adapters";
import type { Order, OrderStatus, PaginatedResponse } from "@/types";

export type OrdersListParams = {
  limit?: number;
  offset?: number;
  status?: OrderStatus;
  search?: string;
  delivery_date_from?: string; // ISO date (YYYY-MM-DD)
  delivery_date_to?: string;
};

function buildQuery(params: OrdersListParams): string {
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  if (params.status) q.set("status", params.status);
  if (params.search) q.set("search", params.search);
  if (params.delivery_date_from) q.set("delivery_date_from", params.delivery_date_from);
  if (params.delivery_date_to) q.set("delivery_date_to", params.delivery_date_to);
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function getOrders(params: OrdersListParams = {}): Promise<PaginatedResponse<Order>> {
  const raw = await apiFetch<unknown>(`/orders${buildQuery(params)}`);
  const parsed = RawOrderListSchema.parse(raw);
  return {
    data: adaptOrderList(parsed.data),
    total: parsed.total,
    limit: parsed.limit,
    offset: parsed.offset,
  };
}

export async function getOrderById(id: string): Promise<Order> {
  const raw = await apiFetch<unknown>(`/orders/${id}`);
  return adaptOrder(RawOrderSchema.parse(raw));
}

/** Fetch a fresh short-lived (5-min) signed URL for an existing invoice. */
export async function getInvoiceURL(orderId: string): Promise<string> {
  const raw = await apiFetch<{ invoice_url: string }>(`/orders/${orderId}/invoice`);
  return raw.invoice_url;
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export type OrderLineInput = {
  item_id?: string;
  bundle_id?: string;
  line_name: string;
  quantity: number;
  unit_price: number;
};

export type CreateOrderBody = {
  customer_name: string;
  phone: string;
  delivery_date: string; // ISO date string
  delivery_amount: number;
  items: OrderLineInput[];
};

export async function createOrder(body: CreateOrderBody): Promise<Order> {
  const raw = await apiFetch<unknown>("/orders", {
    method: "POST",
    body,
  });
  return adaptOrder(RawOrderSchema.parse(raw));
}

export async function deleteOrder(id: string): Promise<void> {
  await apiFetch<void>(`/orders/${id}`, { method: "DELETE" });
}

/** Cancel an order (user or admin). Returns the updated order. */
export async function cancelOrder(id: string): Promise<Order> {
  const raw = await apiFetch<unknown>(`/orders/${id}/cancel`, { method: "PATCH" });
  return adaptOrder(RawOrderSchema.parse(raw));
}

// ─── Status transition (admin only) ──────────────────────────────────────────

export type UpdateOrderStatusBody = {
  status: OrderStatus;
};

export async function updateOrderStatus(
  id: string,
  body: UpdateOrderStatusBody
): Promise<Order> {
  const raw = await apiFetch<unknown>(`/orders/${id}/status`, {
    method: "PATCH",
    body,
  });
  return adaptOrder(RawOrderSchema.parse(raw));
}

// ─── Admin order edit ─────────────────────────────────────────────────────────

export type UpdateOrderBody = {
  delivery_date?: string;
  delivery_amount?: number;
  items?: OrderLineInput[];
};

export async function updateOrder(id: string, body: UpdateOrderBody): Promise<Order> {
  const raw = await apiFetch<unknown>(`/orders/${id}`, {
    method: "PUT",
    body,
  });
  return adaptOrder(RawOrderSchema.parse(raw));
}

// ─── Bulk status update (admin only) ─────────────────────────────────────────

export type BulkUpdateStatusBody = {
  ids: string[];
  status: OrderStatus;
};

export async function bulkUpdateOrderStatus(
  body: BulkUpdateStatusBody
): Promise<{ updated: number }> {
  return apiFetch<{ updated: number }>("/orders/bulk-status", {
    method: "POST",
    body,
  });
}

// ─── Airwaybill (admin only) ──────────────────────────────────────────────────

export type UpdateAirwaybillBody = {
  airwaybill_number?: string | null;
  courier?: string | null;
};

export async function updateAirwaybill(
  id: string,
  body: UpdateAirwaybillBody
): Promise<Order> {
  const raw = await apiFetch<unknown>(`/orders/${id}/airwaybill`, {
    method: "PATCH",
    body,
  });
  return adaptOrder(RawOrderSchema.parse(raw));
}
