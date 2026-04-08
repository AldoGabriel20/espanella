"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, AlertCircle, PackageOpen, ImageIcon, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui/page-header";
import { BundleForm } from "@/components/admin/BundleForm";
import type { BundleFormValues } from "@/components/admin/BundleForm";
import { BundleMediaManager } from "@/components/admin/BundleMediaManager";
import {
  useBundles,
  useCreateBundle,
  useUpdateBundle,
  useDeleteBundle,
} from "@/hooks/useBundles";
import { useItems } from "@/hooks/useItems";
import { formatDate } from "@/lib/utils/date";
import type { Bundle } from "@/types";

type BundleSortKey = "name_asc" | "name_desc" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc";

function sortBundles(bundles: Bundle[], key: BundleSortKey): Bundle[] {
  return [...bundles].sort((a, b) => {
    switch (key) {
      case "name_asc":   return a.name.localeCompare(b.name);
      case "name_desc":  return b.name.localeCompare(a.name);
      case "price_asc":  return a.price - b.price;
      case "price_desc": return b.price - a.price;
      case "stock_asc":  return a.stock - b.stock;
      case "stock_desc": return b.stock - a.stock;
      default: return 0;
    }
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminBundlesClient() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editBundle, setEditBundle] = useState<Bundle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bundle | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Search & sort
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<BundleSortKey>("name_asc");

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { bundles, isLoading: bundlesLoading, isError, error } = useBundles({ limit: 200 });
  const { items, isLoading: itemsLoading } = useItems({ limit: 200 });

  const createBundle = useCreateBundle();
  const updateBundle = useUpdateBundle();
  const deleteBundle = useDeleteBundle();

  const catalogLoading = bundlesLoading || itemsLoading;

  // ─── Derived list ─────────────────────────────────────────────────────────

  const filteredBundles = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? bundles.filter((b) => b.name.toLowerCase().includes(q))
      : bundles;
    return sortBundles(base, sortKey);
  }, [bundles, search, sortKey]);

  // ─── Selection helpers ───────────────────────────────────────────────────

  const allFilteredSelected =
    filteredBundles.length > 0 &&
    filteredBundles.every((b) => selected.has(b.id));

  function toggleAll() {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredBundles.forEach((b) => next.delete(b.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredBundles.forEach((b) => next.add(b.id));
        return next;
      });
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ─── Handlers ────────────────────────────────────────────────────────────

  async function handleCreate(values: BundleFormValues) {
    const created = await createBundle.mutateAsync({
      name: values.name,
      description: values.description,
      price: values.price,
      stock: values.stock,
      items: values.items.map((line) => ({
        itemId: line.itemId,
        quantity: line.quantity,
      })),
    });
    setCreateOpen(false);
    createBundle.reset();
    updateBundle.reset();
    setEditBundle(created);
  }

  async function handleUpdate(values: BundleFormValues) {
    if (!editBundle) return;
    await updateBundle.mutateAsync({
      id: editBundle.id,
      data: {
        name: values.name,
        description: values.description,
        price: values.price,
        stock: values.stock,
        items: values.items.map((line) => ({
          itemId: line.itemId,
          quantity: line.quantity,
        })),
      },
    });
    setEditBundle(null);
    updateBundle.reset();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteBundle.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    deleteBundle.reset();
  }

  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);

  async function handleBulkDelete() {
    setBulkDeleting(true);
    setBulkDeleteError(null);
    try {
      await Promise.all(Array.from(selected).map((id) => deleteBundle.mutateAsync(id)));
      setSelected(new Set());
      setBulkDeleteOpen(false);
    } catch (err) {
      setBulkDeleteError(err instanceof Error ? err.message : "Failed to delete some bundles");
    } finally {
      setBulkDeleting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manage Bundles"
        description="Create and edit hamper bundle compositions."
        backHref="/admin"
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Bundle
          </Button>
        }
      />

      {/* Fetch error */}
      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error instanceof Error ? error.message : "Failed to load bundles"}
        </div>
      )}

      {/* Toolbar: search + sort + bulk actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as BundleSortKey)}>
          <SelectTrigger className="w-44 gap-1">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Name A → Z</SelectItem>
            <SelectItem value="name_desc">Name Z → A</SelectItem>
            <SelectItem value="price_asc">Price ↑</SelectItem>
            <SelectItem value="price_desc">Price ↓</SelectItem>
            <SelectItem value="stock_asc">Stock ↑</SelectItem>
            <SelectItem value="stock_desc">Stock ↓</SelectItem>
          </SelectContent>
        </Select>

        {selected.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => { setBulkDeleteError(null); setBulkDeleteOpen(true); }}
          >
            <Trash2 className="h-4 w-4" />
            Delete {selected.size} bundle{selected.size !== 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                  disabled={filteredBundles.length === 0}
                />
              </TableHead>
              <TableHead className="w-12" />
              <TableHead>Bundle Name</TableHead>
              <TableHead className="hidden sm:table-cell">Price</TableHead>
              <TableHead className="hidden sm:table-cell">Stock</TableHead>
              <TableHead className="hidden md:table-cell">Items</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {catalogLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="w-4 h-4 rounded bg-muted animate-pulse" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : filteredBundles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <PackageOpen className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      {search ? "No bundles match your search" : "No bundles yet"}
                    </p>
                    {!search && (
                      <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
                        Create your first bundle
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredBundles.map((bundle) => {
                const preview = bundle.items
                  .slice(0, 3)
                  .map((bi) => {
                    const item = items.find((it) => it.id === bi.itemId);
                    return `${item?.name ?? bi.itemId} ×${bi.quantity}`;
                  })
                  .join(", ");
                const overflow = bundle.items.length > 3 ? ` +${bundle.items.length - 3} more` : "";

                return (
                  <TableRow key={bundle.id} className="group">
                    {/* Checkbox */}
                    <TableCell>
                      <Checkbox
                        checked={selected.has(bundle.id)}
                        onCheckedChange={() => toggleOne(bundle.id)}
                        aria-label={`Select ${bundle.name}`}
                      />
                    </TableCell>
                    <TableCell className="w-12">
                      {bundle.primaryImageUrl ? (
                        <div className="relative h-10 w-10 rounded overflow-hidden bg-muted">
                          <Image
                            src={bundle.primaryImageUrl}
                            alt={bundle.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{bundle.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(bundle.price)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {bundle.stock}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {bundle.items.length} item{bundle.items.length !== 1 ? "s" : ""}
                        {preview && (
                          <span className="hidden lg:inline">
                            {" "}— {preview}{overflow}
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {formatDate(bundle.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => { updateBundle.reset(); setEditBundle(bundle); }}
                          aria-label={`Edit ${bundle.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => { deleteBundle.reset(); setDeleteTarget(bundle); }}
                          aria-label={`Delete ${bundle.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Create Dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) createBundle.reset();
          setCreateOpen(open);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Bundle</DialogTitle>
            <DialogDescription>
              Define a new hamper bundle. You can add photos and videos after saving.
            </DialogDescription>
          </DialogHeader>
          <BundleForm
            availableItems={items}
            onSubmit={handleCreate}
            isPending={createBundle.isPending}
            error={createBundle.error as Error | null}
            submitLabel="Create Bundle"
            onCancel={() => { createBundle.reset(); setCreateOpen(false); }}
          />
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────────────── */}
      <Dialog
        open={!!editBundle}
        onOpenChange={(open) => {
          if (!open) { updateBundle.reset(); setEditBundle(null); }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bundle</DialogTitle>
            <DialogDescription>
              Update <span className="font-medium">{editBundle?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          {editBundle && (
            <div className="space-y-6">
              <BundleForm
                defaultValues={{
                  name: editBundle.name,
                  description: editBundle.description ?? "",
                  price: editBundle.price,
                  stock: editBundle.stock,
                  items: editBundle.items.map((bi) => ({
                    itemId: bi.itemId,
                    quantity: bi.quantity,
                  })),
                }}
                availableItems={items}
                onSubmit={handleUpdate}
                isPending={updateBundle.isPending}
                error={updateBundle.error as Error | null}
                submitLabel="Save Changes"
                onCancel={() => { updateBundle.reset(); setEditBundle(null); }}
              />
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Photos &amp; Videos</p>
                <BundleMediaManager bundleId={editBundle.id} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) { deleteBundle.reset(); setDeleteTarget(null); }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete bundle?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium">{deleteTarget?.name}</span>. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteBundle.isError && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {deleteBundle.error instanceof Error
                ? deleteBundle.error.message
                : "Failed to delete bundle"}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={deleteBundle.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBundle.isPending}
            >
              {deleteBundle.isPending ? "Deleting…" : "Delete Bundle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Delete Confirmation ──────────────────────────────────────── */}
      <Dialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          if (!open) { setBulkDeleteError(null); setBulkDeleteOpen(false); }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {selected.size} bundle{selected.size !== 1 ? "s" : ""}?</DialogTitle>
            <DialogDescription>
              This will permanently delete the selected {selected.size} bundle{selected.size !== 1 ? "s" : ""}. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {bulkDeleteError && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {bulkDeleteError}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={bulkDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? "Deleting…" : `Delete ${selected.size} Bundle${selected.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
