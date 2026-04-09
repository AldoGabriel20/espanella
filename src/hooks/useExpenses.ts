import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Expense, ExpenseListParams, FinancialSummary, PaginatedResponse } from "@/types";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const expenseKeys = {
  all: ["expenses"] as const,
  list: (params?: ExpenseListParams) => ["expenses", "list", params] as const,
  detail: (id: string) => ["expenses", "detail", id] as const,
  summary: (from: string, to: string) => ["expenses", "summary", from, to] as const,
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchExpenses(
  params?: ExpenseListParams
): Promise<PaginatedResponse<Expense>> {
  const q = new URLSearchParams();
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  if (params?.offset !== undefined) q.set("offset", String(params.offset));
  if (params?.date_from) q.set("date_from", params.date_from);
  if (params?.date_to) q.set("date_to", params.date_to);
  if (params?.marketplace) q.set("marketplace", params.marketplace);
  if (params?.payment_type) q.set("payment_type", params.payment_type);
  const url = `/api/admin/expenses${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to fetch expenses" }));
    throw Object.assign(new Error(err.message ?? "Failed to fetch expenses"), {
      status: res.status,
    });
  }
  return res.json();
}

async function fetchExpenseById(id: string): Promise<Expense> {
  const res = await fetch(`/api/admin/expenses/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Expense not found" }));
    throw Object.assign(new Error(err.message ?? "Expense not found"), { status: res.status });
  }
  return res.json();
}

async function fetchFinancialSummary(from: string, to: string): Promise<FinancialSummary> {
  const res = await fetch(
    `/api/admin/financial-summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to fetch financial summary" }));
    throw Object.assign(new Error(err.message ?? "Failed to fetch financial summary"), {
      status: res.status,
    });
  }
  return res.json();
}

// ─── Query hooks ──────────────────────────────────────────────────────────────

export function useExpenses(params?: ExpenseListParams) {
  const query = useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => fetchExpenses(params),
  });
  return {
    ...query,
    expenses: query.data?.data ?? [],
    total: query.data?.total ?? 0,
  };
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => fetchExpenseById(id),
    enabled: Boolean(id),
  });
}

export function useFinancialSummary(from: string, to: string) {
  return useQuery({
    queryKey: expenseKeys.summary(from, to),
    queryFn: () => fetchFinancialSummary(from, to),
    enabled: Boolean(from) && Boolean(to),
  });
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────

type ExpenseFormValues = {
  expenseDate: string;
  marketplace: string;
  storeName?: string | null;
  itemName: string;
  quantity: number;
  finalPrice: number;
  paymentType: string;
  notes?: string | null;
};

async function postExpense(body: ExpenseFormValues): Promise<Expense> {
  const res = await fetch("/api/admin/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to create expense" }));
    throw new Error(err.message ?? "Failed to create expense");
  }
  return res.json();
}

async function putExpense({
  id,
  body,
}: {
  id: string;
  body: Partial<ExpenseFormValues>;
}): Promise<Expense> {
  const res = await fetch(`/api/admin/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to update expense" }));
    throw new Error(err.message ?? "Failed to update expense");
  }
  return res.json();
}

async function removeExpense(id: string): Promise<void> {
  const res = await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to delete expense" }));
    throw new Error(err.message ?? "Failed to delete expense");
  }
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: putExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeExpense,
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}
