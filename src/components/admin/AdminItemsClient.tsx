"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, AlertCircle, Package, ImageIcon, Search, ChevronDown } from "lucide-react";
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
import { ItemForm } from "@/components/admin/ItemForm";
import { MediaManager } from "@/components/admin/MediaManager";
import { useItems, useCreateItem, useUpdateItem, useDeleteItem } from "@/hooks/useItems";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { Item } from "@/types";

type ItemSortKey = "name_asc" | "name_desc" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc";

function sortItems(items: Item[], key: ItemSortKey): Item[] {
  return [...items].sort((a, b) => {
    switch (key) {
      case "name_asc":   return a.name.localeCompare(b.name);
      case "name_desc":  return b.name.localeCompare(a.name);
      case "price_asc":  return a.price - b.price;
      case "price_desc": return b.price - a.price;
      case "stock_asc":  return a.availableStock - b.availableStock;
      case "stock_desc": return b.availableStock - a.availableStock;
      default: return 0;
    }
  });
}

// ─── Stock badge helper ───────────────────────────────────────────────────────

function StockCell({ item }: { item: Item }) {
  const avail = item.availableStock;
  return (
    <div className="tabular-nums text-sm">
      <span
        className={cn(
          "font-medium",
          avail <= 0
            ? "text-red-600"
            : avail <= 5
            ? "text-amber-600"
            : "text-foreground"
        )}
      >
        {avail}
      </span>
      <span className="text-muted-foreground text-xs ml-1">
        ({item.stock} total, {item.reservedStock} reserved)
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminItemsClient() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Search & sort
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<ItemSortKey>("name_asc");

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { items, isLoading, isError, error } = useItems({ limit: 200 });
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  // ─── Derived list ─────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? items.filter((i) => i.name.toLowerCase().includes(q))
      : items;
    return sortItems(base, sortKey);
  }, [items, search, sortKey]);

  // ─── Selection helpers ──────────────────────────────────────────────────

  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((i) => selected.has(i.id));

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((i) => next.add(i.id));
        return next;
      });
    }
  }

  const selectedCount = Array.from(selected).filter((id) =>
    filteredItems.some((i) => i.id === id)
  ).length;

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleCreate(values: { name: string; description?: string; stock: number; unit: string; price: number }) {
    const created = await createItem.mutateAsync(values);
    setCreateOpen(false);
    createItem.reset();
    setEditItem(created);
  }

  async function handleUpdate(values: { name: string; description?: string; stock: number; unit: string; price: number }) {
    if (!editItem) return;
    await updateItem.mutateAsync({ id: editItem.id, data: values });
    setEditItem(null);
    updateItem.reset();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteItem.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
    deleteItem.reset();
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected).filter((id) => filteredItems.some((i) => i.id === id));
    for (const id of ids) {
      await deleteItem.mutateAsync(id);
    }
    setSelected(new Set());
    setBulkDeleteOpen(false);
    deleteItem.reset();
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manage Items"
        description="Create, edit, and delete catalog items. Items with low available stock are highlighted."
        backHref="/admin"
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        }
      />

      {/* Fetch error */}
      {isError && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error instanceof Error ? error.message : "Failed to load items"}
        </div>
      )}

      {/* Search & sort bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as ItemSortKey)}>
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

        {selectedCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete {selectedCount} item{selectedCount !== 1 ? "s" : ""}
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
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                  disabled={filteredItems.length === 0}
                />
              </TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Unit</TableHead>
              <TableHead>Available Stock</TableHead>
              <TableHead className="hidden md:table-cell">Price</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><div className="w-8 h-8 rounded bg-muted animate-pulse" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Package className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      {search ? `No items matching "${search}"` : "No items yet"}
                    </p>
                    {!search && (
                      <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
                        Add your first item
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    item.availableStock <= 0 && "bg-red-50/50",
                    item.availableStock > 0 && item.availableStock <= 5 && "bg-amber-50/50"
                  )}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                      aria-label={`Select ${item.name}`}
                    />
                  </TableCell>
                  {/* Thumbnail */}
                  <TableCell>
                    <div className="w-8 h-8 rounded overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {item.primaryImageUrl ? (
                        <Image
                          src={item.primaryImageUrl}
                          alt={item.name}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {item.unit}
                  </TableCell>
                  <TableCell>
                    <StockCell item={item} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm tabular-nums">
                    {item.price > 0 ? `Rp ${item.price.toLocaleString("id-ID")}` : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => { updateItem.reset(); setEditItem(item); }}
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-600"
                        onClick={() => { deleteItem.reset(); setDeleteTarget(item); }}
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Create Dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) createItem.reset();
          setCreateOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
            <DialogDescription>
              Create a new catalog item. You can add photos and videos after saving.
            </DialogDescription>
          </DialogHeader>
          <ItemForm
            onSubmit={handleCreate}
            isPending={createItem.isPending}
            error={createItem.error as Error | null}
            submitLabel="Create Item"
            onCancel={() => { createItem.reset(); setCreateOpen(false); }}
          />
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────────────── */}
      <Dialog
        open={!!editItem}
        onOpenChange={(open) => {
          if (!open) { updateItem.reset(); setEditItem(null); }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the details for <span className="font-medium">{editItem?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          {editItem && (
            <div className="space-y-6">
              <ItemForm
                defaultValues={{ name: editItem.name, description: editItem.description ?? "", stock: editItem.stock, unit: editItem.unit, price: editItem.price }}
                onSubmit={handleUpdate}
                isPending={updateItem.isPending}
                error={updateItem.error as Error | null}
                submitLabel="Save Changes"
                onCancel={() => { updateItem.reset(); setEditItem(null); }}
              />
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Media</p>
                <MediaManager itemId={editItem.id} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) { deleteItem.reset(); setDeleteTarget(null); }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete item?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium">{deleteTarget?.name}</span>. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteItem.isError && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {deleteItem.error instanceof Error
                ? deleteItem.error.message
                : "Failed to delete item"}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={deleteItem.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteItem.isPending}
            >
              {deleteItem.isPending ? "Deleting…" : "Delete Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Delete Confirmation ──────────────────────────────────────── */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} items?</DialogTitle>
            <DialogDescription>
              This will permanently delete the selected items. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={deleteItem.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={deleteItem.isPending}
            >
              {deleteItem.isPending ? "Deleting…" : `Delete ${selectedCount} items`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

