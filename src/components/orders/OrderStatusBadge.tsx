import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800" },
  packed: { label: "Packed", className: "bg-indigo-100 text-indigo-800" },
  shipped: { label: "Shipped", className: "bg-purple-100 text-purple-800" },
  done: { label: "Done", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800" },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
