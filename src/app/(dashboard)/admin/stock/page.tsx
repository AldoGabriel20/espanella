import type { Metadata } from "next";
import { AdminStockClient } from "@/components/admin/AdminStockClient";

export const metadata: Metadata = {
  title: "Stock Audit",
};

export default function AdminStockPage() {
  return <AdminStockClient />;
}
