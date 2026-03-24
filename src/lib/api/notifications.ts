/**
 * Notifications API module — server-side only.
 *
 * Handles GET /admin/notifications and POST /admin/notifications/test.
 */

import { apiFetch } from "./client";
import { RawNotificationListSchema } from "./schemas";
import { adaptNotificationList } from "./adapters";
import type { NotificationLog, PaginatedResponse } from "@/types";

export type NotificationsListParams = {
  limit?: number;
  offset?: number;
};

function buildQuery(params: NotificationsListParams): string {
  const q = new URLSearchParams();
  if (params.limit !== undefined) q.set("limit", String(params.limit));
  if (params.offset !== undefined) q.set("offset", String(params.offset));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function getNotifications(
  params: NotificationsListParams = {}
): Promise<PaginatedResponse<NotificationLog>> {
  const raw = await apiFetch<unknown>(`/admin/notifications${buildQuery(params)}`);
  const parsed = RawNotificationListSchema.parse(raw);
  return {
    data: adaptNotificationList(parsed.data),
    total: parsed.total,
    limit: parsed.limit,
    offset: parsed.offset,
  };
}

export async function sendTestNotification(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/admin/notifications/test", {
    method: "POST",
  });
}
