import * as React from "react";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Admin section guard layout.
 *
 * requireAdmin() redirects:
 * - unauthenticated users → /login
 * - authenticated non-admin users → /dashboard
 *
 * This layout wraps all /admin/* pages as a second guard layer on top of the
 * (dashboard) parent layout which already checks for authentication.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
