"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Boxes, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { useBundles } from "@/hooks/useBundles";
import { formatDate } from "@/lib/utils/date";

const PAGE_SIZE = 20;

export function BundlesListClient() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");

  const { data: bundles, isLoading, isError, error } = useBundles({ limit: PAGE_SIZE, offset });

  const filtered = bundles
    ? search.trim()
      ? bundles.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
      : bundles
    : [];

  const canPrev = offset > 0;
  const canNext = bundles?.length === PAGE_SIZE;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bundles"
        description="Browse pre-composed hamper bundles."
        action={
          <Link href="/admin/bundles">
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
          {error instanceof Error ? error.message : "Failed to load bundles"}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-20" />
                <div className="space-y-1.5 pt-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Boxes className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">
            {search ? `No bundles matching "${search}"` : "No bundles yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((bundle) => (
            <Link key={bundle.id} href={`/catalog/bundles/${bundle.id}`}>
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md hover:border-forest/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base leading-snug">{bundle.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {bundle.items.length} component{bundle.items.length !== 1 ? "s" : ""}
                  </p>
                  {bundle.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-0.5">
                      <span className="text-xs text-muted-foreground truncate font-mono">
                        {item.itemId.slice(0, 8)}…
                      </span>
                      <span className="text-xs font-medium shrink-0 ml-2">
                        × {item.quantity}
                      </span>
                    </div>
                  ))}
                  {bundle.items.length > 3 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      +{bundle.items.length - 3} more
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                    Created {formatDate(bundle.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !search && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}–{offset + (bundles?.length ?? 0)} bundles
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
