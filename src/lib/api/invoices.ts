/**
 * Invoices API module — server-side only.
 *
 * Backend responds with snake_case JSON for invoice endpoints.
 * A 404 on GET is treated as "no invoice yet" and returns null.
 */

import { apiFetch, ApiError } from "./client";
import { RawInvoiceSchema } from "./schemas";
import { adaptInvoice, type Invoice } from "./adapters";

/**
 * Retrieve the invoice for an order.
 * Returns null when no invoice has been generated yet (404).
 */
export async function getInvoice(orderId: string): Promise<Invoice | null> {
  try {
    const raw = await apiFetch<unknown>(`/orders/${orderId}/invoice`);
    return adaptInvoice(RawInvoiceSchema.parse(raw));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Generate (or regenerate) the invoice for an order.
 * Returns the invoice with a fresh signed URL.
 */
export async function generateInvoice(orderId: string): Promise<Invoice> {
  const raw = await apiFetch<unknown>(`/orders/${orderId}/invoice`, {
    method: "POST",
  });
  return adaptInvoice(RawInvoiceSchema.parse(raw));
}
