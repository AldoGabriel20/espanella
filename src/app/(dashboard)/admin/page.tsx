import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes, PackageOpen, ShoppingBag, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin",
};

const adminCards = [
  {
    title: "Inventory",
    description: "Create, edit, and monitor catalog items.",
    icon: Boxes,
    href: "/admin/items",
  },
  {
    title: "Bundles",
    description: "Define and manage hamper bundle compositions.",
    icon: PackageOpen,
    href: "/admin/bundles",
  },
  {
    title: "Orders",
    description: "Update order statuses and generate invoices.",
    icon: ShoppingBag,
    href: "/admin/orders",
  },
  {
    title: "Stock Audit",
    description: "Review all stock movements and audit history.",
    icon: BarChart3,
    href: "/admin/stock",
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin"
        description="Operations workspace for managing the Leuzien catalog and orders."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <a key={card.href} href={card.href}>
              <Card className="h-full hover:border-forest/50 hover:shadow-md transition-all group cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-md bg-forest-light flex items-center justify-center mb-3 group-hover:bg-forest group-hover:text-forest-foreground transition-colors">
                    <Icon className="h-5 w-5 text-forest group-hover:text-forest-foreground transition-colors" />
                  </div>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}
