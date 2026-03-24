import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { OrderComposer } from "@/components/orders/OrderComposer";

export const metadata: Metadata = {
  title: "New Order",
};

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Order"
        description="Compose a hamper order for your customer."
        backHref="/orders"
      />
      <OrderComposer />
    </div>
  );
}
