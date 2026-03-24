import type { Metadata } from "next";
import { AdminNotificationsClient } from "@/components/admin/AdminNotificationsClient";

export const metadata: Metadata = {
  title: "Notification Logs",
};

export default function AdminNotificationsPage() {
  return <AdminNotificationsClient />;
}
