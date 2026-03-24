"use client";

import { cn } from "@/lib/utils";

const LOW_STOCK_THRESHOLD = 5;

type StockLevel = "healthy" | "low" | "out";

function getStockLevel(available: number): StockLevel {
  if (available <= 0) return "out";
  if (available <= LOW_STOCK_THRESHOLD) return "low";
  return "healthy";
}

interface StockBadgeProps {
  available: number;
  className?: string;
}

export function StockBadge({ available, className }: StockBadgeProps) {
  const level = getStockLevel(available);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        level === "healthy" && "bg-emerald-100 text-emerald-800",
        level === "low" && "bg-amber-100 text-amber-800",
        level === "out" && "bg-red-100 text-red-800",
        className
      )}
    >
      {level === "out" ? "Out of stock" : level === "low" ? "Low stock" : "In stock"}
    </span>
  );
}

interface StockBreakdownProps {
  stock: number;
  reservedStock: number;
  availableStock: number;
  unit: string;
  className?: string;
}

export function StockBreakdown({
  stock,
  reservedStock,
  availableStock,
  unit,
  className,
}: StockBreakdownProps) {
  const pct = stock > 0 ? Math.max(0, availableStock / stock) : 0;
  const level = getStockLevel(availableStock);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="text-center">
          <p className="text-2xl font-semibold tabular-nums">{stock}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total stock</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold tabular-nums text-amber-600">{reservedStock}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Reserved</p>
        </div>
        <div className="text-center">
          <p
            className={cn(
              "text-2xl font-semibold tabular-nums",
              level === "healthy" && "text-emerald-600",
              level === "low" && "text-amber-600",
              level === "out" && "text-red-600"
            )}
          >
            {availableStock}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Available</p>
        </div>
      </div>

      {/* Available stock progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Available capacity</span>
          <span>
            {availableStock} / {stock} {unit}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              level === "healthy" && "bg-emerald-500",
              level === "low" && "bg-amber-500",
              level === "out" && "bg-red-500"
            )}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export { LOW_STOCK_THRESHOLD, getStockLevel };
