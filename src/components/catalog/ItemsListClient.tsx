"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ImageIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StockBadge } from "@/components/catalog/StockIndicator";
import { useItems } from "@/hooks/useItems";
import type { ItemsListParams } from "@/lib/api/items";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function ItemsListClient() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter / sort state
  const [sortBy, setSortBy] = useState<ItemsListParams["sortBy"]>(undefined);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);

  const apiParams: ItemsListParams = {
    limit: PAGE_SIZE,
    offset,
    sortBy,
    minPrice: minPrice !== "" ? Number(minPrice) : undefined,
    maxPrice: maxPrice !== "" ? Number(maxPrice) : undefined,
    inStock: inStock || undefined,
  };

  const { items, total, isLoading, isError, error } = useItems(apiParams);

  // Client-side name search (applied on top of server results)
  const filtered = search.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const canPrev = offset > 0;
  const canNext = items.length === PAGE_SIZE;

  const hasActiveFilters =
    !!sortBy || minPrice !== "" || maxPrice !== "" || inStock;

  function resetFilters() {
    setSortBy(undefined);
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    setOffset(0);
  }

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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Name search */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy ?? "default"}
          onChange={(e) => {
            const v = e.target.value;
            setSortBy(v === "default" ? undefined : (v as ItemsListParams["sortBy"]));
            setOffset(0);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring w-44"
        >
          <option value="default">Name: A – Z</option>
          <option value="name_desc">Name: Z – A</option>
          <option value="most_ordered">Best selling</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="updated_at_desc">Newest updated</option>
          <option value="updated_at_asc">Oldest updated</option>
        </select>

        {/* Filter toggle */}
        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-1.5" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              !
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
            <X className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-muted/30 px-4 py-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Min price (Rp)</p>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={minPrice}
              onChange={(e) => { setMinPrice(e.target.value); setOffset(0); }}
              className="w-32 h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Max price (Rp)</p>
            <Input
              type="number"
              min={0}
              placeholder="∞"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setOffset(0); }}
              className="w-32 h-8 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none pb-1">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => { setInStock(e.target.checked); setOffset(0); }}
              className="h-4 w-4 rounded border-muted-foreground accent-primary"
            />
            <span className="text-sm">In stock only</span>
          </label>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error instanceof Error ? error.message : "Failed to load items"}
        </div>
      )}

      {/* Card grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">
            {search ? `No items matching "${search}"` : "No items found"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <Link key={item.id} href={`/catalog/items/${item.id}`}>
              <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                {/* Thumbnail */}
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {item.primaryImageUrl ? (
                    <Image
                      src={item.primaryImageUrl}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                  )}
                  {/* Out-of-stock overlay */}
                  {item.availableStock <= 0 && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        Out of stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-1.5">
                  <p
                    className={cn(
                      "font-medium text-sm leading-tight line-clamp-2",
                      item.availableStock <= 0 && "text-muted-foreground"
                    )}
                  >
                    {item.name}
                  </p>
                  {/* Price */}
                  {item.price > 0 && (
                    <p className="text-sm font-semibold text-primary">
                      {formatPrice(item.price)}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {item.unit}
                    </Badge>
                    <StockBadge available={item.availableStock} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !search && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}–{offset + (items?.length ?? 0)}
            {total > 0 ? ` of ${total}` : ""} items
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

