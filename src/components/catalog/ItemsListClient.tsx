"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { StockBadge } from "@/components/catalog/StockIndicator";
import { useItems } from "@/hooks/useItems";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export function ItemsListClient() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");

  const { data: items, isLoading, isError, error } = useItems({ limit: PAGE_SIZE, offset });

  // Client-side search filtering (backend doesn't support name search)
  const filtered = items
    ? search.trim()
      ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
      : items
    : [];

  const canPrev = offset > 0;
  const canNext = items?.length === PAGE_SIZE;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Items"
        description="Browse and manage catalog items."
        action={
          <Link href="/admin/items">
            <Button variant="outline" size="sm">
              Admin →
            </Button>
          </Link>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error instanceof Error ? error.message : "Failed to load items"}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Total stock</TableHead>
              <TableHead className="text-right">Reserved</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-10 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <span className="text-muted-foreground text-sm">
                    {search ? `No items matching "${search}"` : "No items found"}
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(item.availableStock <= 0 && "bg-red-50/50")}
                >
                  <TableCell>
                    <Link
                      href={`/catalog/items/${item.id}`}
                      className="font-medium hover:text-forest transition-colors"
                    >
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.unit}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{item.stock}</TableCell>
                  <TableCell className="text-right tabular-nums text-amber-600">
                    {item.reservedStock}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums font-medium",
                      item.availableStock <= 0
                        ? "text-red-600"
                        : item.availableStock <= 5
                        ? "text-amber-600"
                        : "text-emerald-600"
                    )}
                  >
                    {item.availableStock}
                  </TableCell>
                  <TableCell>
                    <StockBadge available={item.availableStock} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && !search && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}–{offset + (items?.length ?? 0)} items
          </p>
          <div className="flex items-center gap-2">
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
