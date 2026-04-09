import type { Metadata } from "next";
import AdminCompanyClient from "@/components/admin/AdminCompanyClient";

export const metadata: Metadata = {
  title: "Company Profile | Admin",
};

export default function AdminCompanyPage() {
  return <AdminCompanyClient />;
}
