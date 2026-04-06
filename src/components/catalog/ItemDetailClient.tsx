"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, AlertCircle, Package, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useItem } from "@/hooks/useItems";
import { cn } from "@/lib/utils";
import type { ItemMedia } from "@/types";

interface ItemDetailClientProps {
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

function MediaGallery({ media }: { media: ItemMedia[] }) {
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
            alt={images[activeIdx]?.altText ?? images[0].altText ?? "Product image"}
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

  const hasMedia = item.media && item.media.filter((m) => m.status === "ready").length > 0;
  const inStock = item.availableStock > 0;

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <Link href="/catalog/items">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Items
        </Button>
      </Link>

      {/* Mobile-only: name/unit/price/stock above the image */}
      <div className="lg:hidden space-y-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight leading-tight">
            {item.name}
          </h1>
          <Badge variant="outline" className="mt-2 text-xs">
            {item.unit}
          </Badge>
        </div>
        {item.price > 0 && (
          <p className="text-2xl font-bold text-primary">{formatPrice(item.price)}</p>
        )}
        <div className="flex items-center gap-2">
          {inStock ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
          )}
          <span className={cn("text-sm font-medium", inStock ? "text-green-700" : "text-red-600")}>
            {inStock ? `${item.availableStock} ${item.unit} available` : "Out of stock"}
          </span>
        </div>
      </div>

      {/* Main grid: media | info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

        {/* Left: media gallery or placeholder */}
        <div>
          {hasMedia ? (
            <MediaGallery media={item.media} />
          ) : (
            <div className="aspect-square w-full rounded-2xl bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Package className="h-16 w-16 opacity-20" />
              <p className="text-sm">No photos yet</p>
            </div>
          )}
        </div>

        {/* Right: product info */}
        <div className="space-y-5">
          {/* Name + unit — desktop only (shown in mobile header above) */}
          <div className="hidden lg:block">
            <h1 className="font-display text-3xl font-semibold tracking-tight leading-tight">
              {item.name}
            </h1>
            <Badge variant="outline" className="mt-2 text-xs">
              {item.unit}
            </Badge>
          </div>

          {/* Price — desktop only */}
          {item.price > 0 && (
            <p className="hidden lg:block text-2xl font-bold text-primary">{formatPrice(item.price)}</p>
          )}

          {/* Stock — desktop only */}
          <div className="hidden lg:flex items-center gap-2">
            {inStock ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            )}
            <span className={cn("text-sm font-medium", inStock ? "text-green-700" : "text-red-600")}>
              {inStock ? `${item.availableStock} ${item.unit} available` : "Out of stock"}
            </span>
          </div>

          {/* Description */}
          {item.description && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</p>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

