"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, AlertCircle, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StockBreakdown } from "@/components/catalog/StockIndicator";
import { useItem } from "@/hooks/useItems";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { ItemMedia } from "@/types";

interface ItemDetailClientProps {
  id: string;
  isAdmin: boolean;
}

// ─── Media gallery ────────────────────────────────────────────────────────────

function MediaGallery({ media }: { media: ItemMedia[] }) {
  const ready = media.filter((m) => m.status === "ready");
  const images = ready.filter((m) => m.mediaType === "image");
  const video = ready.find((m) => m.mediaType === "video");

  const [activeIdx, setActiveIdx] = useState(0);

  if (ready.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Main image — fixed height, not full-screen */}
      {images.length > 0 && (
        <div className="relative h-64 rounded-xl overflow-hidden bg-muted">
          <Image
            src={images[activeIdx]?.url ?? images[0].url}
            alt={images[activeIdx]?.altText ?? images[0].altText ?? "Product image"}
            fill
            className="object-contain"
            unoptimized
          />
          {/* Prev / Next arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                disabled={activeIdx === 0}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/75 p-1 shadow transition-opacity",
                  activeIdx === 0 ? "opacity-30 cursor-default" : "hover:bg-background"
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setActiveIdx((i) => Math.min(images.length - 1, i + 1))}
                disabled={activeIdx === images.length - 1}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/75 p-1 shadow transition-opacity",
                  activeIdx === images.length - 1 ? "opacity-30 cursor-default" : "hover:bg-background"
                )}
                aria-label="Next image"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              {/* Dot indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-colors",
                      i === activeIdx ? "bg-white" : "bg-white/50"
                    )}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors",
                i === activeIdx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `Image ${i + 1}`}
                width={48}
                height={48}
                className="object-cover w-full h-full"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}

      {/* Video — compact height */}
      {video && (
        <div className="space-y-1">
          {images.length > 0 && (
            <p className="text-xs font-medium text-muted-foreground pt-1">Video</p>
          )}
          <div className="h-44 rounded-xl overflow-hidden bg-muted">
            <video
              src={video.url}
              controls
              preload="metadata"
              className="w-full h-full object-contain"
              aria-label="Product video"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

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
          {item.primaryImageUrl ? (
            <div className="rounded-xl overflow-hidden w-12 h-12 shrink-0 bg-muted">
              <Image
                src={item.primaryImageUrl}
                alt={item.name}
                width={48}
                height={48}
                className="object-cover w-full h-full"
                unoptimized
              />
            </div>
          ) : (
            <div className="rounded-xl bg-forest/10 p-2.5 text-forest">
              <Package className="h-6 w-6" />
            </div>
          )}
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

      {/* Body: media left + info right (lg), stacked on small screens */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Media gallery — left column on lg */}
        {item.media && item.media.length > 0 && (
          <div className="lg:col-span-2">
            <MediaGallery media={item.media} />
          </div>
        )}

        {/* Info cards — right column on lg, full width when no media */}
        <div
          className={cn(
            "space-y-4",
            item.media && item.media.length > 0 ? "lg:col-span-3" : "lg:col-span-5"
          )}
        >
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
      </div>
    </div>
  );
}

