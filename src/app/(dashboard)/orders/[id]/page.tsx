import type { Metadata } from "next";
import { OrderDetailClient } from "@/components/orders/OrderDetailClient";

export const metadata: Metadata = {
  title: "Order Detail",
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return <OrderDetailClient id={params.id} />;
}
