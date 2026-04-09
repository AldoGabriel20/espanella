/**
 * Expenses API module — server-side only.
 *
 * All functions call the backend admin endpoints and return normalized
 * camelCase types from @/types.
 */

import { apiFetch } from "./client";
import { RawExpenseSchema, RawExpenseListSchema, RawFinancialSummarySchema } from "./schemas";
import { adaptExpense, adaptFinancialSummary } from "./adapters";
import type { Expense, ExpenseListParams, PaginatedResponse, FinancialSummary } from "@/types";

function buildQuery(params: ExpenseListParams): string {
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  if (params.date_from) q.set("date_from", params.date_from);
  if (params.date_to) q.set("date_to", params.date_to);
  if (params.marketplace) q.set("marketplace", params.marketplace);
  if (params.payment_type) q.set("payment_type", params.payment_type);
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function getExpenses(
  params: ExpenseListParams = {}
): Promise<PaginatedResponse<Expense>> {
  const raw = await apiFetch<unknown>(`/admin/expenses${buildQuery(params)}`);
  const parsed = RawExpenseListSchema.parse(raw);
  return {
    data: parsed.data.map(adaptExpense),
    total: parsed.total,
    limit: parsed.limit,
    offset: parsed.offset,
  };
}

export async function getExpenseById(id: string): Promise<Expense> {
  const raw = await apiFetch<unknown>(`/admin/expenses/${id}`);
  return adaptExpense(RawExpenseSchema.parse(raw));
}

export async function getFinancialSummary(
  from: string,
  to: string
): Promise<FinancialSummary> {
  const raw = await apiFetch<unknown>(
    `/admin/financial-summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
  return adaptFinancialSummary(RawFinancialSummarySchema.parse(raw));
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export type CreateExpenseBody = {
  expense_date: string; // YYYY-MM-DD
  marketplace: string;
  store_name?: string | null;
  item_name: string;
  quantity: number;
  final_price: number;
  payment_type: string;
  notes?: string | null;
};

export type UpdateExpenseBody = Partial<CreateExpenseBody>;

export async function createExpense(body: CreateExpenseBody): Promise<Expense> {
  const raw = await apiFetch<unknown>("/admin/expenses", {
    method: "POST",
    body,
  });
  return adaptExpense(RawExpenseSchema.parse(raw));
}

export async function updateExpense(
  id: string,
  body: UpdateExpenseBody
): Promise<Expense> {
  const raw = await apiFetch<unknown>(`/admin/expenses/${id}`, {
    method: "PUT",
    body,
  });
  return adaptExpense(RawExpenseSchema.parse(raw));
}

export async function deleteExpense(id: string): Promise<void> {
  await apiFetch<unknown>(`/admin/expenses/${id}`, { method: "DELETE" });
}
