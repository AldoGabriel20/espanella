"use client";

import Link from "next/link";
import { ArrowLeft, AlertCircle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StockBreakdown } from "@/components/catalog/StockIndicator";
import { useItem } from "@/hooks/useItems";
import { formatDateTime } from "@/lib/utils/date";

interface ItemDetailClientProps {
  id: string;
  isAdmin: boolean;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ItemDetailClient({ id, isAdmin }: ItemDetailClientProps) {
  const { data: item, isLoading, isError, error } = useItem(id);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !item) {
    return (
      <div className="space-y-4">
        <Link href="/catalog/items">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Items
          </Button>
        </Link>
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error instanceof Error ? error.message : "Item not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link href="/catalog/items">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Items
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-forest/10 p-2.5 text-forest">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{item.name}</h1>
            <Badge variant="outline" className="mt-1 text-xs">
              {item.unit}
            </Badge>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link href={`/catalog/items/${id}/stock-movements`}>
              <Button variant="outline" size="sm">
                Stock Movements →
              </Button>
            </Link>
            <Link href={`/admin/items`}>
              <Button variant="outline" size="sm">
                Edit Item →
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stock breakdown */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <StockBreakdown
            stock={item.stock}
            reservedStock={item.reservedStock}
            availableStock={item.availableStock}
            unit={item.unit}
          />
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
              <dt className="text-xs text-muted-foreground">Item ID</dt>
              <dd className="mt-0.5 font-mono text-sm truncate">{item.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Unit</dt>
              <dd className="mt-0.5 text-sm font-medium">{item.unit}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Created</dt>
              <dd className="mt-0.5 text-sm">{formatDateTime(item.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Last Updated</dt>
              <dd className="mt-0.5 text-sm">{formatDateTime(item.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
