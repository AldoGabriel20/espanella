import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BundleMedia } from "@/types";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const bundleMediaKeys = {
  all: ["bundleMedia"] as const,
  forBundle: (bundleId: string) => ["bundleMedia", bundleId] as const,
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchBundleMedia(bundleId: string): Promise<BundleMedia[]> {
  const res = await fetch(`/api/catalog/bundles/${bundleId}/media`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Failed to fetch media" }));
    throw Object.assign(new Error(err.message ?? "Failed to fetch media"), { status: res.status });
  }
  return res.json();
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useBundleMedia(bundleId: string | null) {
  return useQuery({
    queryKey: bundleMediaKeys.forBundle(bundleId ?? ""),
    queryFn: () => fetchBundleMedia(bundleId!),
    enabled: !!bundleId,
  });
}

export function usePresignBundleMedia(bundleId: string) {
  return useMutation({
    mutationFn: async (body: {
      filename: string;
      content_type: string;
      size_bytes: number;
      media_type: "image" | "video";
    }) => {
      const res = await fetch(`/api/catalog/bundles/${bundleId}/media/presign`, {
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

export function useCompleteBundleMedia(bundleId: string) {
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
    }): Promise<BundleMedia> => {
      const res = await fetch(`/api/catalog/bundles/${bundleId}/media/complete`, {
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
      queryClient.invalidateQueries({ queryKey: bundleMediaKeys.forBundle(bundleId) });
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
    },
  });
}

export function useReorderBundleMedia(bundleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const res = await fetch(`/api/catalog/bundles/${bundleId}/media/reorder`, {
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
      queryClient.invalidateQueries({ queryKey: bundleMediaKeys.forBundle(bundleId) });
    },
  });
}

export function useSetPrimaryBundleMedia(bundleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: string) => {
      const res = await fetch(
        `/api/catalog/bundles/${bundleId}/media/${mediaId}/primary`,
        { method: "PATCH" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Set primary failed" }));
        throw Object.assign(new Error(err.message ?? "Set primary failed"), { status: res.status });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleMediaKeys.forBundle(bundleId) });
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
    },
  });
}

export function useDeleteBundleMedia(bundleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: string) => {
      const res = await fetch(
        `/api/catalog/bundles/${bundleId}/media/${mediaId}`,
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({ message: "Delete failed" }));
        throw Object.assign(new Error(err.message ?? "Delete failed"), { status: res.status });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bundleMediaKeys.forBundle(bundleId) });
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
    },
  });
}
