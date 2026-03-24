/**
 * Orders API module — server-side only.
 *
 * All functions return normalized camelCase Order types.
 * Raw PascalCase responses are adapted inside this module.
 */

import { apiFetch } from "./client";
import { RawOrderSchema, RawOrderListSchema } from "./schemas";
import { adaptOrder, adaptOrderList } from "./adapters";
import type { Order, OrderStatus } from "@/types";

export type OrdersListParams = {
  limit?: number;
  offset?: number;
  status?: OrderStatus;
};

function buildQuery(params: OrdersListParams): string {
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  if (params.status) q.set("status", params.status);
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function getOrders(params: OrdersListParams = {}): Promise<Order[]> {
  const raw = await apiFetch<unknown>(`/orders${buildQuery(params)}`);
  return adaptOrderList(RawOrderListSchema.parse(raw));
}

export async function getOrderById(id: string): Promise<Order> {
  const raw = await apiFetch<unknown>(`/orders/${id}`);
  return adaptOrder(RawOrderSchema.parse(raw));
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export type OrderLineInput = {
  item_id?: string;
  bundle_id?: string;
  name: string;
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
