"use client";

import { ExternalLink, FileText, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoice, useGenerateInvoice } from "@/hooks/useInvoice";

interface InvoiceActionsProps {
  orderId: string;
}

export function InvoiceActions({ orderId }: InvoiceActionsProps) {
  const { data: invoice, isLoading, isError } = useInvoice(orderId);
  const generate = useGenerateInvoice();

  async function handleGenerate() {
    await generate.mutateAsync(orderId);
  }

  if (isLoading) {
    return <Skeleton className="h-9 w-44" />;
  }

  if (isError) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-600">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        Failed to load invoice
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Generate / regenerate */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={generate.isPending}
        className="gap-1.5 text-xs"
      >
        <RefreshCw className={`h-3.5 w-3.5${generate.isPending ? " animate-spin" : ""}`} />
        {generate.isPending
          ? "Generating…"
          : invoice
          ? "Regenerate Invoice"
          : "Generate Invoice"}
      </Button>

      {/* Open invoice via proxy — Supabase URL is never exposed to the browser */}
      {invoice ? (
        <a
          href={`/api/orders/${orderId}/invoice/view`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-[#6A4636]/25 bg-[#6A4636]/5 px-3 py-1.5 text-xs font-medium text-[#6A4636] hover:bg-[#6A4636]/10 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Invoice
        </a>
      ) : (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          No invoice yet
        </span>
      )}

      {/* Mutation error */}
      {generate.isError && (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {generate.error instanceof Error
            ? generate.error.message
            : "Generation failed"}
        </span>
      )}
    </div>
  );
}
