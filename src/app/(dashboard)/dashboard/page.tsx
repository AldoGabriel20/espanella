import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireSession();
  return <DashboardClient user={user} />;
}
