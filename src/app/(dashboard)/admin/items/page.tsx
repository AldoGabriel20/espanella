import type { Metadata } from "next";
import { AdminItemsClient } from "@/components/admin/AdminItemsClient";

export const metadata: Metadata = {
  title: "Manage Items",
};

export default function AdminItemsPage() {
  return <AdminItemsClient />;
}
