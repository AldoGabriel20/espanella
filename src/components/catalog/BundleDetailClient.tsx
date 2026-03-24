"use client";

import Link from "next/link";
import { ArrowLeft, AlertCircle, Boxes, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { StockBadge } from "@/components/catalog/StockIndicator";
import { useBundle } from "@/hooks/useBundles";
import { useItems } from "@/hooks/useItems";
import { formatDateTime } from "@/lib/utils/date";
import type { Item } from "@/types";

interface BundleDetailClientProps {
  id: string;
  isAdmin: boolean;
}

function buildItemMap(items: Item[]): Map<string, Item> {
  return new Map(items.map((i) => [i.id, i]));
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function BundleDetailClient({ id, isAdmin }: BundleDetailClientProps) {
  const { data: bundle, isLoading: bundleLoading, isError, error } = useBundle(id);
  // Fetch items to resolve names — usually already cached from other pages
  const { data: items, isLoading: itemsLoading } = useItems({ limit: 200 });

  const isLoading = bundleLoading || itemsLoading;
  const itemMap = items ? buildItemMap(items) : new Map<string, Item>();

  if (isLoading) return <DetailSkeleton />;

  if (isError || !bundle) {
    return (
      <div className="space-y-4">
        <Link href="/catalog/bundles">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Bundles
          </Button>
        </Link>
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error instanceof Error ? error.message : "Bundle not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link href="/catalog/bundles">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Bundles
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-forest/10 p-2.5 text-forest">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{bundle.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {bundle.items.length} component{bundle.items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Link href="/admin/bundles">
            <Button variant="outline" size="sm">
              Edit Bundle →
            </Button>
          </Link>
        )}
      </div>

      {/* Composition table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Bundle Composition</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {bundle.items.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center px-6">
              <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No components in this bundle</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Item</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead>Stock Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bundle.items.map((line) => {
                  const item = itemMap.get(line.itemId);
                  return (
                    <TableRow key={line.id}>
                      <TableCell>
                        {item ? (
                          <Link
                            href={`/catalog/items/${item.id}`}
                            className="font-medium hover:text-forest transition-colors"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">
                            {line.itemId}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item && (
                          <Badge variant="outline" className="text-xs">
                            {item.unit}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {line.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item ? item.availableStock : "—"}
                      </TableCell>
                      <TableCell>
                        {item ? (
                          <StockBadge available={item.availableStock} />
                        ) : (
                          <span className="text-xs text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Bundle ID</dt>
              <dd className="mt-0.5 font-mono text-sm truncate">{bundle.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Components</dt>
              <dd className="mt-0.5 text-sm font-medium">{bundle.items.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Created</dt>
              <dd className="mt-0.5 text-sm">{formatDateTime(bundle.createdAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
