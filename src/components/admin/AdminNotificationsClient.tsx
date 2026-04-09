"use client";

import { useState } from "react";
import {
  Bell,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  SkipForward,
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
import { useNotifications, useSendTestNotification } from "@/hooks/useNotifications";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { NotificationLog, NotificationStatus } from "@/types";

const PAGE_SIZE = 25;

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  NotificationStatus,
  { label: string; class: string; icon: React.ElementType }
> = {
  sent: {
    label: "Sent",
    class: "bg-[#6A4636]/10 text-[#6A4636]",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    class: "bg-red-100 text-red-800",
    icon: XCircle,
  },
  pending: {
    label: "Pending",
    class: "bg-amber-100 text-amber-800",
    icon: Clock,
  },
  skipped: {
    label: "Skipped",
    class: "bg-gray-100 text-gray-600",
    icon: SkipForward,
  },
};

function StatusBadge({ status }: { status: NotificationStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        cfg.class
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {cfg.label}
    </span>
  );
}

// ─── Notification table ───────────────────────────────────────────────────────

interface NotificationTableProps {
  logs: NotificationLog[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}

function NotificationTable({ logs, isLoading, isError, error }: NotificationTableProps) {
  if (isError) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error instanceof Error ? error.message : "Failed to load notification logs"}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Scheduled</TableHead>
            <TableHead>Sent At</TableHead>
            <TableHead>Provider</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : logs?.length === 0
            ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    No notification logs yet
                  </TableCell>
                </TableRow>
              )
            : logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium text-sm capitalize">
                    {log.notificationType.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-sm capitalize">{log.channel}</TableCell>
                  <TableCell className="text-sm font-mono text-xs">{log.recipient}</TableCell>
                  <TableCell>
                    <StatusBadge status={log.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(log.scheduledFor)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.sentAt ? formatDateTime(log.sentAt) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.providerName ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminNotificationsClient() {
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error } = useNotifications({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const sendTest = useSendTestNotification();

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Logs"
        description="History of all delivery reminders and low-stock alerts"
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => sendTest.mutate()}
            disabled={sendTest.isPending}
          >
            <Bell className="mr-2 h-4 w-4" />
            {sendTest.isPending ? "Sending…" : "Send Test"}
          </Button>
        }
      />

      {sendTest.isError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {sendTest.error instanceof Error
            ? sendTest.error.message
            : "Failed to send test notification"}
        </div>
      )}

      {sendTest.isSuccess && (
        <div className="flex items-center gap-2 rounded-md border border-[#6A4636]/25 bg-[#6A4636]/5 px-4 py-3 text-sm text-[#6A4636]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Test notification sent successfully
        </div>
      )}

      <NotificationTable
        logs={data?.data}
        isLoading={isLoading}
        isError={isError}
        error={error}
      />

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} total • page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={!canPrev || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
