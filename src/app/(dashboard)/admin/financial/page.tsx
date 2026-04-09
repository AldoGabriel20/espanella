import type { Metadata } from "next";
import AdminFinancialClient from "@/components/admin/AdminFinancialClient";

export const metadata: Metadata = {
  title: "Financial Reporting | Admin",
};

export default function AdminFinancialPage() {
  return <AdminFinancialClient />;
}
