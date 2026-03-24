import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { requireSession } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireSession() redirects to /login if unauthenticated.
  const user = await requireSession();

  return (
    <AppShell role={user.role} userName={user.name}>
      {children}
    </AppShell>
  );
}

