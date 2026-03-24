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
  RawBundleItem,
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
  BundleItem,
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

export function adaptItem(raw: RawItem): Item {
  const stock = raw.Stock;
  const reservedStock = raw.ReservedStock;
  return {
    id: raw.ID,
    name: raw.Name,
    stock,
    reservedStock,
    availableStock: Math.max(0, stock - reservedStock),
    unit: raw.Unit,
    price: raw.Price ?? 0,
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

export function adaptBundle(raw: RawBundle): Bundle {
  return {
    id: raw.ID,
    name: raw.Name,
    items: (raw.Items ?? []).map(adaptBundleItem),
    createdAt: raw.CreatedAt,
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
