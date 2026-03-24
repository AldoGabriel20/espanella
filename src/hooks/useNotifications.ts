import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotificationLog, PaginatedResponse } from "@/types";

async function fetchNotifications(params?: {
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<NotificationLog>> {
  const q = new URLSearchParams();
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  if (params?.offset !== undefined) q.set("offset", String(params.offset));
  const url = `/api/admin/notifications${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: "Failed to fetch notifications" }));
    throw Object.assign(
      new Error(err.message ?? "Failed to fetch notifications"),
      { status: res.status }
    );
  }
  return res.json();
}

async function postTestNotification(): Promise<{ message: string }> {
  const res = await fetch("/api/admin/notifications/test", { method: "POST" });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ message: "Failed to send test notification" }));
    throw Object.assign(
      new Error(err.message ?? "Failed to send test notification"),
      { status: res.status }
    );
  }
  return res.json();
}

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params?: { limit?: number; offset?: number }) =>
    ["notifications", "list", params] as const,
};

export function useNotifications(params?: { limit?: number; offset?: number }) {
  return useQuery<PaginatedResponse<NotificationLog>>({
    queryKey: notificationKeys.list(params),
    queryFn: () => fetchNotifications(params),
  });
}

export function useSendTestNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postTestNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
