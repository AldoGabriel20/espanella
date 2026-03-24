import { useQuery } from "@tanstack/react-query";
import type { AdminSummary } from "@/types";

async function fetchAdminSummary(): Promise<AdminSummary> {
  const res = await fetch("/api/admin/summary");
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: "Failed to fetch admin summary" }));
    throw Object.assign(
      new Error(err.message ?? "Failed to fetch admin summary"),
      { status: res.status }
    );
  }
  return res.json();
}

export function useAdminSummary() {
  return useQuery<AdminSummary>({
    queryKey: ["admin", "summary"],
    queryFn: fetchAdminSummary,
    staleTime: 60_000, // 1 minute
  });
}
