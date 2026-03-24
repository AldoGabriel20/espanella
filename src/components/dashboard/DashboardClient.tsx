"use client";

import Link from "next/link";
import { Package, Boxes, ShoppingCart, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useItems } from "@/hooks/useItems";
import { useBundles } from "@/hooks/useBundles";
import { useOrders } from "@/hooks/useOrders";
import { useAdminSummary } from "@/hooks/useAdminSummary";
import { LOW_STOCK_THRESHOLD } from "@/components/catalog/StockIndicator";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  packed: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  done: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

interface DashboardClientProps {
  user: User;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  loading,
  accent,
  href,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  loading: boolean;
  accent?: "amber" | "red" | "green" | "blue";
  href?: string;
}) {
  const content = (
    <Card
      className={cn(
        "transition-shadow hover:shadow-md cursor-default",
        href && "cursor-pointer hover:border-forest/40"
      )}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p
                className={cn(
                  "text-3xl font-semibold tabular-nums",
                  accent === "amber" && "text-amber-600",
                  accent === "red" && "text-red-600",
                  accent === "green" && "text-emerald-600",
                  accent === "blue" && "text-blue-600"
                )}
              >
                {value}
              </p>
            )}
          </div>
          <div
            className={cn(
              "rounded-xl p-2.5",
              accent === "amber" && "bg-amber-100 text-amber-600",
              accent === "red" && "bg-red-100 text-red-600",
              accent === "green" && "bg-emerald-100 text-emerald-600",
              accent === "blue" && "bg-blue-100 text-blue-600",
              !accent && "bg-forest/10 text-forest"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export function DashboardClient({ user }: DashboardClientProps) {
  const isAdmin = user.role === "admin";
  const { items, isLoading: itemsLoading } = useItems({ limit: 100 });
  const { bundles, isLoading: bundlesLoading } = useBundles({ limit: 100 });
  const { orders, isLoading: ordersLoading } = useOrders({ limit: 50 });
  const { data: summary, isLoading: summaryLoading } = useAdminSummary();

  // For admin: use accurate counts from the summary endpoint.
  // For regular users: derive counts from their own fetched lists.
  const totalItems = isAdmin ? (summary?.totalItems ?? items.length) : items.length;
  const totalBundles = isAdmin ? (summary?.totalBundles ?? bundles.length) : bundles.length;
  const totalOrders = isAdmin ? (summary?.totalOrders ?? orders.length) : orders.length;
  const pendingOrdersCount = isAdmin
    ? (summary?.pendingOrders ?? orders.filter((o) => o.status === "pending").length)
    : orders.filter((o) => o.status === "pending").length;

  const metricsLoading = isAdmin
    ? summaryLoading
    : itemsLoading || bundlesLoading || ordersLoading;

  const lowStockItems = items.filter((i) => i.availableStock <= LOW_STOCK_THRESHOLD);
  const recentOrders = orders.slice(0, 5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {greeting()}, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your operations today.
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          title="Total Items"
          value={totalItems}
          icon={Package}
          loading={metricsLoading}
          href="/catalog/items"
        />
        <MetricCard
          title="Total Bundles"
          value={totalBundles}
          icon={Boxes}
          loading={metricsLoading}
          href="/catalog/bundles"
        />
        <MetricCard
          title="Total Orders"
          value={totalOrders}
          icon={ShoppingCart}
          loading={metricsLoading}
          href="/orders"
        />
        <MetricCard
          title="Pending Orders"
          value={pendingOrdersCount}
          icon={Clock}
          loading={metricsLoading}
          accent={pendingOrdersCount > 0 ? "amber" : undefined}
          href="/orders"
        />
      </div>

      {/* Two-column panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low Stock */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low Stock Alert
              </CardTitle>
              <Link
                href="/catalog/items"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {itemsLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <TrendingUp className="h-8 w-8 text-emerald-400 mb-2" />
                <p className="text-sm font-medium text-emerald-700">All items are well-stocked</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No items below {LOW_STOCK_THRESHOLD} units
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {lowStockItems.slice(0, 6).map((item) => (
                  <li key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                    <Link
                      href={`/catalog/items/${item.id}`}
                      className="text-sm font-medium hover:text-forest transition-colors truncate"
                    >
                      {item.name}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{item.unit}</span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          item.availableStock <= 0
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {item.availableStock} avail
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4 text-forest" />
                Recent Orders
              </CardTitle>
              <Link
                href="/orders"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No orders yet</p>
                <Link
                  href="/orders/new"
                  className="mt-2 text-xs text-forest hover:underline font-medium"
                >
                  Create your first order →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/orders/${order.id}`}
                      className="flex items-center justify-between gap-2 py-2.5 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.deliveryDate)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize shrink-0",
                          ORDER_STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"
                        )}
                      >
                        {order.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
