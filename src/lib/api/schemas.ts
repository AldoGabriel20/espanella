/**
 * Zod schemas for raw backend response shapes.
 *
 * The backend has two naming conventions:
 * - Auth, invoice endpoints → snake_case (Go DTOs with json tags)
 * - Item, bundle, order, stock-movement endpoints → PascalCase (Go structs, no json tags)
 *
 * Each schema also provides the corresponding TypeScript type via z.infer.
 *
 * These types are INTERNAL to the lib/api layer. UI code consumes only
 * the normalized camelCase types exported from @/types.
 */

import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

const isoDateString = z.string().datetime({ offset: true }).or(z.string().min(1));
const orderStatusValues = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "done",
  "cancelled",
] as const;

// ─── Auth (snake_case) ────────────────────────────────────────────────────────

export const RawUserSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email: z.string().email(),
  role: z.enum(["user", "admin"]),
  created_at: isoDateString,
  updated_at: isoDateString,
});
export type RawUser = z.infer<typeof RawUserSchema>;

export const RawLoginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number().int().positive(),
});
export type RawLoginResponse = z.infer<typeof RawLoginResponseSchema>;

export const RawRefreshResponseSchema = RawLoginResponseSchema;
export type RawRefreshResponse = z.infer<typeof RawRefreshResponseSchema>;

// ─── Pagination envelope ─────────────────────────────────────────────────────

export function pagedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number().int().min(0),
    limit: z.number().int().min(0),
    offset: z.number().int().min(0),
  });
}

// ─── Items (PascalCase) ───────────────────────────────────────────────────────

export const RawItemMediaSchema = z.object({
  ID: z.string(),
  ItemID: z.string(),
  MediaType: z.enum(["image", "video"]),
  StorageBucket: z.string(),
  StoragePath: z.string(),
  PublicURL: z.string(),
  MIMEType: z.string(),
  FileSizeBytes: z.number(),
  Width: z.number().nullable().default(null),
  Height: z.number().nullable().default(null),
  DurationSeconds: z.number().nullable().default(null),
  AltText: z.string().nullable().default(null),
  SortOrder: z.number().int(),
  IsPrimary: z.boolean(),
  Status: z.enum(["pending", "ready", "failed", "deleted"]),
  CreatedAt: isoDateString,
  UpdatedAt: isoDateString,
});
export type RawItemMedia = z.infer<typeof RawItemMediaSchema>;

export const RawItemSchema = z.object({
  ID: z.string(),
  Name: z.string(),
  Description: z.string().nullable().default(null),
  Stock: z.number().int().min(0),
  ReservedStock: z.number().int().min(0),
  Unit: z.string(),
  Price: z.number().min(0).default(0),
  PrimaryImageURL: z.string().nullable().default(null),
  HasVideo: z.boolean().default(false),
  MediaCount: z.number().int().min(0).default(0),
  Media: z.array(RawItemMediaSchema).nullable().default([]),
  CreatedAt: isoDateString,
  UpdatedAt: isoDateString,
});
export type RawItem = z.infer<typeof RawItemSchema>;

export const RawItemListSchema = pagedResponseSchema(RawItemSchema);
export type RawItemList = z.infer<typeof RawItemListSchema>;

// ─── Bundles (PascalCase) ─────────────────────────────────────────────────────

export const RawBundleItemSchema = z.object({
  ID: z.string(),
  BundleID: z.string(),
  ItemID: z.string(),
  Quantity: z.number().int().min(1),
});
export type RawBundleItem = z.infer<typeof RawBundleItemSchema>;

export const RawBundleMediaSchema = z.object({
  ID: z.string(),
  BundleID: z.string(),
  MediaType: z.enum(["image", "video"]),
  StorageBucket: z.string(),
  StoragePath: z.string(),
  PublicURL: z.string(),
  MIMEType: z.string(),
  FileSizeBytes: z.number(),
  Width: z.number().nullable().default(null),
  Height: z.number().nullable().default(null),
  DurationSeconds: z.number().nullable().default(null),
  AltText: z.string().nullable().default(null),
  SortOrder: z.number().int(),
  IsPrimary: z.boolean(),
  Status: z.enum(["pending", "ready", "failed", "deleted"]),
  CreatedAt: isoDateString,
  UpdatedAt: isoDateString,
});
export type RawBundleMedia = z.infer<typeof RawBundleMediaSchema>;

