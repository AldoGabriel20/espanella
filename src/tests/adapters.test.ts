/**
 * Unit tests for the adapter layer.
 *
 * These tests verify that raw backend responses (PascalCase and snake_case)
 * are correctly normalized into the frontend's camelCase model types,
 * and that computed fields like availableStock are correct.
 */

import { describe, it, expect } from "vitest";
import {
  adaptUser,
  adaptItem,
  adaptItemList,
  adaptBundle,
  adaptBundleItem,
  adaptOrder,
  adaptOrderItem,
  adaptInvoice,
  adaptStockMovement,
  joinBundleItemNames,
  buildItemMap,
} from "@/lib/api/adapters";
import type { RawItem, RawBundle, RawOrder } from "@/lib/api/schemas";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NOW = "2026-01-15T10:00:00+07:00";

const rawUser = {
  id: "u1",
  full_name: "Aldo Gabriel",
  email: "aldo@leuzien.id",
  role: "admin" as const,
  created_at: NOW,
  updated_at: NOW,
};

const rawItem: RawItem = {
  ID: "item-1",
  Name: "Premium Dates",
  Stock: 100,
  ReservedStock: 30,
  Unit: "box",
  Price: 150000,
  PrimaryImageURL: null,
  HasVideo: false,
  MediaCount: 0,
  Media: [],
  CreatedAt: NOW,
  UpdatedAt: NOW,
};

const rawItemOversold: RawItem = {
  ...rawItem,
  ID: "item-oversold",
  Stock: 10,
  ReservedStock: 15,
};

const rawBundleItem = {
  ID: "bi-1",
  BundleID: "bundle-1",
  ItemID: "item-1",
  Quantity: 3,
};

const rawBundle: RawBundle = {
  ID: "bundle-1",
  Name: "Classic Hamper",
  Items: [rawBundleItem],
  CreatedAt: NOW,
};

const rawBundleNullItems: RawBundle = {
  ...rawBundle,
  ID: "bundle-null",
  Items: null as unknown as typeof rawBundle.Items,
};

const rawOrderItem = {
  ID: "oi-1",
  OrderID: "order-1",
  ItemID: "item-1",
  BundleID: null,
  LineName: "Premium Dates Box",
  Quantity: 2,
  UnitPrice: 150000,
  LineTotal: 300000,
};

const rawOrder: RawOrder = {
  ID: "order-1",
  CustomerName: "Budi Santoso",
  Phone: "08123456789",
  DeliveryDate: "2026-02-14T00:00:00+07:00",
  DeliveryAmount: 50000,
  Status: "pending",
  TotalPrice: 350000,
  InvoiceSignedURL: "https://storage.example.com/invoice-1.pdf",
  CreatedAt: NOW,
  Items: [rawOrderItem],
};

const rawOrderEmptyInvoice: RawOrder = {
  ...rawOrder,
  ID: "order-empty-inv",
  InvoiceSignedURL: "",
};

const rawOrderNullInvoice: RawOrder = {
  ...rawOrder,
  ID: "order-null-inv",
  InvoiceSignedURL: null,
};

const rawOrderNullItems: RawOrder = {
  ...rawOrder,
  ID: "order-null-items",
  Items: null as unknown as typeof rawOrder.Items,
};

// ─── adaptUser ────────────────────────────────────────────────────────────────

describe("adaptUser", () => {
  it("maps snake_case fields to camelCase", () => {
    const user = adaptUser(rawUser);
    expect(user).toEqual({
      id: "u1",
      name: "Aldo Gabriel",
      email: "aldo@leuzien.id",
      role: "admin",
      createdAt: NOW,
      updatedAt: NOW,
    });
  });
});

// ─── adaptItem ────────────────────────────────────────────────────────────────

describe("adaptItem", () => {
  it("maps PascalCase fields to camelCase", () => {
    const item = adaptItem(rawItem);
    expect(item.id).toBe("item-1");
    expect(item.name).toBe("Premium Dates");
    expect(item.unit).toBe("box");
    expect(item.createdAt).toBe(NOW);
    expect(item.updatedAt).toBe(NOW);
  });

  it("computes availableStock = stock - reservedStock", () => {
    const item = adaptItem(rawItem);
    expect(item.stock).toBe(100);
    expect(item.reservedStock).toBe(30);
    expect(item.availableStock).toBe(70);
  });

  it("clamps availableStock to 0 when reservedStock exceeds stock", () => {
    const item = adaptItem(rawItemOversold);
    expect(item.availableStock).toBe(0);
  });

  it("adaptItemList maps over an array", () => {
    const items = adaptItemList([rawItem, rawItemOversold]);
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe("item-1");
    expect(items[1].id).toBe("item-oversold");
  });
});

// ─── adaptBundle ──────────────────────────────────────────────────────────────

describe("adaptBundle", () => {
  it("maps PascalCase bundle fields to camelCase", () => {
    const bundle = adaptBundle(rawBundle);
    expect(bundle.id).toBe("bundle-1");
    expect(bundle.name).toBe("Classic Hamper");
    expect(bundle.items).toHaveLength(1);
  });

  it("adapts bundle items correctly", () => {
    const bundle = adaptBundle(rawBundle);
    expect(bundle.items[0]).toEqual({
      id: "bi-1",
      bundleId: "bundle-1",
      itemId: "item-1",
      quantity: 3,
    });
  });

  it("handles null Items array gracefully", () => {
    const bundle = adaptBundle(rawBundleNullItems);
    expect(bundle.items).toEqual([]);
  });

  it("adaptBundleItem maps single item", () => {
    const bi = adaptBundleItem(rawBundleItem);
    expect(bi).toEqual({
      id: "bi-1",
      bundleId: "bundle-1",
      itemId: "item-1",
      quantity: 3,
    });
  });
});

