"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { OrderStatusBadge, STATUS_CONFIG } from "@/components/orders/OrderStatusBadge";
import { InvoiceActions } from "@/components/admin/InvoiceActions";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { formatDate } from "@/lib/utils/date";
import { formatIDR } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const PAGE_SIZE = 20;

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "done",
  "cancelled",
];

// ─── Status selector ──────────────────────────────────────────────────────────

interface StatusSelectorProps {
  order: Order;
}

function StatusSelector({ order }: StatusSelectorProps) {
  const [open, setOpen] = useState(false);
  const updateStatus = useUpdateOrderStatus();

  async function handleSelect(newStatus: OrderStatus) {
    if (newStatus === order.status) {
      setOpen(false);
      return;
    }
    try {
      await updateStatus.mutateAsync({ id: order.id, status: newStatus });
    } catch {
      // error rendered inline
    } finally {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={updateStatus.isPending}
        className={cn(
          "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity",
          STATUS_CONFIG[order.status]?.className,
          "hover:opacity-80 disabled:opacity-50"
        )}
        aria-label={`Order status: ${STATUS_CONFIG[order.status]?.label ?? order.status}. Click to change.`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {STATUS_CONFIG[order.status]?.label ?? order.status}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute left-0 top-full mt-1 z-20 min-w-[140px] rounded-md border bg-popover shadow-md py-1"
          >
            {ALL_STATUSES.map((s) => (
              <li key={s}>
                <button
                  role="option"
                  aria-selected={s === order.status}
                  onClick={() => handleSelect(s)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  <span
                    className={cn(
                      "inline-block h-2 w-2 rounded-full shrink-0",
                      STATUS_CONFIG[s]?.className?.includes("amber")
                        ? "bg-amber-400"
                        : STATUS_CONFIG[s]?.className?.includes("blue")
                        ? "bg-blue-400"
                        : STATUS_CONFIG[s]?.className?.includes("indigo")
                        ? "bg-indigo-400"
                        : STATUS_CONFIG[s]?.className?.includes("purple")
                        ? "bg-purple-400"
                        : STATUS_CONFIG[s]?.className?.includes("emerald")
                        ? "bg-emerald-400"
                        : "bg-red-400"
                    )}
                  />
                  {STATUS_CONFIG[s]?.label ?? s}
                  {s === order.status && (
                    <Check className="h-3 w-3 ml-auto text-muted-foreground" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {updateStatus.isError && (
        <p className="absolute left-0 top-full mt-1 text-xs text-red-500 whitespace-nowrap z-30">
          {updateStatus.error instanceof Error
            ? updateStatus.error.message
            : "Update failed"}
        </p>
      )}
    </div>
  );
}

// ─── Invoice drawer ───────────────────────────────────────────────────────────

interface InvoiceDrawerProps {
  order: Order | null;
  onClose: () => void;
}

function InvoiceDrawer({ order, onClose }: InvoiceDrawerProps) {
  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Invoice</DialogTitle>
          <DialogDescription>
            {order?.customerName} — {order && formatDate(order.deliveryDate)}
          </DialogDescription>
        </DialogHeader>
        {order && (
          <div className="mt-2">
            <InvoiceActions orderId={order.id} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminOrdersClient() {
  const [offset, setOffset] = useState(0);
  const [invoiceTarget, setInvoiceTarget] = useState<Order | null>(null);

  const {
    orders,
    isLoading,
    isError,
    error,
  } = useOrders({ limit: PAGE_SIZE, offset });

  const canPrev = offset > 0;
  const canNext = orders.length === PAGE_SIZE;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manage Orders"
        description="Update order statuses and manage invoice generation."
        backHref="/admin"
      />

      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error instanceof Error ? error.message : "Failed to load orders"}
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Total</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-36" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No orders yet</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="group">
                  <TableCell>
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-medium hover:text-forest transition-colors text-sm"
                    >
                      {order.customerName}
                    </Link>
                    <p className="text-xs text-muted-foreground sm:hidden">
                      {formatDate(order.deliveryDate)}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {formatDate(order.deliveryDate)}
                  </TableCell>
                  <TableCell>
                    <StatusSelector order={order} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm">
                    {formatIDR(order.totalPrice)}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge order={order} onManage={() => setInvoiceTarget(order)} />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
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
      {!isLoading && orders.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}–{offset + orders.length}
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

      {/* Invoice management dialog */}
      <InvoiceDrawer
        order={invoiceTarget}
        onClose={() => setInvoiceTarget(null)}
      />
    </div>
  );
}

// ─── Inline invoice status indicator ─────────────────────────────────────────

function InvoiceStatusBadge({
  order,
  onManage,
}: {
  order: Order;
  onManage: () => void;
}) {
  return (
    <button
      onClick={onManage}
      aria-label={order.invoiceSignedUrl ? `Manage invoice for ${order.customerName}` : `Generate invoice for ${order.customerName}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        order.invoiceSignedUrl
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
          : "bg-muted text-muted-foreground hover:bg-muted/70"
      )}
    >
      {order.invoiceSignedUrl ? "Invoice ready" : "No invoice"}
    </button>
  );
}