export const RawBundleSchema = z.object({
  ID: z.string(),
  Name: z.string(),
  Description: z.string().nullable().default(null),
  Price: z.number().min(0).default(0),
  Stock: z.number().int().min(0).default(0),
  ReservedStock: z.number().int().min(0).default(0),
  PrimaryImageURL: z.string().nullable().default(null),
  HasVideo: z.boolean().default(false),
  MediaCount: z.number().int().min(0).default(0),
  Media: z.array(RawBundleMediaSchema).nullable().default([]),
  Items: z.array(RawBundleItemSchema).nullable().default([]),
  CreatedAt: isoDateString,
  UpdatedAt: isoDateString,
});
export type RawBundle = z.infer<typeof RawBundleSchema>;

export const RawBundleListSchema = pagedResponseSchema(RawBundleSchema);
export type RawBundleList = z.infer<typeof RawBundleListSchema>;

// ─── Orders (PascalCase) ──────────────────────────────────────────────────────

export const RawOrderItemSchema = z.object({
  ID: z.string(),
  OrderID: z.string(),
  ItemID: z.string().nullable().default(null),
  BundleID: z.string().nullable().default(null),
  LineName: z.string(),
  Quantity: z.number().int().min(1),
  UnitPrice: z.number().min(0),
  LineTotal: z.number().min(0),
});
export type RawOrderItem = z.infer<typeof RawOrderItemSchema>;

export const RawOrderSchema = z.object({
  ID: z.string(),
  CustomerName: z.string(),
  Phone: z.string(),
  DeliveryDate: isoDateString,
  DeliveryAmount: z.number().min(0),
  Status: z.enum(orderStatusValues),
  TotalPrice: z.number().min(0),
  InvoiceSignedURL: z.string().nullable().default(null),
  CreatedAt: isoDateString,
  Items: z.array(RawOrderItemSchema).nullable().default([]),
});
export type RawOrder = z.infer<typeof RawOrderSchema>;

export const RawOrderListSchema = pagedResponseSchema(RawOrderSchema);
export type RawOrderList = z.infer<typeof RawOrderListSchema>;

// ─── Invoice (snake_case) ─────────────────────────────────────────────────────

export const RawInvoiceSchema = z.object({
  invoice_url: z.string().url(),
  order_id: z.string(),
});
export type RawInvoice = z.infer<typeof RawInvoiceSchema>;

// ─── Stock movements (PascalCase) ────────────────────────────────────────────

export const RawStockMovementSchema = z.object({
  ID: z.string(),
  ItemID: z.string(),
  OrderID: z.string().nullable().default(null),
  Delta: z.number().int(),
  Reason: z.string(),
  CreatedAt: isoDateString,
});
export type RawStockMovement = z.infer<typeof RawStockMovementSchema>;

export const RawStockMovementListSchema = pagedResponseSchema(RawStockMovementSchema);
export type RawStockMovementList = z.infer<typeof RawStockMovementListSchema>;

// ─── Request body Zod schemas (for BFF route handler validation) ──────────────

export const LoginRequestSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const RegisterRequestSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const CreateItemRequestSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  price: z.number().min(0, "Price cannot be negative"),
});

export const UpdateItemRequestSchema = CreateItemRequestSchema.partial();

export const BundleItemInputSchema = z.object({
  item_id: z.string().min(1, "Item ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const CreateBundleRequestSchema = z.object({
  name: z.string().min(1, "Bundle name is required"),
  items: z
    .array(BundleItemInputSchema)
    .min(1, "Bundle must have at least one item"),
});

export const UpdateBundleRequestSchema = CreateBundleRequestSchema.partial();

export const OrderLineInputSchema = z
  .object({
    item_id: z.string().optional(),
    bundle_id: z.string().optional(),
    name: z.string().min(1, "Line name is required"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    unit_price: z.number().min(0, "Unit price cannot be negative"),
  })
  .refine(
    (data) => Boolean(data.item_id) !== Boolean(data.bundle_id),
    "Each order line must have exactly one of item_id or bundle_id"
  );

export const CreateOrderRequestSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(1, "Phone is required"),
  delivery_date: z.string().min(1, "Delivery date is required"),
  delivery_amount: z.number().min(0, "Delivery amount cannot be negative"),
  items: z.array(OrderLineInputSchema).min(1, "Order must have at least one line"),
});

export const UpdateOrderStatusRequestSchema = z.object({
  status: z.enum(orderStatusValues, "Invalid order status"),
});

// ─── Admin Summary (snake_case) ───────────────────────────────────────────────

export const RawAdminSummarySchema = z.object({
  total_items: z.number().int().min(0),
  total_bundles: z.number().int().min(0),
  total_orders: z.number().int().min(0),
  pending_orders: z.number().int().min(0),
  low_stock_items: z.number().int().min(0),
  low_stock_threshold: z.number().int().min(0),
});
export type RawAdminSummary = z.infer<typeof RawAdminSummarySchema>;