// ─── adaptOrder ───────────────────────────────────────────────────────────────

describe("adaptOrder", () => {
  it("maps PascalCase order fields to camelCase", () => {
    const order = adaptOrder(rawOrder);
    expect(order.id).toBe("order-1");
    expect(order.customerName).toBe("Budi Santoso");
    expect(order.phone).toBe("08123456789");
    expect(order.status).toBe("pending");
    expect(order.totalPrice).toBe(350000);
    expect(order.deliveryAmount).toBe(50000);
  });

  it("preserves non-empty invoice URL", () => {
    const order = adaptOrder(rawOrder);
    expect(order.invoiceSignedUrl).toBe(
      "https://storage.example.com/invoice-1.pdf"
    );
  });

  it("normalizes empty string invoice URL to null", () => {
    const order = adaptOrder(rawOrderEmptyInvoice);
    expect(order.invoiceSignedUrl).toBeNull();
  });

  it("normalizes null invoice URL to null", () => {
    const order = adaptOrder(rawOrderNullInvoice);
    expect(order.invoiceSignedUrl).toBeNull();
  });

  it("handles null Items array gracefully", () => {
    const order = adaptOrder(rawOrderNullItems);
    expect(order.items).toEqual([]);
  });

  it("adapts order items correctly", () => {
    const order = adaptOrder(rawOrder);
    expect(order.items[0]).toMatchObject({
      id: "oi-1",
      orderId: "order-1",
      itemId: "item-1",
      bundleId: null,
      name: "Premium Dates Box",
      quantity: 2,
      unitPrice: 150000,
      totalPrice: 300000,
    });
  });
});

describe("adaptOrderItem", () => {
  it("maps bundle line with null itemId", () => {
    const bundleLine = {
      ...rawOrderItem,
      ID: "oi-bundle",
      ItemID: null,
      BundleID: "bundle-1",
    };
    const item = adaptOrderItem(bundleLine);
    expect(item.itemId).toBeNull();
    expect(item.bundleId).toBe("bundle-1");
  });
});

// ─── adaptInvoice ─────────────────────────────────────────────────────────────

describe("adaptInvoice", () => {
  it("maps snake_case invoice fields to camelCase", () => {
    const raw = {
      invoice_url: "https://storage.example.com/invoice.pdf",
      order_id: "order-1",
    };
    const invoice = adaptInvoice(raw);
    expect(invoice).toEqual({
      invoiceUrl: "https://storage.example.com/invoice.pdf",
      orderId: "order-1",
    });
  });
});

// ─── adaptStockMovement ───────────────────────────────────────────────────────

describe("adaptStockMovement", () => {
  it("maps PascalCase movement fields to camelCase", () => {
    const raw = {
      ID: "sm-1",
      ItemID: "item-1",
      OrderID: "order-1",
      Delta: -5,
      Reason: "order_reserved",
      CreatedAt: NOW,
    };
    const movement = adaptStockMovement(raw);
    expect(movement).toEqual({
      id: "sm-1",
      itemId: "item-1",
      orderId: "order-1",
      delta: -5,
      reason: "order_reserved",
      createdAt: NOW,
    });
  });

  it("handles null orderId", () => {
    const raw = {
      ID: "sm-2",
      ItemID: "item-1",
      OrderID: null,
      Delta: 50,
      Reason: "manual_adjustment",
      CreatedAt: NOW,
    };
    const movement = adaptStockMovement(raw);
    expect(movement.orderId).toBeNull();
  });
});

// ─── joinBundleItemNames ──────────────────────────────────────────────────────

describe("joinBundleItemNames", () => {
  const bundle = adaptBundle(rawBundle);
  const items = adaptItemList([rawItem]);
  const itemMap = buildItemMap(items);

  it("enriches bundle items with resolved item names", () => {
    const enriched = joinBundleItemNames(bundle, itemMap);
    expect(enriched.items[0].itemName).toBe("Premium Dates");
  });

  it("falls back to itemId when item is not found in catalog", () => {
    const enriched = joinBundleItemNames(bundle, new Map());
    expect(enriched.items[0].itemName).toBe("item-1");
  });

  it("preserves all bundle fields", () => {
    const enriched = joinBundleItemNames(bundle, itemMap);
    expect(enriched.id).toBe(bundle.id);
    expect(enriched.name).toBe(bundle.name);
    expect(enriched.createdAt).toBe(bundle.createdAt);
  });
});

// ─── buildItemMap ─────────────────────────────────────────────────────────────

describe("buildItemMap", () => {
  it("builds a map keyed by item id", () => {
    const items = adaptItemList([rawItem]);
    const map = buildItemMap(items);
    expect(map.size).toBe(1);
    expect(map.get("item-1")?.name).toBe("Premium Dates");
  });

  it("returns empty map for empty array", () => {
    expect(buildItemMap([]).size).toBe(0);
  });
});
