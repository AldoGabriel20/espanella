"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// ─── Schema ───────────────────────────────────────────────────────────────────

const ItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  stock: z.number().int().min(0, "Must be 0 or more"),
  unit: z.string().min(1, "Unit is required"),
  price: z.number().min(0, "Must be 0 or more"),
});

export type ItemFormValues = z.infer<typeof ItemSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ItemFormProps {
  defaultValues?: Partial<ItemFormValues>;
  onSubmit: (values: ItemFormValues) => void | Promise<void>;
  isPending: boolean;
  error: Error | null;
  submitLabel?: string;
  onCancel: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ItemForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
  submitLabel = "Save",
  onCancel,
}: ItemFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(ItemSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      stock: defaultValues?.stock ?? 0,
      unit: defaultValues?.unit ?? "",
      price: defaultValues?.price ?? 0,
    },
  });

  // Re-populate when the dialog is opened with a different item
  useEffect(() => {
    reset({
      name: defaultValues?.name ?? "",
      stock: defaultValues?.stock ?? 0,
      unit: defaultValues?.unit ?? "",
      price: defaultValues?.price ?? 0,
    });
  }, [defaultValues?.name, defaultValues?.stock, defaultValues?.unit, defaultValues?.price, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="item-name">Name</Label>
        <Input
          id="item-name"
          placeholder="e.g. Premium Dates Box"
          {...register("name")}
          className={cn(errors.name && "border-red-400")}
        />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Stock + Unit */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="item-stock">Initial Stock</Label>
          <Input
            id="item-stock"
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

        <div className="space-y-1.5">
          <Label htmlFor="item-unit">Unit</Label>
          <Input
            id="item-unit"
            placeholder="e.g. pcs, box, kg"
            {...register("unit")}
            className={cn(errors.unit && "border-red-400")}
          />
          {errors.unit && (
            <p className="text-xs text-red-500">{errors.unit.message}</p>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="space-y-1.5">
        <Label htmlFor="item-price">Catalog Price (IDR)</Label>
        <Input
          id="item-price"
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
