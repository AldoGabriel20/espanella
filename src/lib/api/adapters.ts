/**
 * Adapter layer — converts raw backend responses into normalized camelCase types.
 *
 * This is the ONLY place that knows about the backend's mixed casing conventions.
 * All upstream consumers (pages, hooks, components) receive normalized types only.
 *
 * Mapping summary:
 * - Auth/invoice responses are snake_case → adapt with snake_to_camel field mapping
 * - Item/bundle/order/stock responses are PascalCase → adapt with Pascal_to_camel field mapping
 * - availableStock is computed here: stock - reservedStock
 * - Bundle items NULL guard: backend may return null for the Items array
 * - Invoice URL NULL guard: InvoiceSignedURL may be empty string or null
 */

import type {
  RawUser,
  RawItem,
  RawItemMedia,
  RawBundleItem,
  RawBundleMedia,
  RawBundle,
  RawOrderItem,
  RawOrder,
  RawInvoice,
  RawStockMovement,
  RawAdminSummary,
  RawNotificationLog,
} from "./schemas";

import type {
  User,
  Item,
  ItemMedia,
  BundleItem,
  BundleMedia,
  Bundle,
  OrderItem,
  Order,
  StockMovement,
  AdminSummary,
  NotificationLog,
} from "@/types";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function adaptUser(raw: RawUser): User {
  return {
    id: raw.id,
    name: raw.full_name,
    email: raw.email,
    role: raw.role,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ─── Items ────────────────────────────────────────────────────────────────────

export function adaptItemMedia(raw: RawItemMedia): ItemMedia {
  return {
    id: raw.ID,
    itemId: raw.ItemID,
    mediaType: raw.MediaType,
    storageBucket: raw.StorageBucket,
    storagePath: raw.StoragePath,
    url: raw.PublicURL,
    mimeType: raw.MIMEType,
    fileSizeBytes: raw.FileSizeBytes,
    width: raw.Width,
    height: raw.Height,
    durationSeconds: raw.DurationSeconds,
    altText: raw.AltText,
    sortOrder: raw.SortOrder,
    isPrimary: raw.IsPrimary,
    status: raw.Status,
    createdAt: raw.CreatedAt,
    updatedAt: raw.UpdatedAt,
  };
}

export function adaptItem(raw: RawItem): Item {
  const stock = raw.Stock;
  const reservedStock = raw.ReservedStock;
  return {
    id: raw.ID,
    name: raw.Name,
    description: raw.Description ?? null,
    stock,
    reservedStock,
    availableStock: Math.max(0, stock - reservedStock),
    unit: raw.Unit,
    price: raw.Price ?? 0,
    primaryImageUrl: raw.PrimaryImageURL ?? null,
    hasVideo: raw.HasVideo ?? false,
    mediaCount: raw.MediaCount ?? 0,
    media: (raw.Media ?? []).map(adaptItemMedia),
    createdAt: raw.CreatedAt,
    updatedAt: raw.UpdatedAt,
  };
}

export function adaptItemList(raws: RawItem[]): Item[] {
  return raws.map(adaptItem);
}

// ─── Bundles ──────────────────────────────────────────────────────────────────

export function adaptBundleItem(raw: RawBundleItem): BundleItem {
  return {
    id: raw.ID,
    bundleId: raw.BundleID,
    itemId: raw.ItemID,
    quantity: raw.Quantity,
  };
}

export function adaptBundleMedia(raw: RawBundleMedia): BundleMedia {
  return {
    id: raw.ID,
    bundleId: raw.BundleID,
    mediaType: raw.MediaType,
    storageBucket: raw.StorageBucket,
    storagePath: raw.StoragePath,
    url: raw.PublicURL,
    mimeType: raw.MIMEType,
    fileSizeBytes: raw.FileSizeBytes,
    width: raw.Width,
    height: raw.Height,
    durationSeconds: raw.DurationSeconds,
    altText: raw.AltText,
    sortOrder: raw.SortOrder,
    isPrimary: raw.IsPrimary,
    status: raw.Status,
    createdAt: raw.CreatedAt,
    updatedAt: raw.UpdatedAt,
  };
}

export function adaptBundle(raw: RawBundle): Bundle {
  const stock = raw.Stock ?? 0;
  const reservedStock = raw.ReservedStock ?? 0;
  return {
    id: raw.ID,
    name: raw.Name,
    description: raw.Description ?? null,
    price: raw.Price ?? 0,
    stock,
    reservedStock,
    availableStock: Math.max(0, stock - reservedStock),
    primaryImageUrl: raw.PrimaryImageURL ?? null,
    hasVideo: raw.HasVideo ?? false,
    mediaCount: raw.MediaCount ?? 0,
    media: (raw.Media ?? []).map(adaptBundleMedia),
    items: (raw.Items ?? []).map(adaptBundleItem),
    createdAt: raw.CreatedAt,
    updatedAt: raw.UpdatedAt,
  };
}

export function adaptBundleList(raws: RawBundle[]): Bundle[] {
  return raws.map(adaptBundle);
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function adaptOrderItem(raw: RawOrderItem): OrderItem {
  return {
    id: raw.ID,
    orderId: raw.OrderID,
    itemId: raw.ItemID,
    bundleId: raw.BundleID,
    name: raw.LineName,
    quantity: raw.Quantity,
    unitPrice: raw.UnitPrice,
    totalPrice: raw.LineTotal,
  };
}

export function adaptOrder(raw: RawOrder): Order {
  // Normalize invoice URL: empty string → null
  const invoiceSignedUrl =
    raw.InvoiceSignedURL && raw.InvoiceSignedURL.trim().length > 0
      ? raw.InvoiceSignedURL
      : null;

  return {
    id: raw.ID,
    customerName: raw.CustomerName,
    phone: raw.Phone,
    deliveryDate: raw.DeliveryDate,
    deliveryAmount: raw.DeliveryAmount,
    status: raw.Status,
    totalPrice: raw.TotalPrice,
    invoiceSignedUrl,
    createdAt: raw.CreatedAt,
    items: (raw.Items ?? []).map(adaptOrderItem),
  };
}

export function adaptOrderList(raws: RawOrder[]): Order[] {
  return raws.map(adaptOrder);
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export type Invoice = {
  orderId: string;
  invoiceUrl: string;
};

export function adaptInvoice(raw: RawInvoice): Invoice {
  return {
    orderId: raw.order_id,
    invoiceUrl: raw.invoice_url,
  };
}

// ─── Stock movements ──────────────────────────────────────────────────────────

export function adaptStockMovement(raw: RawStockMovement): StockMovement {
  return {
    id: raw.ID,
    itemId: raw.ItemID,
    orderId: raw.OrderID,
    delta: raw.Delta,
    reason: raw.Reason,
    createdAt: raw.CreatedAt,
  };
}

// ─── Admin Summary ────────────────────────────────────────────────────────────

export function adaptAdminSummary(raw: RawAdminSummary): AdminSummary {
  return {
    totalItems: raw.total_items,
    totalBundles: raw.total_bundles,
    totalOrders: raw.total_orders,
    pendingOrders: raw.pending_orders,
    lowStockItems: raw.low_stock_items,
    lowStockThreshold: raw.low_stock_threshold,
  };
}

// ─── Notification Logs ────────────────────────────────────────────────────────

export function adaptNotificationLog(raw: RawNotificationLog): NotificationLog {
  return {
    id: raw.ID,
    orderId: raw.OrderID,
    itemId: raw.ItemID,
    channel: raw.Channel,
    notificationType: raw.NotificationType,
    scheduledFor: raw.ScheduledFor,
    recipient: raw.Recipient,
    status: raw.Status,
    providerMessageId: raw.ProviderMessageID,
    providerName: raw.ProviderName,
    errorMessage: raw.ErrorMessage,
    sentAt: raw.SentAt ?? null,
    createdAt: raw.CreatedAt,
    updatedAt: raw.UpdatedAt,
  };
}

export function adaptNotificationList(raws: RawNotificationLog[]): NotificationLog[] {
  return raws.map(adaptNotificationLog);
}

export function adaptStockMovementList(
  raws: RawStockMovement[]
): StockMovement[] {
  return raws.map(adaptStockMovement);
}

// ─── Bundle composition join ───────────────────────────────────────────────────

/**
 * Enriches a bundle's items with the resolved item name from the catalog.
 * Call this after both bundle and item catalog data are available.
 */
export type BundleItemWithName = BundleItem & { itemName: string };

export type BundleWithNames = Omit<Bundle, "items"> & {
  items: BundleItemWithName[];
};

export function joinBundleItemNames(
  bundle: Bundle,
  itemMap: Map<string, Item>
): BundleWithNames {
  return {
    ...bundle,
    items: bundle.items.map((bi) => ({
      ...bi,
      itemName: itemMap.get(bi.itemId)?.name ?? bi.itemId,
    })),
  };
}

/**
 * Build a lookup map from a list of items. Useful for bundle-name joins.
 */
export function buildItemMap(items: Item[]): Map<string, Item> {
  return new Map(items.map((item) => [item.id, item]));
}

// ─── Fulfillment batches ──────────────────────────────────────────────────────

import type {
  RawBatchItemSnapshot,
  RawFulfillmentBatchOrder,
  RawFulfillmentBatch,
  RawAggregatedPickItem,
  RawBatchRecommendation,
  RawRecommendationsResponse,
} from "./schemas";

import type {
  BatchItemSnapshot,
  FulfillmentBatchOrder,
  FulfillmentBatch,
  AggregatedPickItem,
  BatchRecommendation,
  RecommendationsResponse,
} from "@/types";

export function adaptBatchItemSnapshot(raw: RawBatchItemSnapshot): BatchItemSnapshot {
  return {
    id: raw.ID,
    batchId: raw.BatchID,
    itemId: raw.ItemID,
    itemName: raw.ItemName,
    requiredQuantity: raw.RequiredQuantity,
    createdAt: raw.CreatedAt,
  };
}

export function adaptFulfillmentBatchOrder(raw: RawFulfillmentBatchOrder): FulfillmentBatchOrder {
  return {
    id: raw.ID,
    batchId: raw.BatchID,
    orderId: raw.OrderID,
    sortOrder: raw.SortOrder,
    createdAt: raw.CreatedAt,
    order: raw.Order ? adaptOrder(raw.Order) : null,
  };
}

export function adaptFulfillmentBatch(raw: RawFulfillmentBatch): FulfillmentBatch {
  return {
    id: raw.ID,
    batchDate: raw.BatchDate,
    name: raw.Name,
    status: raw.Status,
    recommendationScore: raw.RecommendationScore,
    rationaleSummary: raw.RationaleSummary,
    totalOrders: raw.TotalOrders,
    totalUnits: raw.TotalUnits,
    createdAt: raw.CreatedAt,
    updatedAt: raw.UpdatedAt,
    orders: (raw.Orders ?? []).map(adaptFulfillmentBatchOrder),
    items: (raw.Items ?? []).map(adaptBatchItemSnapshot),
  };
}

export function adaptFulfillmentBatchList(raws: RawFulfillmentBatch[]): FulfillmentBatch[] {
  return raws.map(adaptFulfillmentBatch);
}

export function adaptAggregatedPickItem(raw: RawAggregatedPickItem): AggregatedPickItem {
  return {
    itemId: raw.ItemID,
    itemName: raw.ItemName,
    requiredQuantity: raw.RequiredQuantity,
  };
}

export function adaptBatchRecommendation(raw: RawBatchRecommendation): BatchRecommendation {
  return {
    batchKey: raw.BatchKey,
    deliveryDate: raw.DeliveryDate,
    recommendationScore: raw.RecommendationScore,
    rationaleSummary: raw.RationaleSummary,
    orders: (raw.Orders ?? []).map(adaptOrder),
    aggregatedItems: (raw.AggregatedItems ?? []).map(adaptAggregatedPickItem),
    totalOrders: raw.TotalOrders,
    totalUnits: raw.TotalUnits,
    complexityLevel: raw.ComplexityLevel,
    warnings: raw.Warnings ?? [],
  };
}

export function adaptRecommendationsResponse(raw: RawRecommendationsResponse): RecommendationsResponse {
  return {
    data: raw.data.map(adaptBatchRecommendation),
    total: raw.total,
  };
}
