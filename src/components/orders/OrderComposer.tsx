"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Package, Boxes, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useItems } from "@/hooks/useItems";
import { useBundles } from "@/hooks/useBundles";
import { useCreateOrder } from "@/hooks/useOrders";
import { formatIDR } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { Item } from "@/types";
import type { Bundle } from "@/types";

// ─── Zod schema ───────────────────────────────────────────────────────────────

const LineSchema = z.object({
  type: z.enum(["item", "bundle"]),
  sourceId: z.string().min(1, "Select an item or bundle"),
  name: z.string().min(1, "Line name is required"),
  quantity: z.number().int().min(1, "At least 1"),
  unitPrice: z.number().min(0, "Must be 0 or more"),
});

const OrderFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  phone: z.string().min(1, "Phone number is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  deliveryAmount: z.number().min(0, "Must be 0 or more"),
  lines: z.array(LineSchema).min(1, "Add at least one line"),
});

type OrderFormValues = z.infer<typeof OrderFormSchema>;

// ─── Today's date as YYYY-MM-DD for min attribute ────────────────────────────

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Individual line row ──────────────────────────────────────────────────────

interface LineRowProps {
  index: number;
  form: ReturnType<typeof useForm<OrderFormValues>>;
  onRemove: () => void;
  items: Item[];
  bundles: Bundle[];
  isAdmin: boolean;
}

