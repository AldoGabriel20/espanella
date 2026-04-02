import type { Metadata } from "next";
import { AdminFulfillmentClient } from "@/components/admin/AdminFulfillmentClient";

export const metadata: Metadata = {
  title: "Smart Fulfillment",
};

export default function AdminFulfillmentPage() {
  return <AdminFulfillmentClient />;
}
