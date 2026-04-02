"use client";

import React, { useState, useMemo } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Star,
  PackageCheck,
  Sparkles,
  TriangleAlert,
  ChevronDown,
  Check,
  RefreshCw,
  SquareCheck,
  Square,
  ListChecks,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import {
  useRecommendations,
  useSaveBatch,
  useBatches,
  useBatch,
  useUpdateBatchStatus,
  type RecommendationQueryParams,
} from "@/hooks/useFulfillment";
import { useOrders } from "@/hooks/useOrders";
import type {
  BatchStatus,
  BatchComplexity,
  BatchRecommendation,
  FulfillmentBatch,
  AggregatedPickItem,
  CreateBatchPayload,
  Order,
  OrderStatus,
} from "@/types";

const PAGE_SIZE = 20;

// ─── Status badge ──────────────────────────────────────────────────────────────

const BATCH_STATUS_CONFIG: Record<
  BatchStatus,
  { label: string; class: string }
> = {
  draft: { label: "Draft", class: "bg-gray-100 text-gray-700" },
  in_progress: { label: "In Progress", class: "bg-blue-100 text-blue-800" },
  completed: { label: "Completed", class: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Cancelled", class: "bg-red-100 text-red-700" },
};

function BatchStatusBadge({ status }: { status: BatchStatus }) {
  const cfg = BATCH_STATUS_CONFIG[status] ?? BATCH_STATUS_CONFIG.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.class
      )}
    >
      {cfg.label}
    </span>
  );
}

// ─── Complexity badge ──────────────────────────────────────────────────────────

const COMPLEXITY_CONFIG: Record<
  BatchComplexity,
  { label: string; class: string }
> = {
  light: { label: "Light", class: "bg-green-100 text-green-700" },
  medium: { label: "Medium", class: "bg-amber-100 text-amber-800" },
  heavy: { label: "Heavy", class: "bg-red-100 text-red-700" },
};

function ComplexityBadge({ level }: { level: BatchComplexity }) {
  const cfg = COMPLEXITY_CONFIG[level] ?? COMPLEXITY_CONFIG.medium;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.class
      )}
    >
      {cfg.label}
    </span>
  );
}

// ─── Score pill ────────────────────────────────────────────────────────────────

function ScorePill({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 80
      ? "bg-emerald-500"
      : pct >= 60
      ? "bg-amber-400"
      : "bg-gray-300";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-gray-100 overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground">
        {pct.toFixed(0)}
      </span>
    </div>
  );
}

// ─── Pick list table ───────────────────────────────────────────────────────────

function PickListTable({ items }: { items: AggregatedPickItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">No items to pick.</p>
    );
  }
  return (
    <div className="rounded-md border text-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Item</TableHead>
            <TableHead className="text-xs text-right">Qty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.itemId}>
              <TableCell className="py-1.5 text-xs">{item.itemName}</TableCell>
              <TableCell className="py-1.5 text-xs text-right font-mono">
                {item.requiredQuantity}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Recommendation card ───────────────────────────────────────────────────────

interface RecommendationCardProps {
  rec: BatchRecommendation;
  onSave: (payload: CreateBatchPayload) => void;
  isSaving: boolean;
}

function RecommendationCard({ rec, onSave, isSaving }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);

  function handleSave() {
    onSave({
      order_ids: rec.orders.map((o) => o.id),
      recommendation: rec,
    });
  }

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              {formatDate(rec.deliveryDate)}
              <ComplexityBadge level={rec.complexityLevel} />
            </CardTitle>
            <CardDescription className="text-xs">
              {rec.totalOrders} order{rec.totalOrders !== 1 ? "s" : ""} &middot;{" "}
              {rec.totalUnits} unit{rec.totalUnits !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="shrink-0 text-right space-y-1">
            <ScorePill score={rec.recommendationScore} />
            <p className="text-xs text-muted-foreground">overlap score</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Rationale */}
        <p className="text-sm text-muted-foreground">{rec.rationaleSummary}</p>

        {/* Warnings */}
        {rec.warnings.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 space-y-0.5">
            {rec.warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                <TriangleAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {w}
              </p>
            ))}
          </div>
        )}

        {/* Orders */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Orders
          </p>
          <div className="space-y-1">
            {rec.orders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between text-sm rounded-md px-2 py-1 bg-muted/40"
              >
                <span className="font-medium">{o.customerName}</span>
                <span className="text-xs text-muted-foreground">{o.phone}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pick list toggle */}
        <div>
          <button
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setExpanded((e) => !e)}
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
            />
            Pick list ({rec.aggregatedItems.length} SKUs)
          </button>
          {expanded && (
            <div className="mt-2">
              <PickListTable items={rec.aggregatedItems} />
            </div>
          )}
        </div>

        <Button
          size="sm"
          className="w-full"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <PackageCheck className="h-3.5 w-3.5 mr-2" />
              Save as Batch
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Recommendations tab ───────────────────────────────────────────────────────

