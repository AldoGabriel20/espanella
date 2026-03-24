"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  TrendingDown,
  X,
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
import { PageHeader } from "@/components/ui/page-header";
import { useStockMovements, useItemStockMovements } from "@/hooks/useStockMovements";
import { useItems } from "@/hooks/useItems";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { StockMovement } from "@/types";

const PAGE_SIZE = 30;

// ─── Delta badge ──────────────────────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number }) {
  const isPositive = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums font-medium",
        isPositive ? "text-emerald-600" : "text-red-600"
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5 shrink-0" />
      )}
      {isPositive ? "+" : ""}
      {delta}
    </span>
  );
}

// ─── Movement table ───────────────────────────────────────────────────────────

interface MovementTableProps {
  movements: StockMovement[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  itemNameMap: Map<string, string>;
  showItemColumn: boolean;
}

function MovementTable({
  movements,
  isLoading,
  isError,
  error,
  itemNameMap,
  showItemColumn,
}: MovementTableProps) {
  if (isError) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error instanceof Error ? error.message : "Failed to load stock movements"}
      </div>
    );
  }

  const colSpan = showItemColumn ? 6 : 5;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {showItemColumn && <TableHead>Item</TableHead>}
            <TableHead>Delta</TableHead>
            <TableHead className="hidden sm:table-cell">Reason</TableHead>
            <TableHead className="hidden md:table-cell">Order</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                {showItemColumn && (
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                )}
                <TableCell>
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
              </TableRow>
            ))
          ) : movements?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-32 text-center">
                <div className="flex flex-col items-center gap-2">
                  <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No stock movements recorded
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            movements?.map((m) => (
              <TableRow key={m.id}>
                {showItemColumn && (
                  <TableCell className="font-medium text-sm">
                    {itemNameMap.get(m.itemId) ?? (
                      <span className="font-mono text-xs text-muted-foreground">
                        {m.itemId.slice(0, 8)}…
                      </span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <DeltaBadge delta={m.delta} />
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground capitalize">
                  {m.reason}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {m.orderId ? (
                    <Link
                      href={`/orders/${m.orderId}`}
                      className="font-mono text-xs text-muted-foreground hover:text-forest transition-colors"
                    >
                      {m.orderId.slice(0, 8)}…
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDateTime(m.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Item drill-down panel ────────────────────────────────────────────────────

interface ItemDrillDownProps {
  itemId: string;
  itemName: string;
  onClear: () => void;
}

function ItemDrillDown({ itemId, itemName, onClear }: ItemDrillDownProps) {
  const [offset, setOffset] = useState(0);
  const { movements, isLoading, isError, error } = useItemStockMovements(itemId, {
    limit: PAGE_SIZE,
    offset,
  });

  const canPrev = offset > 0;
  const canNext = movements.length === PAGE_SIZE;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold">{itemName}</h2>
          <p className="text-xs text-muted-foreground">Item-specific stock movements</p>
        </div>
        <Button variant="outline" size="sm" onClick={onClear} className="gap-1.5">
          <X className="h-3.5 w-3.5" />
          Back to all movements
        </Button>
      </div>

      <MovementTable
        movements={movements}
        isLoading={isLoading}
        isError={isError}
        error={error}
        itemNameMap={new Map([[itemId, itemName]])}
        showItemColumn={false}
      />

      {!isLoading && movements.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}–{offset + movements.length}
          </p>
          <div className="flex gap-2">
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

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminStockClient() {
  const [offset, setOffset] = useState(0);
  const [drillItemId, setDrillItemId] = useState<string | null>(null);

  // Global movements
  const {
    movements,
    isLoading,
    isError,
    error,
  } = useStockMovements({ limit: PAGE_SIZE, offset });

  // Item catalog for name resolution
  const { items } = useItems({ limit: 200 });
  const itemNameMap = new Map(items.map((it) => [it.id, it.name]));

  const canPrev = offset > 0;
  const canNext = movements.length === PAGE_SIZE;

  const drillItem = drillItemId ? items.find((it) => it.id === drillItemId) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Audit"
        description="Review all stock movements across the catalog."
        backHref="/admin"
      />

      {/* Item filter pills for drill-down */}
      {!drillItemId && items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <p className="text-xs text-muted-foreground self-center mr-1">Drill down by item:</p>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => { setOffset(0); setDrillItemId(item.id); }}
              className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-forest hover:text-forest transition-colors"
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      {drillItemId && drillItem ? (
        <ItemDrillDown
          itemId={drillItemId}
          itemName={drillItem.name}
          onClear={() => setDrillItemId(null)}
        />
      ) : (
        <>
          <MovementTable
            movements={movements}
            isLoading={isLoading}
            isError={isError}
            error={error}
            itemNameMap={itemNameMap}
            showItemColumn
          />

          {!isLoading && movements.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1}–{offset + movements.length}
              </p>
              <div className="flex gap-2">
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
        </>
      )}
    </div>
  );
}
