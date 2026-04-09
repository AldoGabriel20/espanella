"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroBannerProps {
  images: string[];
  companyName?: string;
  tagline?: string;
  /** Auto-advance interval in ms. Default 4000. 0 = disabled. */
  interval?: number;
}

export function HeroBanner({
  images,
  companyName = "Leuzien",
  tagline = "Hampers & Gifts, Made with Love",
  interval = 4000,
}: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const count = images.length;

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + count) % count);
  }, [count]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % count);
  }, [count]);

  useEffect(() => {
    if (!interval || count <= 1) return;
    const t = setInterval(next, interval);
    return () => clearInterval(t);
  }, [interval, count, next]);

  if (count === 0) {
    // Fallback gradient banner with no images
    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[hsl(var(--sidebar))] to-[hsl(145,40%,30%)] h-56 sm:h-72 flex items-center justify-center">
        <div className="text-center text-[hsl(var(--sidebar-foreground))] px-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">{companyName}</h2>
          <p className="text-sm sm:text-base opacity-75">{tagline}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl group h-56 sm:h-72 lg:h-96 bg-muted">
      {/* Slides */}
      {images.map((src, i) => (
        <div
          key={src}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <Image
            src={src}
            alt={`${companyName} — slide ${i + 1}`}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="(max-width: 768px) 100vw, 80vw"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      ))}

      {/* Caption */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 text-white">
        <h2 className="text-xl sm:text-2xl font-bold drop-shadow">{companyName}</h2>
        <p className="text-sm opacity-80 drop-shadow">{tagline}</p>
      </div>

      {/* Nav arrows — only shown when >1 image */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/30 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/30 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 right-4 z-20 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === current ? "w-5 bg-white" : "w-2 bg-white/50"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
