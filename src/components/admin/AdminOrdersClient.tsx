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
  Search,
  X,
  Edit2,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { STATUS_CONFIG } from "@/components/orders/OrderStatusBadge";
import { InvoiceActions } from "@/components/admin/InvoiceActions";
import {
  useOrders,
  useUpdateOrderStatus,
  useBulkUpdateOrderStatus,
  useUpdateOrder,
  useUpdateAirwaybill,
  type OrderListQueryParams,
} from "@/hooks/useOrders";
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

function StatusSelector({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const updateStatus = useUpdateOrderStatus();

  async function handleSelect(newStatus: OrderStatus) {
    if (newStatus === order.status) { setOpen(false); return; }
    try { await updateStatus.mutateAsync({ id: order.id, status: newStatus }); }
    catch { /* error shown below */ }
    finally { setOpen(false); }
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
        aria-label={`Status: ${order.status}. Click to change.`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {STATUS_CONFIG[order.status]?.label ?? order.status}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
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
                  <span className={cn(
                    "inline-block h-2 w-2 rounded-full shrink-0",
                    STATUS_CONFIG[s]?.className?.includes("amber") ? "bg-amber-400"
                    : STATUS_CONFIG[s]?.className?.includes("blue") ? "bg-blue-400"
                    : STATUS_CONFIG[s]?.className?.includes("indigo") ? "bg-indigo-400"
                    : STATUS_CONFIG[s]?.className?.includes("purple") ? "bg-purple-400"
                    : STATUS_CONFIG[s]?.className?.includes("emerald") ? "bg-emerald-400"
                    : "bg-red-400"
                  )} />
                  {STATUS_CONFIG[s]?.label ?? s}
                  {s === order.status && <Check className="h-3 w-3 ml-auto text-muted-foreground" />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {updateStatus.isError && (
        <p className="absolute left-0 top-full mt-1 text-xs text-red-500 whitespace-nowrap z-30">
          {updateStatus.error instanceof Error ? updateStatus.error.message : "Update failed"}
        </p>
      )}
    </div>
  );
}

// ─── Invoice drawer ───────────────────────────────────────────────────────────

function InvoiceDrawer({ order, onClose }: { order: Order | null; onClose: () => void }) {
  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Invoice</DialogTitle>
          <DialogDescription>
            {order?.customerName} — {order && formatDate(order.deliveryDate)}
          </DialogDescription>
        </DialogHeader>
        {order && <div className="mt-2"><InvoiceActions orderId={order.id} /></div>}
      </DialogContent>
    </Dialog>
  );
}

// ─── AWB edit modal ───────────────────────────────────────────────────────────

function AirwaybillModal({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const [awb, setAwb] = useState("");
  const [courier, setCourier] = useState("");
  const updateAirwaybill = useUpdateAirwaybill();

  // Sync fields when a new order is targeted
  if (order && awb === "" && courier === "" && (order.airwaybillNumber || order.courier)) {
    setAwb(order.airwaybillNumber ?? "");
    setCourier(order.courier ?? "");
  }

  async function handleSave() {
    if (!order) return;
    try {
      await updateAirwaybill.mutateAsync({
        id: order.id,
        airwaybill_number: awb.trim() || null,
        courier: courier.trim() || null,
      });
      onClose();
    } catch { /* error shown below */ }
  }

  function handleOpenChange(open: boolean) {
    if (!open) { setAwb(""); setCourier(""); updateAirwaybill.reset(); onClose(); }
  }

  return (
    <Dialog open={!!order} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Set Airwaybill</DialogTitle>
          <DialogDescription>
            {order?.customerName} — {order && formatDate(order.deliveryDate)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="awb-courier">Courier</Label>
            <Input
              id="awb-courier"
              placeholder="e.g. JNE, JT, TIKI"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="awb-number">Airwaybill Number</Label>
            <Input
              id="awb-number"
              placeholder="e.g. JNE001234567"
              value={awb}
              onChange={(e) => setAwb(e.target.value)}
            />
          </div>
          {updateAirwaybill.isError && (
            <p className="text-xs text-red-600">
              {updateAirwaybill.error instanceof Error
                ? updateAirwaybill.error.message
                : "Failed to update"}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={updateAirwaybill.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateAirwaybill.isPending}>
            {updateAirwaybill.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Order edit modal ─────────────────────────────────────────────────────────

type EditLine = {
  key: string; // temporary local key
  item_id?: string;
  bundle_id?: string;
  line_name: string;
  quantity: number;
  unit_price: number;
};

function OrderEditModal({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const updateOrder = useUpdateOrder();
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAmount, setDeliveryAmount] = useState(0);
  const [lines, setLines] = useState<EditLine[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize form when order changes
  if (order && !initialized) {
    setDeliveryDate(order.deliveryDate.slice(0, 10));
    setDeliveryAmount(order.deliveryAmount);
    setLines(
      order.items.map((item, i) => ({
        key: `${item.id}-${i}`,
        item_id: item.itemId ?? undefined,
        bundle_id: item.bundleId ?? undefined,
        line_name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      }))
    );
    setInitialized(true);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setInitialized(false);
      setLines([]);
      updateOrder.reset();
      onClose();
    }
  }

  function updateLine(key: string, patch: Partial<EditLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { key: `new-${Date.now()}`, line_name: "", quantity: 1, unit_price: 0 },
    ]);
  }

  async function handleSave() {
    if (!order) return;
    try {
      await updateOrder.mutateAsync({
        id: order.id,
        body: {
          delivery_date: deliveryDate,
          delivery_amount: deliveryAmount,
          items: lines.map(({ line_name, quantity, unit_price, item_id, bundle_id }) => ({
            item_id,
            bundle_id,
            line_name,
            quantity,
            unit_price,
          })),
        },
      });
      handleOpenChange(false);
    } catch { /* error shown below */ }
  }

  return (
    <Dialog open={!!order} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
          <DialogDescription>
            {order?.customerName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-delivery-date">Delivery Date</Label>
              <Input
                id="edit-delivery-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-delivery-amount">Delivery Fee (IDR)</Label>
              <Input
                id="edit-delivery-amount"
                type="number"
                min={0}
                value={deliveryAmount}
                onChange={(e) => setDeliveryAmount(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Order Lines</Label>
              <Button variant="outline" size="sm" onClick={addLine} type="button">
                + Add Line
              </Button>
            </div>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead className="w-20">Qty</TableHead>
                    <TableHead className="w-28">Unit Price</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.key}>
                      <TableCell className="py-1.5">
                        <Input
                          value={line.line_name}
                          onChange={(e) => updateLine(line.key, { line_name: e.target.value })}
                          placeholder="Item name"
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) })}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Input
                          type="number"
                          min={0}
                          value={line.unit_price}
                          onChange={(e) => updateLine(line.key, { unit_price: Number(e.target.value) })}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="py-1.5">
                        <button
                          onClick={() => removeLine(line.key)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          aria-label="Remove line"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {lines.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-4">
                        No items. Add at least one line.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {updateOrder.isError && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {updateOrder.error instanceof Error ? updateOrder.error.message : "Failed to update order"}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={updateOrder.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateOrder.isPending || lines.length === 0}>
            {updateOrder.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Inline invoice badge ─────────────────────────────────────────────────────

function InvoiceStatusBadge({ order, onManage }: { order: Order; onManage: () => void }) {
  return (
    <button
      onClick={onManage}
      aria-label={order.hasInvoice ? `Manage invoice for ${order.customerName}` : `Generate invoice for ${order.customerName}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        order.hasInvoice
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
          : "bg-muted text-muted-foreground hover:bg-muted/70"
      )}
    >
      {order.hasInvoice ? "Invoice ready" : "No invoice"}
    </button>
  );
}

// ─── Bulk status bar ──────────────────────────────────────────────────────────

function BulkStatusBar({
  count,
  onUpdate,
  onClear,
}: {
  count: number;
  onUpdate: (status: OrderStatus) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (count === 0) return null;

  async function handleSelect(status: OrderStatus) {
    setOpen(false);
    setPending(true);
    try { onUpdate(status); } finally { setPending(false); }
  }

  return (
    <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm">
      <span className="font-medium text-blue-800">{count} selected</span>
      <div className="relative ml-auto">
        <Button
          size="sm"
          variant="outline"
          className="gap-1 border-blue-300 text-blue-800 hover:bg-blue-100"
          onClick={() => setOpen((o) => !o)}
          disabled={pending}
        >
          Set Status
          <ChevronDown className="h-3 w-3" />
        </Button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <ul className="absolute right-0 top-full mt-1 z-20 min-w-[140px] rounded-md border bg-popover shadow-md py-1">
              {ALL_STATUSES.map((s) => (
                <li key={s}>
                  <button
                    onClick={() => handleSelect(s)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                  >
                    {STATUS_CONFIG[s]?.label ?? s}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <button
        onClick={onClear}
        className="text-blue-600 hover:text-blue-800"
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminOrdersClient() {
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<OrderListQueryParams>({});
  const [searchInput, setSearchInput] = useState("");
  const [invoiceTarget, setInvoiceTarget] = useState<Order | null>(null);
  const [awbTarget, setAwbTarget] = useState<Order | null>(null);
  const [editTarget, setEditTarget] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const bulkUpdate = useBulkUpdateOrderStatus();

  const queryParams: OrderListQueryParams = { limit: PAGE_SIZE, offset, ...filters };
  const { orders, total, isLoading, isError, error } = useOrders(queryParams);

  const canPrev = offset > 0;
  const canNext = orders.length === PAGE_SIZE;

  function applySearch() {
    setOffset(0);
    setSelectedIds(new Set());
    setFilters((f) => ({
      ...f,
      search: searchInput.trim() || undefined,
    }));
  }

  function clearSearch() {
    setSearchInput("");
    setOffset(0);
    setSelectedIds(new Set());
    setFilters((f) => ({ ...f, search: undefined }));
  }

  function setFilter(key: keyof OrderListQueryParams, value: string | undefined) {
    setOffset(0);
    setSelectedIds(new Set());
    setFilters((f) => ({ ...f, [key]: value || undefined }));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  }

  async function handleBulkUpdate(status: OrderStatus) {
    if (selectedIds.size === 0) return;
    await bulkUpdate.mutateAsync({ ids: Array.from(selectedIds), status });
    setSelectedIds(new Set());
  }

  const hasActiveFilters = !!(filters.search || filters.status || filters.delivery_date_from || filters.delivery_date_to);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manage Orders"
        description="Update order statuses and manage invoice generation."
        backHref="/admin"
      />

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex gap-1.5">
          <Input
            placeholder="Search customer or phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            className="h-8 w-52 text-sm"
          />
          <Button size="sm" variant="outline" className="h-8 px-2" onClick={applySearch}>
            <Search className="h-3.5 w-3.5" />
          </Button>
          {filters.search && (
            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={clearSearch}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Status filter */}
        <select
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          value={filters.status ?? ""}
          onChange={(e) => setFilter("status", e.target.value || undefined)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_CONFIG[s]?.label ?? s}
            </option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            className="h-8 w-36 text-sm"
            value={filters.delivery_date_from ?? ""}
            onChange={(e) => setFilter("delivery_date_from", e.target.value)}
            aria-label="Delivery date from"
          />
          <span className="text-xs text-muted-foreground">–</span>
          <Input
            type="date"
            className="h-8 w-36 text-sm"
            value={filters.delivery_date_to ?? ""}
            onChange={(e) => setFilter("delivery_date_to", e.target.value)}
            aria-label="Delivery date to"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-muted-foreground"
            onClick={() => {
              setFilters({});
              setSearchInput("");
              setOffset(0);
              setSelectedIds(new Set());
            }}
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {/* ── Bulk action bar ── */}
      <BulkStatusBar
        count={selectedIds.size}
        onUpdate={handleBulkUpdate}
        onClear={() => setSelectedIds(new Set())}
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
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={orders.length > 0 && selectedIds.size === orders.length}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                  className="rounded border-input"
                />
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Total</TableHead>
              <TableHead className="hidden md:table-cell">AWB</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      {hasActiveFilters ? "No orders match your filters" : "No orders yet"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className={cn("group", selectedIds.has(order.id) && "bg-blue-50/40")}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      aria-label={`Select ${order.customerName}`}
                      className="rounded border-input"
                    />
                  </TableCell>
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
                  <TableCell className="hidden md:table-cell">
                    {order.airwaybillNumber ? (
                      <span className="text-xs text-muted-foreground font-mono">
                        {order.courier ? `${order.courier} · ` : ""}
                        {order.airwaybillNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge order={order} onManage={() => setInvoiceTarget(order)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => setEditTarget(order)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Edit order"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setAwbTarget(order)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Set airwaybill"
                      >
                        <Truck className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
            {total > 0 && ` of ${total}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrev}
              onClick={() => { setOffset(Math.max(0, offset - PAGE_SIZE)); setSelectedIds(new Set()); }}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext}
              onClick={() => { setOffset(offset + PAGE_SIZE); setSelectedIds(new Set()); }}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <InvoiceDrawer order={invoiceTarget} onClose={() => setInvoiceTarget(null)} />
      <AirwaybillModal order={awbTarget} onClose={() => setAwbTarget(null)} />
      <OrderEditModal order={editTarget} onClose={() => setEditTarget(null)} />
    </div>
  );
}
