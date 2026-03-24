import * as React from "react";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  variant?: "page" | "card" | "table" | "inline";
  rows?: number;
  className?: string;
};

export function LoadingState({
  variant = "page",
  rows = 4,
  className,
}: LoadingStateProps) {
  if (variant === "inline") {
    return (
      <div
        className={cn("flex items-center gap-2", className)}
        aria-label="Loading"
      >
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("space-y-3", className)} aria-label="Loading">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-2", className)} aria-label="Loading">
        <Skeleton className="h-10 w-full rounded-md" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-[52px] w-full rounded-md" />
        ))}
      </div>
    );
  }

  // page variant
  return (
    <div className={cn("space-y-8", className)} aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
