"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, AlertCircle, Package, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { PageHeader } from "@/components/ui/page-header";
import { ItemForm } from "@/components/admin/ItemForm";
import { MediaManager } from "@/components/admin/MediaManager";
import { useItems, useCreateItem, useUpdateItem, useDeleteItem } from "@/hooks/useItems";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { Item } from "@/types";

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

  const { items, isLoading, isError, error } = useItems({ limit: 200 });
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleCreate(values: { name: string; description?: string; stock: number; unit: string; price: number }) {
    const created = await createItem.mutateAsync(values);
    setCreateOpen(false);
    createItem.reset();
    // Open edit dialog so user can immediately add media to the new item.
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

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Unit</TableHead>
              <TableHead>Available Stock</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="w-8 h-8 rounded bg-muted animate-pulse" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Package className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No items yet</p>
                    <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
                      Add your first item
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    item.availableStock <= 0 && "bg-red-50/50",
                    item.availableStock > 0 && item.availableStock <= 5 && "bg-amber-50/50"
                  )}
                >
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
    </div>
  );
}
