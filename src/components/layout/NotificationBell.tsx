"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { AdminSummary } from "@/types";

async function fetchSummary(): Promise<AdminSummary> {
  const res = await fetch("/api/admin/summary");
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

/**
 * NotificationBell polls /api/admin/summary every 30 seconds and shows a
 * red badge with the count of pending orders.
 */
export function NotificationBell() {
  const { data } = useQuery<AdminSummary>({
    queryKey: ["admin", "summary", "bell"],
    queryFn: fetchSummary,
    refetchInterval: 30_000, // poll every 30 s
    staleTime: 0,
  });

  const pendingOrders = data?.pendingOrders ?? 0;

  // Play a subtle notification sound when the count increases.
  const prevCountRef = useRef<number>(pendingOrders);
  useEffect(() => {
    if (pendingOrders > prevCountRef.current) {
      // Browser notification if permission granted
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Order Baru Masuk", {
          body: `Ada ${pendingOrders} order pending menunggu konfirmasi.`,
        });
      }
    }
    prevCountRef.current = pendingOrders;
  }, [pendingOrders]);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Notifications${pendingOrders > 0 ? ` (${pendingOrders} pending)` : ""}`}
      className="relative text-muted-foreground hover:text-foreground"
      asChild
    >
      <Link href="/admin/notifications">
        <Bell className="h-4.5 w-4.5" />
        {pendingOrders > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white leading-none">
            {pendingOrders > 99 ? "99+" : pendingOrders}
          </span>
        )}
      </Link>
    </Button>
  );
}