function LineRow({ index, form, onRemove, items, bundles, isAdmin }: LineRowProps) {
  const { register, control, setValue, watch, formState } = form;
  const type = watch(`lines.${index}.type`);
  const sourceId = watch(`lines.${index}.sourceId`);
  const quantity = watch(`lines.${index}.quantity`) || 0;
  const unitPrice = watch(`lines.${index}.unitPrice`) || 0;
  const lineTotal = quantity * unitPrice;

  const errors = formState.errors.lines?.[index];

  // For items, show stock availability
  const selectedItem = type === "item" ? items.find((i) => i.id === sourceId) : null;

  function handleSourceChange(newId: string) {
    setValue(`lines.${index}.sourceId`, newId);
    if (type === "item") {
      const item = items.find((i) => i.id === newId);
      if (item) {
        setValue(`lines.${index}.name`, item.name);
        setValue(`lines.${index}.unitPrice`, item.price > 0 ? item.price : 0);
      }
    } else {
      const bundle = bundles.find((b) => b.id === newId);
      if (bundle) {
        setValue(`lines.${index}.name`, bundle.name);
        setValue(`lines.${index}.unitPrice`, bundle.price > 0 ? bundle.price : 0);
      }
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Type indicator + remove */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
            type === "item"
              ? "bg-blue-100 text-blue-800"
              : "bg-purple-100 text-purple-800"
          )}
        >
          {type === "item" ? (
            <>
              <Package className="h-3 w-3" />
              Direct Item
            </>
          ) : (
            <>
              <Boxes className="h-3 w-3" />
              Bundle
            </>
          )}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded"
          aria-label="Remove line"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Source selector */}
      <div className="space-y-1">
        <Label htmlFor={`source-${index}`}>
          {type === "item" ? "Select item" : "Select bundle"}
        </Label>
        <Controller
          name={`lines.${index}.sourceId`}
          control={control}
          render={() => (
            <select
              id={`source-${index}`}
              value={sourceId}
              onChange={(e) => handleSourceChange(e.target.value)}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                errors?.sourceId && "border-red-400"
              )}
            >
              <option value="">— Select {type === "item" ? "an item" : "a bundle"} —</option>
              {type === "item"
                ? items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.availableStock} {item.unit} available)
                    </option>
                  ))
                : bundles.map((bundle) => (
                    <option key={bundle.id} value={bundle.id}>
                      {bundle.name} ({bundle.items.length} items)
                    </option>
                  ))}
            </select>
          )}
        />
        {errors?.sourceId && (
          <p className="text-xs text-red-500">{errors.sourceId.message}</p>
        )}
        {selectedItem && selectedItem.availableStock <= 5 && (
          <p
            className={cn(
              "text-xs",
              selectedItem.availableStock <= 0 ? "text-red-500" : "text-amber-600"
            )}
          >
            {selectedItem.availableStock <= 0
              ? "⚠ Out of stock"
              : `⚠ Low stock: ${selectedItem.availableStock} available`}
          </p>
        )}
      </div>

      {/* Line name */}
      <div className="space-y-1">
        <Label htmlFor={`name-${index}`}>Line name (invoice label)</Label>
        <Input
          id={`name-${index}`}
          placeholder="e.g. Royal Hamper Box"
          {...register(`lines.${index}.name`)}
          className={cn(errors?.name && "border-red-400")}
        />
        {errors?.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Qty + Unit price + Total */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`qty-${index}`}>Quantity</Label>
          <Input
            id={`qty-${index}`}
            type="number"
            min="1"
            step="1"
            placeholder="1"
            {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
            className={cn(errors?.quantity && "border-red-400")}
          />
          {errors?.quantity && (
            <p className="text-xs text-red-500">{errors.quantity.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor={`price-${index}`}>Unit Price (IDR)</Label>
          {isAdmin ? (
            <Input
              id={`price-${index}`}
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })}
              className={cn(errors?.unitPrice && "border-red-400")}
            />
          ) : (
            <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm tabular-nums">
              {formatIDR(unitPrice)}
            </div>
          )}
          {errors?.unitPrice && (
            <p className="text-xs text-red-500">{errors.unitPrice.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Line Total</Label>
          <div className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm tabular-nums text-muted-foreground">
            {formatIDR(lineTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order Composer ───────────────────────────────────────────────────────────

export function OrderComposer({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const { items, isLoading: itemsLoading } = useItems({ limit: 200 });
  const { bundles, isLoading: bundlesLoading } = useBundles({ limit: 200 });
  const createOrder = useCreateOrder();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(OrderFormSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      deliveryDate: "",
      deliveryAmount: 0,
      lines: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const lines = form.watch("lines");
  const deliveryAmount = form.watch("deliveryAmount") || 0;
  const subtotal = lines.reduce(
    (sum, line) => sum + (line.quantity || 0) * (line.unitPrice || 0),
    0
  );
  const grandTotal = subtotal + deliveryAmount;

  function addLine(type: "item" | "bundle") {
    append({ type, sourceId: "", name: "", quantity: 1, unitPrice: 0 });
  }

  async function onSubmit(values: OrderFormValues) {
    try {
      const order = await createOrder.mutateAsync(values);
      router.push(`/orders/${order.id}`);
    } catch {
      // error surfaced via createOrder.error
    }
  }

  const catalogLoading = itemsLoading || bundlesLoading;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Backend error */}
      {createOrder.isError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {createOrder.error instanceof Error
              ? createOrder.error.message
              : "Failed to create order"}
          </AlertDescription>
        </Alert>
      )}

      {/* Customer info */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Customer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                placeholder="Full name"
                {...form.register("customerName")}
                className={cn(form.formState.errors.customerName && "border-red-400")}
              />
              {form.formState.errors.customerName && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.customerName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. 0812-3456-7890"
                {...form.register("phone")}
                className={cn(form.formState.errors.phone && "border-red-400")}
              />
              {form.formState.errors.phone && (
                <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery info */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Delivery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Input
                id="deliveryDate"
                type="date"
                min={todayString()}
                {...form.register("deliveryDate")}
                className={cn(form.formState.errors.deliveryDate && "border-red-400")}
              />
              {form.formState.errors.deliveryDate && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.deliveryDate.message}
                </p>
              )}
            </div>

            {isAdmin && (
            <div className="space-y-1.5">
              <Label htmlFor="deliveryAmount">Delivery Amount (IDR)</Label>
              <Input
                id="deliveryAmount"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                {...form.register("deliveryAmount", { valueAsNumber: true })}
                className={cn(form.formState.errors.deliveryAmount && "border-red-400")}
              />
              {form.formState.errors.deliveryAmount && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.deliveryAmount.message}
                </p>
              )}
            </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order lines */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">Order Lines</CardTitle>
            <div className="flex gap-2">
              {catalogLoading ? (
                <Skeleton className="h-9 w-36" />
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addLine("item")}
                    disabled={!items?.length}
                    className="gap-1.5"
                  >
                    <Package className="h-4 w-4" />
                    Add Item
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addLine("bundle")}
                    disabled={!bundles?.length}
                    className="gap-1.5"
                  >
                    <Boxes className="h-4 w-4" />
                    Add Bundle
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {form.formState.errors.lines?.root && (
            <p className="mb-3 text-sm text-red-500">
              {form.formState.errors.lines.root.message}
            </p>
          )}
          {/* Zod array-level error (min 1) */}
          {form.formState.errors.lines && !Array.isArray(form.formState.errors.lines) && (
            <p className="mb-3 text-sm text-red-500">Add at least one order line</p>
          )}

          {fields.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center border-2 border-dashed rounded-lg">
              <Info className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No order lines yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use the buttons above to add direct items or bundles
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <LineRow
                  key={field.id}
                  index={index}
                  form={form}
                  onRemove={() => remove(index)}
                  items={items}
                  bundles={bundles}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price summary */}
      {fields.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-5">
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">
                  Subtotal ({fields.length} line{fields.length !== 1 ? "s" : ""})
                </dt>
                <dd className="tabular-nums">{formatIDR(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="tabular-nums">{formatIDR(deliveryAmount)}</dd>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-semibold">
                <dt>Grand Total</dt>
                <dd className="tabular-nums text-forest">{formatIDR(grandTotal)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-1">
        <p>📦 <span className="font-medium">Delivery fee</span> will be confirmed by our admin via WhatsApp after your order is placed.</p>
        <p>🏷️ Any applicable <span className="font-medium">product discounts</span> will also be communicated via WhatsApp.</p>
      </div>
      <div className="flex justify-end gap-3 pb-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/orders")}
          disabled={createOrder.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createOrder.isPending} className="min-w-[120px]">
          {createOrder.isPending ? "Creating…" : "Create Order"}
        </Button>
      </div>
    </form>
  );
}
