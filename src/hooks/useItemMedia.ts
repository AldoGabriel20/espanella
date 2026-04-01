import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ItemMedia } from "@/types";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const mediaKeys = {
  all: ["itemMedia"] as const,
  forItem: (itemId: string) => ["itemMedia", itemId] as const,
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchMedia(itemId: string): Promise<ItemMedia[]> {
  const res = await fetch(`/api/catalog/items/${itemId}/media`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to fetch media" }));
    throw Object.assign(new Error(err.message ?? "Failed to fetch media"), { status: res.status });
  }
  return res.json();
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useItemMedia(itemId: string | null) {
  return useQuery({
    queryKey: mediaKeys.forItem(itemId ?? ""),
    queryFn: () => fetchMedia(itemId!),
    enabled: !!itemId,
  });
}

export function usePresignMedia(itemId: string) {
  return useMutation({
    mutationFn: async (body: {
      filename: string;
      content_type: string;
      size_bytes: number;
      media_type: "image" | "video";
    }) => {
      const res = await fetch(`/api/catalog/items/${itemId}/media/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Presign failed" }));
        throw Object.assign(new Error(err.message ?? "Presign failed"), { status: res.status });
      }
      return res.json() as Promise<{
        uploadUrl: string;
        storageBucket: string;
        storagePath: string;
        publicUrl: string;
        expiresInSeconds: number;
      }>;
    },
  });
}

export function useCompleteMedia(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      storage_bucket: string;
      storage_path: string;
      public_url: string;
      media_type: "image" | "video";
      mime_type: string;
      file_size_bytes: number;
      width?: number | null;
      height?: number | null;
      duration_seconds?: number | null;
      alt_text?: string | null;
      is_primary: boolean;
    }): Promise<ItemMedia> => {
      const res = await fetch(`/api/catalog/items/${itemId}/media/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Complete failed" }));
        throw Object.assign(new Error(err.message ?? "Complete failed"), { status: res.status });
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.forItem(itemId) });
      // Also invalidate item queries so primary_image_url refreshes.
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useReorderMedia(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const res = await fetch(`/api/catalog/items/${itemId}/media/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordered_ids: orderedIds }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Reorder failed" }));
        throw Object.assign(new Error(err.message ?? "Reorder failed"), { status: res.status });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.forItem(itemId) });
    },
  });
}

export function useSetPrimaryMedia(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: string) => {
      const res = await fetch(
        `/api/catalog/items/${itemId}/media/${mediaId}/primary`,
        { method: "PATCH" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Set primary failed" }));
        throw Object.assign(new Error(err.message ?? "Set primary failed"), { status: res.status });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.forItem(itemId) });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useDeleteMedia(itemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: string) => {
      const res = await fetch(
        `/api/catalog/items/${itemId}/media/${mediaId}`,
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({ message: "Delete failed" }));
        throw Object.assign(new Error(err.message ?? "Delete failed"), { status: res.status });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.forItem(itemId) });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
