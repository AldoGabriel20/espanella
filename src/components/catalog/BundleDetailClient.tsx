"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, AlertCircle, Boxes, Package, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
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
import { useBundle } from "@/hooks/useBundles";
import { useBundleMedia } from "@/hooks/useBundleMedia";
import { useItems } from "@/hooks/useItems";
import { cn } from "@/lib/utils";
import type { BundleMedia, Item } from "@/types";

interface BundleDetailClientProps {
  id: string;
  isAdmin: boolean;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// ─── Media gallery ────────────────────────────────────────────────────────────

function MediaGallery({ media }: { media: BundleMedia[] }) {
  const ready = media.filter((m) => m.status === "ready");
  const images = ready.filter((m) => m.mediaType === "image");
  const video = ready.find((m) => m.mediaType === "video");
  const [activeIdx, setActiveIdx] = useState(0);

  if (ready.length === 0) return null;

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted">
          <Image
            src={images[activeIdx]?.url ?? images[0].url}
            alt={images[activeIdx]?.altText ?? images[0].altText ?? "Bundle image"}
            fill
            className="object-contain"
            unoptimized
          />
          {images.length > 1 && (
            <>
              <button
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                disabled={activeIdx === 0}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow transition-opacity",
                  activeIdx === 0 ? "opacity-30 cursor-default" : "hover:bg-background"
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActiveIdx((i) => Math.min(images.length - 1, i + 1))}
                disabled={activeIdx === images.length - 1}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow transition-opacity",
                  activeIdx === images.length - 1 ? "opacity-30 cursor-default" : "hover:bg-background"
                )}
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      i === activeIdx ? "bg-white scale-125" : "bg-white/50"
                    )}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all",
                i === activeIdx ? "border-primary" : "border-transparent opacity-60 hover:opacity-90"
              )}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `Image ${i + 1}`}
                width={56}
                height={56}
                className="object-cover w-full h-full"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}

      {video && (
        <div className="space-y-1.5">
          {images.length > 0 && (
            <p className="text-xs font-medium text-muted-foreground">Video</p>
          )}
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted">
            <video
              src={video.url}
              controls
              preload="metadata"
              className="w-full h-full object-contain"
              aria-label="Bundle video"
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
    <div className="space-y-8">
      <Skeleton className="h-8 w-36" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}

function buildItemMap(items: Item[]): Map<string, Item> {
  return new Map(items.map((i) => [i.id, i]));
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BundleDetailClient({ id }: BundleDetailClientProps) {
  const { data: bundle, isLoading: bundleLoading, isError, error } = useBundle(id);
  const { data: mediaItems = [] } = useBundleMedia(id);
  const { items, isLoading: itemsLoading } = useItems({ limit: 200 });

  const isLoading = bundleLoading || itemsLoading;
  const itemMap = buildItemMap(items);

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

  const readyMedia = mediaItems.filter((m) => m.status === "ready");
  const hasMedia = readyMedia.length > 0;
  const inStock = bundle.availableStock > 0;

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <Link href="/catalog/bundles">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Bundles
        </Button>
      </Link>

      {/* Mobile-only: name/price/stock above the image */}
      <div className="lg:hidden space-y-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight leading-tight">
          {bundle.name}
        </h1>
        {bundle.price > 0 && (
          <p className="text-2xl font-bold text-primary">{formatPrice(bundle.price)}</p>
        )}
        <div className="flex items-center gap-2">
          {inStock ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
          )}
          <span className={cn("text-sm font-medium", inStock ? "text-green-700" : "text-red-600")}>
            {inStock ? `${bundle.availableStock} units available` : "Out of stock"}
          </span>
        </div>
      </div>

      {/* Main grid: media | info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

        {/* Left: media gallery or placeholder */}
        <div>
          {hasMedia ? (
            <MediaGallery media={mediaItems} />
          ) : (
            <div className="aspect-square w-full rounded-2xl bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Boxes className="h-16 w-16 opacity-20" />
              <p className="text-sm">No photos yet</p>
            </div>
          )}
        </div>

        {/* Right: product info */}
        <div className="space-y-5">
          {/* Name — desktop only (shown in mobile header above) */}
          <h1 className="hidden lg:block font-display text-3xl font-semibold tracking-tight leading-tight">
            {bundle.name}
          </h1>

          {/* Price — desktop only */}
          {bundle.price > 0 && (
            <p className="hidden lg:block text-2xl font-bold text-primary">{formatPrice(bundle.price)}</p>
          )}

          {/* Stock — desktop only */}
          <div className="hidden lg:flex items-center gap-2">
            {inStock ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            )}
            <span className={cn("text-sm font-medium", inStock ? "text-green-700" : "text-red-600")}>
              {inStock ? `${bundle.availableStock} units available` : "Out of stock"}
            </span>
          </div>

          {/* Description */}
          {bundle.description && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</p>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {bundle.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Composition table */}
      {bundle.items.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Bundle Composition</h2>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/40">
                  <TableHead className="font-semibold">Item Name</TableHead>
                  <TableHead className="font-semibold">Unit</TableHead>
                  <TableHead className="text-right font-semibold">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bundle.items.map((line) => {
                  const item = itemMap.get(line.itemId);
                  return (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">
                        {item?.name ?? (
                          <span className="font-mono text-xs text-muted-foreground">{line.itemId}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item && (
                          <Badge variant="outline" className="text-xs">{item.unit}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {line.quantity}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {bundle.items.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center rounded-xl border">
          <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No components in this bundle</p>
        </div>
      )}
    </div>
  );
}
