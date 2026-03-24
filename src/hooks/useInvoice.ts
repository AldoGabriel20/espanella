import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Invoice } from "@/lib/api/adapters";

export const invoiceKeys = {
  all: ["invoices"] as const,
  detail: (orderId: string) => ["invoices", "detail", orderId] as const,
};

async function fetchInvoice(orderId: string): Promise<Invoice | null> {
  const res = await fetch(`/api/orders/${orderId}/invoice`);
  if (!res.ok) {
    // 404 → no invoice yet, return null
    if (res.status === 404) return null;
    const err = await res.json().catch(() => ({ message: "Failed to fetch invoice" }));
    throw Object.assign(new Error(err.message ?? "Failed to fetch invoice"), {
      status: res.status,
    });
  }
  return res.json();
}

export function useInvoice(orderId: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(orderId),
    queryFn: () => fetchInvoice(orderId),
    enabled: !!orderId,
  });
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string): Promise<Invoice> => {
      const res = await fetch(`/api/orders/${orderId}/invoice`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to generate invoice" }));
        throw Object.assign(new Error(err.message ?? "Failed to generate invoice"), {
          status: res.status,
        });
      }
      return res.json();
    },
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(orderId) });
    },
  });
}