function RecommendationsTab() {
  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date(Date.now() + 30 * 86400 * 1000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(nextMonth);
  const [includePending, setIncludePending] = useState(true);
  const [maxBatchSize, setMaxBatchSize] = useState<number>(10);
  const [enabled, setEnabled] = useState(false);

  const params: RecommendationQueryParams = {
    from,
    to,
    includePending,
    maxBatchSize,
  };

  const { data, isLoading, isError, error } = useRecommendations(params, enabled);
  const saveBatch = useSaveBatch();

  function handleGenerate() {
    setEnabled(true);
  }

  function handleSave(payload: CreateBatchPayload) {
    saveBatch.mutate(payload);
  }

  return (
    <div className="space-y-6">
      {/* Filter controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Generation Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setEnabled(false); }}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setEnabled(false); }}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Max batch size</label>
              <input
                type="number"
                min={2}
                max={50}
                value={maxBatchSize}
                onChange={(e) => { setMaxBatchSize(Number(e.target.value)); setEnabled(false); }}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includePending}
                  onChange={(e) => { setIncludePending(e.target.checked); setEnabled(false); }}
                  className="rounded"
                />
                Include pending
              </label>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Recommendations
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error instanceof Error ? error.message : "Failed to generate recommendations"}
        </div>
      )}

      {saveBatch.isError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {saveBatch.error instanceof Error
            ? saveBatch.error.message
            : "Failed to save batch"}
        </div>
      )}

      {saveBatch.isSuccess && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check className="h-4 w-4 shrink-0" />
          Batch saved successfully.
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28 mt-1" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && data && data.total === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <ClipboardList className="h-8 w-8 opacity-40" />
          <p className="text-sm">No recommendations found for the selected date range.</p>
        </div>
      )}

      {!isLoading && data && data.data.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {data.total} batch recommendation{data.total !== 1 ? "s" : ""} generated
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.data.map((rec) => (
              <RecommendationCard
                key={rec.batchKey}
                rec={rec}
                onSave={handleSave}
                isSaving={saveBatch.isPending}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Batch status selector ─────────────────────────────────────────────────────

const NEXT_STATUSES: Record<BatchStatus, BatchStatus[]> = {
  draft: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function BatchStatusSelector({ batch }: { batch: FulfillmentBatch }) {
  const [open, setOpen] = useState(false);
  const updateStatus = useUpdateBatchStatus();

  const transitions = NEXT_STATUSES[batch.status] ?? [];

  if (transitions.length === 0) {
    return <BatchStatusBadge status={batch.status} />;
  }

  async function handleSelect(newStatus: BatchStatus) {
    try {
      await updateStatus.mutateAsync({ id: batch.id, payload: { status: newStatus } });
    } catch {
      // error surfaced at higher level
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
          BATCH_STATUS_CONFIG[batch.status].class,
          updateStatus.isPending && "opacity-50"
        )}
      >
        {BATCH_STATUS_CONFIG[batch.status].label}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute left-0 top-7 z-20 min-w-[140px] rounded-md border bg-popover shadow-md">
          {transitions.map((s) => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted text-left"
            >
              {s === batch.status && <Check className="h-3 w-3 shrink-0" />}
              {BATCH_STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Batch detail panel ────────────────────────────────────────────────────────

function BatchDetailPanel({ batchId }: { batchId: string }) {
  const { data: batch, isLoading, isError } = useBatch(batchId);

  if (isLoading) {
    return (
      <div className="space-y-3 px-1">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !batch) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        Failed to load batch details
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold">{batch.name}</h3>
          <p className="text-xs text-muted-foreground">
            {formatDate(batch.batchDate)} &middot; {batch.totalOrders} orders &middot;{" "}
            {batch.totalUnits} units
          </p>
        </div>
        <BatchStatusSelector batch={batch} />
      </div>

      {/* Rationale */}
      {batch.rationaleSummary && (
        <p className="text-sm text-muted-foreground">{batch.rationaleSummary}</p>
      )}

      {/* Score */}
      <div className="flex items-center gap-3">
        <Star className="h-4 w-4 text-amber-500" />
        <ScorePill score={batch.recommendationScore} />
        <span className="text-xs text-muted-foreground">overlap score</span>
      </div>

      {/* Orders */}
      {batch.orders.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Orders ({batch.orders.length})
          </p>
          <div className="rounded-md border text-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Phone</TableHead>
                  <TableHead className="text-xs">Delivery</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.orders.map((bo) =>
                  bo.order ? (
                    <TableRow key={bo.id}>
                      <TableCell className="py-1.5 text-xs font-medium">
                        {bo.order.customerName}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-muted-foreground">
                        {bo.order.phone}
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-muted-foreground">
                        {formatDate(bo.order.deliveryDate)}
                      </TableCell>
                    </TableRow>
                  ) : null
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pick list */}
      {batch.items.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Pick List ({batch.items.length} SKUs)
          </p>
          <PickListTable
            items={batch.items.map((i) => ({
              itemId: i.itemId,
              itemName: i.itemName,
              requiredQuantity: i.requiredQuantity,
            }))}
          />
        </div>
      )}
    </div>
  );
}

// ─── Batches tab ───────────────────────────────────────────────────────────────

function BatchesTab() {
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useBatches({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const batches = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;

  return (
    <div className="space-y-4">
      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error instanceof Error ? error.message : "Failed to load batches"}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Batch list */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : batches.length === 0
                ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No batches saved yet
                      </TableCell>
                    </TableRow>
                  )
                : batches.map((batch) => (
                    <TableRow
                      key={batch.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedId === batch.id && "bg-muted"
                      )}
                      onClick={() =>
                        setSelectedId((cur) => (cur === batch.id ? null : batch.id))
                      }
                    >
                      <TableCell className="font-medium text-sm">
                        {batch.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(batch.batchDate)}
                      </TableCell>
                      <TableCell className="text-sm">{batch.totalOrders}</TableCell>
                      <TableCell className="text-sm">{batch.totalUnits}</TableCell>
                      <TableCell>
                        <ScorePill score={batch.recommendationScore} />
                      </TableCell>
                      <TableCell>
                        <BatchStatusBadge status={batch.status} />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>

        {/* Detail panel */}
        {selectedId && (
          <div className="rounded-md border p-4">
            <BatchDetailPanel batchId={selectedId} />
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total === 0
            ? "No results"
            : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}`}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Custom batch tab ──────────────────────────────────────────────────────────

const CUSTOM_ORDER_STATUSES: { value: OrderStatus | "all"; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "all", label: "All statuses" },
];

function CustomBatchTab() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("confirmed");
  // Map of orderId → Order for all checked rows (persists across pages)
  const [selected, setSelected] = useState<Map<string, Order>>(new Map());
  const [batchName, setBatchName] = useState("");

  const saveBatch = useSaveBatch();

  const { orders, total, isLoading, isError, error } = useOrders({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const hasNext = (page + 1) * PAGE_SIZE < total;

  function toggle(order: Order) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(order.id)) next.delete(order.id);
      else next.set(order.id, order);
      return next;
    });
  }

  function togglePage() {
    const allOnPage = orders.every((o) => selected.has(o.id));
    setSelected((prev) => {
      const next = new Map(prev);
      if (allOnPage) {
        orders.forEach((o) => next.delete(o.id));
      } else {
        orders.forEach((o) => next.set(o.id, o));
      }
      return next;
    });
  }

  function handleCreate() {
    saveBatch.mutate({
      name: batchName.trim() || undefined,
      order_ids: Array.from(selected.keys()),
    });
  }

  const allOnPageSelected = orders.length > 0 && orders.every((o) => selected.has(o.id));
  const someOnPageSelected = orders.some((o) => selected.has(o.id));
  const selectedList = Array.from(selected.values());

  // Compute pick list preview from selected orders' line items.
  // Bundle lines are kept as-is (name + qty) since expansion needs the backend.
  const previewPickList = useMemo(() => {
    const agg = new Map<string, { name: string; qty: number; isBundle: boolean }>();
    for (const order of selectedList) {
      for (const item of order.items) {
        const key = item.itemId ?? `b:${item.bundleId ?? item.name}`;
        const existing = agg.get(key);
        if (existing) {
          existing.qty += item.quantity;
        } else {
          agg.set(key, {
            name: item.name || (item.bundleId ? `Bundle ${item.bundleId.slice(0, 8)}` : "—"),
            qty: item.quantity,
            isBundle: !!item.bundleId && !item.itemId,
          });
        }
      }
    }
    return Array.from(agg.values()).sort((a, b) => b.qty - a.qty);
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasBundleLines = previewPickList.some((p) => p.isBundle);
  const [pickExpanded, setPickExpanded] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* ── Left: order picker ── */}
      <div className="space-y-4">
        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {CUSTOM_ORDER_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(s.value); setPage(0); }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === s.value
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {isError && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error instanceof Error ? error.message : "Failed to load orders"}
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <button
                    aria-label="Toggle page selection"
                    onClick={togglePage}
                    disabled={isLoading || orders.length === 0}
                    className="flex items-center justify-center"
                  >
                    {allOnPageSelected ? (
                      <SquareCheck className="h-4 w-4 text-foreground" />
                    ) : someOnPageSelected ? (
                      <SquareCheck className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : orders.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        No orders found
                      </TableCell>
                    </TableRow>
                  )
                : orders.map((order) => {
                    const isChecked = selected.has(order.id);
                    return (
                      <TableRow
                        key={order.id}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isChecked ? "bg-muted/60" : "hover:bg-muted/30"
                        )}
                        onClick={() => toggle(order)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <button
                            aria-label={isChecked ? "Deselect order" : "Select order"}
                            onClick={() => toggle(order)}
                            className="flex items-center justify-center"
                          >
                            {isChecked ? (
                              <SquareCheck className="h-4 w-4 text-foreground" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{order.customerName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{order.phone}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(order.deliveryDate)}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground capitalize">
                            {order.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total === 0
              ? "No results"
              : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}`}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Right: selection summary + create ── */}
      <div className="space-y-4">
        <Card className="sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Selected ({selected.size})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected.size === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No orders selected. Click rows in the table to add them.
              </p>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {selectedList.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 bg-muted/40 text-xs"
                  >
                    <span className="font-medium truncate max-w-[150px]">{o.customerName}</span>
                    <button
                      onClick={() => toggle(o)}
                      className="ml-2 text-muted-foreground hover:text-red-500 shrink-0"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pick list preview */}
            {previewPickList.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <button
                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                  onClick={() => setPickExpanded((e) => !e)}
                >
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", pickExpanded && "rotate-180")}
                  />
                  Pick List Preview ({previewPickList.length} line{previewPickList.length !== 1 ? "s" : ""})
                </button>

                {pickExpanded && (
                  <div className="space-y-2">
                    {hasBundleLines && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                        Bundle lines shown as-is. Final pick list (with items expanded) is computed on save.
                      </p>
                    )}
                    <div className="rounded-md border text-xs">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs py-2">Item / Bundle</TableHead>
                            <TableHead className="text-xs py-2 text-right">Qty</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewPickList.map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="py-1.5 text-xs flex items-center gap-1.5">
                                {row.isBundle && (
                                  <span className="inline-flex shrink-0 rounded bg-amber-100 text-amber-700 px-1 text-[10px] font-medium">
                                    bundle
                                  </span>
                                )}
                                {row.name}
                              </TableCell>
                              <TableCell className="py-1.5 text-xs text-right font-mono">
                                {row.qty}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Batch name (optional)
              </label>              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g. Morning run 3 Apr"
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {saveBatch.isError && (
              <p className="text-xs text-red-600">
                {saveBatch.error instanceof Error
                  ? saveBatch.error.message
                  : "Failed to create batch"}
              </p>
            )}

            {saveBatch.isSuccess && (
              <p className="text-xs text-emerald-600 font-medium">Batch created successfully.</p>
            )}

            <Button
              className="w-full"
              size="sm"
              disabled={selected.size === 0 || saveBatch.isPending}
              onClick={handleCreate}
            >
              {saveBatch.isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <PackageCheck className="h-3.5 w-3.5 mr-2" />
                  Create Batch ({selected.size})
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Simple tabs primitive ─────────────────────────────────────────────────────

interface SimpleTab {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface SimpleTabsProps {
  tabs: SimpleTab[];
  defaultTab: string;
  children: (activeTab: string) => React.ReactNode;
}

function SimpleTabs({ tabs, defaultTab, children }: SimpleTabsProps) {
  const [active, setActive] = useState(defaultTab);
  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              active === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      {children(active)}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function AdminFulfillmentClient() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Smart Fulfillment"
        description="Generate batch recommendations using item overlap analysis and manage saved batches."
      />

      <SimpleTabs
        tabs={[
          { key: "recommendations", label: "Recommendations", icon: <Sparkles className="h-4 w-4" /> },
          { key: "custom", label: "Custom Batch", icon: <ListChecks className="h-4 w-4" /> },
          { key: "batches", label: "Saved Batches", icon: <ClipboardList className="h-4 w-4" /> },
        ]}
        defaultTab="recommendations"
      >
        {(active) => (
          <>
            {active === "recommendations" && <RecommendationsTab />}
            {active === "custom" && <CustomBatchTab />}
            {active === "batches" && <BatchesTab />}
          </>
        )}
      </SimpleTabs>
    </div>
  );
}
