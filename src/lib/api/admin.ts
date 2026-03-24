/**
 * Admin API module — server-side only.
 *
 * Handles the GET /admin/summary endpoint.
 */

import { apiFetch } from "./client";
import { RawAdminSummarySchema } from "./schemas";
import { adaptAdminSummary } from "./adapters";
import type { AdminSummary } from "@/types";

export async function getAdminSummary(): Promise<AdminSummary> {
  const raw = await apiFetch<unknown>("/admin/summary");
  return adaptAdminSummary(RawAdminSummarySchema.parse(raw));
}
