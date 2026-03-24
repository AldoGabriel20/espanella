"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight, AlertCircle, Info, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useOrders } from "@/hooks/useOrders";
import { formatDate } from "@/lib/utils/date";
import { formatIDR } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Packed", value: "packed" },
  { label: "Shipped", value: "shipped" },
  { label: "Done", value: "done" },
  { label: "Cancelled", value: "cancelled" },
];

export function OrdersListClient() {
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const queryParams = {
    limit: PAGE_SIZE,
    offset,
    ...(statusFilter !== "all" && { status: statusFilter }),
  };

  const { data: orders, isLoading, isError, error } = useOrders(queryParams);

  const canPrev = offset > 0;
  const canNext = orders?.length === PAGE_SIZE;

  function handleFilterChange(value: OrderStatus | "all") {
    setStatusFilter(value);
    setOffset(0);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description="Manage customer hamper orders."
        action={
          <Link href="/orders/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          </Link>
        }
      />

      {/* Global visibility warning */}
      <Alert className="border-amber-200 bg-amber-50 text-amber-800">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription>
          Orders are visible to all authenticated team members. Per-user order scoping is not yet
          implemented in the API.
        </AlertDescription>
      </Alert>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              statusFilter === f.value
                ? "bg-forest text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error instanceof Error ? error.message : "Failed to load orders"}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell text-right">Total</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20 sm:hidden" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      {statusFilter !== "all"
                        ? `No ${statusFilter} orders`
                        : "No orders yet"}
                    </p>
                    {statusFilter === "all" && (
                      <Link href="/orders/new">
                        <Button size="sm" variant="outline">
                          Create your first order
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders?.map((order) => (
                <TableRow key={order.id} className="group">
                  <TableCell>
                    <div>
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium hover:text-forest transition-colors"
                      >
                        {order.customerName}
                      </Link>
                      <p className="text-xs text-muted-foreground sm:hidden">{order.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {order.phone}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(order.deliveryDate)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right tabular-nums text-sm">
                    {formatIDR(order.totalPrice)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-muted-foreground hover:text-foreground transition-colors text-xs opacity-0 group-hover:opacity-100"
                    >
                      View →
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && (orders?.length ?? 0) > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}–{offset + (orders?.length ?? 0)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrev}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
