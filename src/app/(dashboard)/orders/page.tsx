import type { Metadata } from "next";
import { OrdersListClient } from "@/components/orders/OrdersListClient";

export const metadata: Metadata = {
  title: "Orders",
};

export default function OrdersPage() {
  return <OrdersListClient />;
}
