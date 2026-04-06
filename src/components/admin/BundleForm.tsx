"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { Item } from "@/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const BundleLineSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  quantity: z
    .number()
    .int()
    .min(1, "At least 1"),
});

const BundleSchema = z.object({
  name: z.string().min(1, "Bundle name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  items: z.array(BundleLineSchema).min(1, "Add at least one item line"),
});

export type BundleFormValues = z.infer<typeof BundleSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface BundleFormProps {
  defaultValues?: Partial<BundleFormValues>;
  availableItems: Item[];
  onSubmit: (values: BundleFormValues) => void | Promise<void>;
  isPending: boolean;
  error: Error | null;
  submitLabel?: string;
  onCancel: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BundleForm({
  defaultValues,
  availableItems,
  onSubmit,
  isPending,
  error,
  submitLabel = "Save",
  onCancel,
}: BundleFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BundleFormValues>({
    resolver: zodResolver(BundleSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      price: defaultValues?.price ?? 0,
      stock: defaultValues?.stock ?? 0,
      items: defaultValues?.items?.length
        ? defaultValues.items
        : [{ itemId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Re-populate when editing a different bundle
  useEffect(() => {
    reset({
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      price: defaultValues?.price ?? 0,
      stock: defaultValues?.stock ?? 0,
      items: defaultValues?.items?.length
        ? defaultValues.items
        : [{ itemId: "", quantity: 1 }],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues?.name, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Bundle name */}
      <div className="space-y-1.5">
        <Label htmlFor="bundle-name">Bundle Name</Label>
        <Input
          id="bundle-name"
          placeholder="e.g. Royal Hamper Set"
          {...register("name")}
          className={cn(errors.name && "border-red-400")}
        />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="bundle-description">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <textarea
          id="bundle-description"
          rows={3}
          placeholder="Brief description of this bundle…"
          {...register("description")}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>

      {/* Price + Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="bundle-price">Price (IDR)</Label>
          <Input
            id="bundle-price"
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            {...register("price", { valueAsNumber: true })}
            className={cn(errors.price && "border-red-400")}
          />
          {errors.price && (
            <p className="text-xs text-red-500">{errors.price.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bundle-stock">Stock</Label>
          <Input
            id="bundle-stock"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            {...register("stock", { valueAsNumber: true })}
            className={cn(errors.stock && "border-red-400")}
          />
          {errors.stock && (
            <p className="text-xs text-red-500">{errors.stock.message}</p>
          )}
        </div>
      </div>

      {/* Item rows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Items</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ itemId: "", quantity: 1 })}
            className="gap-1.5 h-7 text-xs"
          >
            <Plus className="h-3 w-3" />
            Add Item
          </Button>
        </div>

        {/* Array-level error */}
        {errors.items && !Array.isArray(errors.items) && (
          <p className="text-xs text-red-500">Add at least one item line</p>
        )}

        {fields.length === 0 ? (
          <div className="rounded-md border-2 border-dashed py-6 text-center">
            <p className="text-sm text-muted-foreground">No items yet — click Add Item</p>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field, index) => {
              const rowErrors = errors.items?.[index];
              return (
                <div
                  key={field.id}
                  className="grid grid-cols-[1fr_100px_36px] gap-2 items-start"
                >
                  {/* Item selector */}
                  <div className="space-y-1">
                    <Controller
                      name={`items.${index}.itemId`}
                      control={control}
                      render={({ field: f }) => (
                        <select
                          {...f}
                          aria-label={`Item for row ${index + 1}`}
                          className={cn(
                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            rowErrors?.itemId && "border-red-400"
                          )}
                        >
                          <option value="">— Select item —</option>
                          {availableItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.availableStock} {item.unit} available)
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {rowErrors?.itemId && (
                      <p className="text-xs text-red-500">{rowErrors.itemId.message}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Qty"
                      aria-label={`Quantity for row ${index + 1}`}
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      className={cn(rowErrors?.quantity && "border-red-400")}
                    />
                    {rowErrors?.quantity && (
                      <p className="text-xs text-red-500">{rowErrors.quantity.message}</p>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="mt-0.5 flex h-10 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:text-red-500 hover:border-red-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label={`Remove row ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="min-w-[80px]">
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
