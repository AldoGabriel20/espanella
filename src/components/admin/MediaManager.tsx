"use client";

import { useRef, useState } from "react";
import {
  ImageIcon,
  VideoIcon,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  useItemMedia,
  usePresignMedia,
  useCompleteMedia,
  useReorderMedia,
  useSetPrimaryMedia,
  useDeleteMedia,
} from "@/hooks/useItemMedia";
import type { ItemMedia } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadProgress {
  file: File;
  mediaType: "image" | "video";
  state: "uploading" | "completing" | "done" | "error";
  error?: string;
  storagePath?: string;
  storageBucket?: string;
  publicUrl?: string;
}

interface MediaManagerProps {
  itemId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_IMAGES = 5;

function detectMediaType(file: File): "image" | "video" | null {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return "video";
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Media card ───────────────────────────────────────────────────────────────

function MediaCard({
  media,
  index,
  total,
  onMoveLeft,
  onMoveRight,
  onSetPrimary,
  onDelete,
  isPendingPrimary,
  isPendingDelete,
}: {
  media: ItemMedia;
  index: number;
  total: number;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onSetPrimary: () => void;
  onDelete: () => void;
  isPendingPrimary: boolean;
  isPendingDelete: boolean;
}) {
  return (
    <div
      className={cn(
        "relative group rounded-lg border bg-card overflow-hidden",
        media.isPrimary && "ring-2 ring-primary"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square w-full bg-muted">
        {media.mediaType === "image" ? (
          <Image
            src={media.url}
            alt={media.altText ?? media.url}
            fill
            className="object-cover"
            sizes="160px"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1 text-muted-foreground">
            <VideoIcon className="h-8 w-8" />
            <span className="text-xs">Video</span>
          </div>
        )}

        {/* Primary badge */}
        {media.isPrimary && (
          <span className="absolute top-1.5 left-1.5 text-xs bg-primary text-primary-foreground rounded px-1.5 py-0.5 font-medium leading-none">
            Cover
          </span>
        )}

        {/* Pending overlay */}
        {media.status === "pending" && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-1 p-1.5">
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            disabled={index === 0}
            onClick={onMoveLeft}
            aria-label="Move left"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            disabled={index === total - 1}
            onClick={onMoveRight}
            aria-label="Move right"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {!media.isPrimary && media.mediaType === "image" && media.status === "ready" && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-amber-500"
              disabled={isPendingPrimary}
              onClick={onSetPrimary}
              aria-label="Set as cover"
              title="Set as cover image"
            >
              {isPendingPrimary ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Star className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground hover:text-red-600"
            disabled={isPendingDelete}
            onClick={onDelete}
            aria-label="Delete media"
          >
            {isPendingDelete ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MediaManager({ itemId }: MediaManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const { data: media = [], isLoading } = useItemMedia(itemId);
  const presign = usePresignMedia(itemId);
  const complete = useCompleteMedia(itemId);
  const reorder = useReorderMedia(itemId);
  const setPrimary = useSetPrimaryMedia(itemId);
  const deleteMedia = useDeleteMedia(itemId);

  // ─── Upload flow ────────────────────────────────────────────────────────────

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setGlobalError(null);

    const newUploads: UploadProgress[] = [];

    for (const file of Array.from(files)) {
      const mediaType = detectMediaType(file);
      if (!mediaType) {
        setGlobalError(
          `"${file.name}" has an unsupported type. Allowed: JPEG, PNG, WebP, MP4, WebM.`
        );
        continue;
      }
      if (mediaType === "image" && file.size > MAX_IMAGE_BYTES) {
        setGlobalError(`"${file.name}" exceeds the 10 MB image limit (${formatBytes(file.size)}).`);
        continue;
      }
      if (mediaType === "video" && file.size > MAX_VIDEO_BYTES) {
        setGlobalError(`"${file.name}" exceeds the 50 MB video limit (${formatBytes(file.size)}).`);
        continue;
      }
      newUploads.push({ file, mediaType, state: "uploading" });
    }

    setUploads((prev) => [...prev, ...newUploads]);

    for (let i = 0; i < newUploads.length; i++) {
      const entry = newUploads[i];
      const updateEntry = (patch: Partial<UploadProgress>) => {
        setUploads((prev) =>
          prev.map((u) => (u === entry ? { ...u, ...patch } : u))
        );
        Object.assign(entry, patch);
      };

      try {
        // 1. Get signed upload URL from backend.
        const presignResult = await presign.mutateAsync({
          filename: entry.file.name,
          content_type: entry.file.type,
          size_bytes: entry.file.size,
          media_type: entry.mediaType,
        });

        // 2. Upload file directly to storage.
        const uploadRes = await fetch(presignResult.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": entry.file.type },
          body: entry.file,
        });
        if (!uploadRes.ok) {
          throw new Error(`Storage upload failed (${uploadRes.status})`);
        }

        updateEntry({
          state: "completing",
          storagePath: presignResult.storagePath,
          storageBucket: presignResult.storageBucket,
          publicUrl: presignResult.publicUrl,
        });

        // 3. Finalize with backend.
        const isFirst = media.length === 0 && i === 0;
        await complete.mutateAsync({
          storage_bucket: presignResult.storageBucket,
          storage_path: presignResult.storagePath,
          public_url: presignResult.publicUrl,
          media_type: entry.mediaType,
          mime_type: entry.file.type,
          file_size_bytes: entry.file.size,
          is_primary: isFirst && entry.mediaType === "image",
        });

        updateEntry({ state: "done" });
      } catch (err) {
        updateEntry({
          state: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    }

    // Clean up done entries after a short delay.
    setTimeout(() => {
      setUploads((prev) => prev.filter((u) => u.state !== "done"));
    }, 2000);
  }

  // ─── Reorder ────────────────────────────────────────────────────────────────

  function handleMoveLeft(index: number) {
    if (index === 0) return;
    const ids = media.map((m) => m.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorder.mutate(ids);
  }

  function handleMoveRight(index: number) {
    if (index === media.length - 1) return;
    const ids = media.map((m) => m.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    reorder.mutate(ids);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const hasVideo = media.some((m) => m.mediaType === "video" && m.status !== "deleted");
  const imageCount = media.filter((m) => m.mediaType === "image" && m.status !== "deleted").length;
  const hasMaxImages = imageCount >= MAX_IMAGES;
  const activeUploads = uploads.filter((u) => u.state !== "done");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {media.length} media file{media.length !== 1 ? "s" : ""} · star sets cover image
        </p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          Add Media
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(",")}
          onChange={(e) => handleFiles(e.target.files)}
          onClick={(e) => ((e.target as HTMLInputElement).value = "")}
        />
      </div>

      {/* Error banner */}
      {globalError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{globalError}</AlertDescription>
        </Alert>
      )}

      {/* Upload progress */}
      {activeUploads.length > 0 && (
        <div className="space-y-1.5">
          {activeUploads.map((u, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              {u.mediaType === "image" ? (
                <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <VideoIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="truncate flex-1 text-muted-foreground">{u.file.name}</span>
              {u.state === "uploading" || u.state === "completing" ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              ) : u.state === "done" ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <span className="text-red-500 text-xs shrink-0">{u.error}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Media hints */}
      {hasMaxImages && (
        <p className="text-xs text-amber-600">
          Maximum of {MAX_IMAGES} images reached for this item.
        </p>
      )}
      {hasVideo && !hasMaxImages && (
        <p className="text-xs text-amber-600">
          A video is already attached. Only one video is allowed per item.
        </p>
      )}

      {/* Media grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : media.length === 0 && activeUploads.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-2 w-full rounded-lg border-2 border-dashed border-muted-foreground/25 py-8 text-sm text-muted-foreground hover:border-muted-foreground/50 transition-colors"
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
          Click to upload photos or video
          <span className="text-xs">JPEG, PNG, WebP up to 10 MB (max 5 photos) · MP4, WebM up to 50 MB (max 1 video)</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {media.map((m, idx) => (
            <MediaCard
              key={m.id}
              media={m}
              index={idx}
              total={media.length}
              onMoveLeft={() => handleMoveLeft(idx)}
              onMoveRight={() => handleMoveRight(idx)}
              onSetPrimary={() => setPrimary.mutate(m.id)}
              onDelete={() => deleteMedia.mutate(m.id)}
              isPendingPrimary={setPrimary.isPending}
              isPendingDelete={deleteMedia.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