// ─── Notification logs (PascalCase) ──────────────────────────────────────────

const notificationStatusValues = ["pending", "sent", "failed", "skipped"] as const;

export const RawNotificationLogSchema = z.object({
  ID: z.string(),
  OrderID: z.string().nullable().default(null),
  ItemID: z.string().nullable().default(null),
  Channel: z.string(),
  NotificationType: z.string(),
  ScheduledFor: isoDateString,
  Recipient: z.string(),
  Status: z.enum(notificationStatusValues),
  ProviderMessageID: z.string().nullable().default(null),
  ProviderName: z.string().nullable().default(null),
  ErrorMessage: z.string().nullable().default(null),
  SentAt: z.string().nullable().default(null),
  CreatedAt: isoDateString,
  UpdatedAt: isoDateString,
});
export type RawNotificationLog = z.infer<typeof RawNotificationLogSchema>;

export const RawNotificationListSchema = pagedResponseSchema(RawNotificationLogSchema);
export type RawNotificationList = z.infer<typeof RawNotificationListSchema>;

export { orderStatusValues, notificationStatusValues };

// ─── Fulfillment batches (PascalCase — no json tags on domain structs) ────────

const batchStatusValues = ["draft", "in_progress", "completed", "cancelled"] as const;
const batchComplexityValues = ["light", "medium", "heavy"] as const;

export const RawBatchItemSnapshotSchema = z.object({
  ID: z.string(),
  BatchID: z.string(),
  ItemID: z.string(),
  ItemName: z.string(),
  RequiredQuantity: z.number().int().min(1),
  CreatedAt: isoDateString,
});
export type RawBatchItemSnapshot = z.infer<typeof RawBatchItemSnapshotSchema>;

export const RawFulfillmentBatchOrderSchema = z.object({
  ID: z.string(),
  BatchID: z.string(),
  OrderID: z.string(),
  SortOrder: z.number().int().min(0),
  CreatedAt: isoDateString,
  Order: z.lazy(() => RawOrderSchema).nullable().default(null),
});
export type RawFulfillmentBatchOrder = z.infer<typeof RawFulfillmentBatchOrderSchema>;

export const RawFulfillmentBatchSchema = z.object({
  ID: z.string(),
  BatchDate: isoDateString,
  Name: z.string(),
  Status: z.enum(batchStatusValues),
  RecommendationScore: z.number().min(0).max(100),
  RationaleSummary: z.string(),
  TotalOrders: z.number().int().min(0),
  TotalUnits: z.number().int().min(0),
  CreatedAt: isoDateString,
  UpdatedAt: isoDateString,
  Orders: z.array(RawFulfillmentBatchOrderSchema).nullable().default([]),
  Items: z.array(RawBatchItemSnapshotSchema).nullable().default([]),
});
export type RawFulfillmentBatch = z.infer<typeof RawFulfillmentBatchSchema>;

export const RawFulfillmentBatchListSchema = pagedResponseSchema(RawFulfillmentBatchSchema);
export type RawFulfillmentBatchList = z.infer<typeof RawFulfillmentBatchListSchema>;

export const RawAggregatedPickItemSchema = z.object({
  ItemID: z.string(),
  ItemName: z.string(),
  RequiredQuantity: z.number().int().min(0),
});
export type RawAggregatedPickItem = z.infer<typeof RawAggregatedPickItemSchema>;

export const RawBatchRecommendationSchema = z.object({
  BatchKey: z.string(),
  DeliveryDate: isoDateString,
  RecommendationScore: z.number().min(0).max(100),
  RationaleSummary: z.string(),
  Orders: z.array(RawOrderSchema).nullable().default([]),
  AggregatedItems: z.array(RawAggregatedPickItemSchema).nullable().default([]),
  TotalOrders: z.number().int().min(0),
  TotalUnits: z.number().int().min(0),
  ComplexityLevel: z.enum(batchComplexityValues).default("light"),
  Warnings: z.array(z.string()).nullable().default([]),
});
export type RawBatchRecommendation = z.infer<typeof RawBatchRecommendationSchema>;

export const RawRecommendationsResponseSchema = z.object({
  data: z.array(RawBatchRecommendationSchema),
  total: z.number().int().min(0),
});
export type RawRecommendationsResponse = z.infer<typeof RawRecommendationsResponseSchema>;

export { batchStatusValues, batchComplexityValues };
