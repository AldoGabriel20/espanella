"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  XCircle,
  Package,
  Boxes,
  FileText,
  User,
  Phone,
  CalendarDays,
  Truck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useOrderById, useCancelOrder } from "@/hooks/useOrders";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { formatIDR } from "@/lib/utils/currency";

const CEKRESI_BASE = "https://cekresi.com/?noresi=";

interface OrderDetailClientProps {
  id: string;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-24" />
    </div>
  );
}

export function OrderDetailClient({ id }: OrderDetailClientProps) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const { data: order, isLoading, isError, error } = useOrderById(id);
  const cancelOrder = useCancelOrder();

  const canCancel =
    (order?.status === "pending" || order?.status === "confirmed") &&
    !order?.lockedByBatch;

  async function handleCancel() {
    try {
      await cancelOrder.mutateAsync(id);
      setCancelOpen(false);
      router.refresh();
    } catch {
      // error shown via cancelOrder.error
    }
  }

  async function handleViewInvoice() {
    setInvoiceLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}/invoice`);
      if (res.ok) {
        const data = await res.json();
        // BFF returns adapted Invoice shape { orderId, invoiceUrl }
        const url = data.invoiceUrl ?? data.invoice_url;
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setInvoiceLoading(false);
    }
  }

  if (isLoading) return <DetailSkeleton />;

  if (isError || !order) {
    return (
      <div className="space-y-4">
        <Link href="/orders">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error instanceof Error ? error.message : "Order not found"}
        </div>
      </div>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link href="/orders">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {order.customerName}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Created {formatDateTime(order.createdAt)}
          </p>
        </div>
        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Cancel Order
          </Button>
        )}
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Customer Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{order.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{order.phone}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Delivery Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{formatDate(order.deliveryDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Delivery: {formatIDR(order.deliveryAmount)}</span>
            </div>
            {/* Airwaybill tracking */}
            {order.airwaybillNumber && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  {order.courier ? `${order.courier} — ` : ""}
                </span>
                <a
                  href={`${CEKRESI_BASE}${encodeURIComponent(order.airwaybillNumber)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {order.airwaybillNumber} ↗
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice */}
      {order.hasInvoice && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-emerald-800">
              <FileText className="h-4 w-4 shrink-0" />
              Invoice is available for this order
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-100 shrink-0"
              onClick={handleViewInvoice}
              disabled={invoiceLoading}
            >
              {invoiceLoading ? "Loading…" : "View Invoice"}
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Line items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Lines</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Item</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{line.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {line.bundleId ? (
                        <>
                          <Boxes className="h-3 w-3" />
                          Bundle
                        </>
                      ) : (
                        <>
                          <Package className="h-3 w-3" />
                          Item
                        </>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                  <TableCell className="hidden sm:table-cell text-right tabular-nums text-sm">
                    {formatIDR(line.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatIDR(line.totalPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Price summary */}
      <Card>
        <CardContent className="pt-5">
          <dl className="space-y-2">
            <div className="flex justify-between text-sm">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatIDR(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="tabular-nums">{formatIDR(order.deliveryAmount)}</dd>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-semibold">
              <dt>Grand Total</dt>
              <dd className="tabular-nums">{formatIDR(order.totalPrice)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Cancel confirmation dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>
              This will cancel the order for{" "}
              <span className="font-medium">{order.customerName}</span> and restore any
              reserved stock. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {cancelOrder.isError && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {cancelOrder.error instanceof Error
                ? cancelOrder.error.message
                : "Failed to cancel order"}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={cancelOrder.isPending}>
                Keep Order
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelOrder.isPending}
            >
              {cancelOrder.isPending ? "Cancelling…" : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

