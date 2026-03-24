import type { Metadata } from "next";
import { AdminBundlesClient } from "@/components/admin/AdminBundlesClient";

export const metadata: Metadata = {
  title: "Manage Bundles",
};

export default function AdminBundlesPage() {
  return <AdminBundlesClient />;
}
