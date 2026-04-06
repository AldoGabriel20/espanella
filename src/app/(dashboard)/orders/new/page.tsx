import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { OrderComposer } from "@/components/orders/OrderComposer";

export const metadata: Metadata = {
  title: "New Order",
};

export default async function NewOrderPage() {
  const user = await requireSession();
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Order"
        description="Compose a hamper order for your customer."
        backHref="/orders"
      />
      <OrderComposer isAdmin={user.role === "admin"} />
    </div>
  );
}
