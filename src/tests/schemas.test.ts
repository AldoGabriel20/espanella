/**
 * Unit tests for Zod request/response schemas.
 *
 * Focuses on edge cases and custom validation (.refine, enum constraints,
 * numeric boundaries) that may not be immediately obvious from inspection.
 */

import { describe, it, expect } from "vitest";
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  CreateItemRequestSchema,
  UpdateItemRequestSchema,
  BundleItemInputSchema,
  CreateBundleRequestSchema,
  OrderLineInputSchema,
  CreateOrderRequestSchema,
  UpdateOrderStatusRequestSchema,
  RawItemSchema,
  RawBundleItemSchema,
  RawOrderSchema,
  RawInvoiceSchema,
} from "@/lib/api/schemas";

// ─── Helper ───────────────────────────────────────────────────────────────────

function valid<T>(schema: { safeParse: (d: unknown) => { success: boolean; data?: T } }, data: unknown): T {
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);
  return (result as { success: true; data: T }).data;
}

function invalid(schema: { safeParse: (d: unknown) => { success: boolean } }, data: unknown) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
}

// ─── LoginRequestSchema ───────────────────────────────────────────────────────

describe("LoginRequestSchema", () => {
  it("accepts valid credentials", () => {
    valid(LoginRequestSchema, { email: "user@example.com", password: "password123" });
  });

  it("rejects malformed email", () => {
    invalid(LoginRequestSchema, { email: "not-an-email", password: "password123" });
  });

  it("rejects password shorter than 8 chars", () => {
    invalid(LoginRequestSchema, { email: "user@example.com", password: "short" });
  });

  it("accepts password of exactly 8 chars", () => {
    valid(LoginRequestSchema, { email: "user@example.com", password: "12345678" });
  });
});

// ─── RegisterRequestSchema ────────────────────────────────────────────────────

describe("RegisterRequestSchema", () => {
  it("accepts valid registration data", () => {
    valid(RegisterRequestSchema, {
      name: "Aldo Gabriel",
      email: "aldo@leuzien.id",
      password: "securepass",
    });
  });

  it("rejects empty name", () => {
    invalid(RegisterRequestSchema, { name: "", email: "a@b.com", password: "pass1234" });
  });

  it("rejects missing name field", () => {
    invalid(RegisterRequestSchema, { email: "a@b.com", password: "pass1234" });
  });
});

// ─── CreateItemRequestSchema ──────────────────────────────────────────────────

describe("CreateItemRequestSchema", () => {
  it("accepts valid item data", () => {
    valid(CreateItemRequestSchema, { name: "Premium Dates", stock: 100, unit: "box" });
  });

  it("accepts zero stock", () => {
    valid(CreateItemRequestSchema, { name: "New Item", stock: 0, unit: "kg" });
  });

  it("rejects negative stock", () => {
    invalid(CreateItemRequestSchema, { name: "Bad Item", stock: -1, unit: "kg" });
  });

  it("rejects empty name", () => {
    invalid(CreateItemRequestSchema, { name: "", stock: 10, unit: "kg" });
  });

  it("rejects empty unit", () => {
    invalid(CreateItemRequestSchema, { name: "Item", stock: 0, unit: "" });
  });
});

// ─── UpdateItemRequestSchema ──────────────────────────────────────────────────

describe("UpdateItemRequestSchema", () => {
  it("accepts partial updates — only name", () => {
    valid(UpdateItemRequestSchema, { name: "Updated Name" });
  });

  it("accepts partial updates — only stock", () => {
    valid(UpdateItemRequestSchema, { stock: 50 });
  });

  it("accepts empty object (no-op patch)", () => {
    valid(UpdateItemRequestSchema, {});
  });

  it("still rejects negative stock in partial update", () => {
    invalid(UpdateItemRequestSchema, { stock: -5 });
  });
});

// ─── BundleItemInputSchema ────────────────────────────────────────────────────

describe("BundleItemInputSchema", () => {
  it("accepts valid bundle item", () => {
    valid(BundleItemInputSchema, { item_id: "item-1", quantity: 3 });
  });

  it("rejects quantity of 0", () => {
    invalid(BundleItemInputSchema, { item_id: "item-1", quantity: 0 });
  });

  it("rejects negative quantity", () => {
    invalid(BundleItemInputSchema, { item_id: "item-1", quantity: -1 });
  });

  it("rejects empty item_id", () => {
    invalid(BundleItemInputSchema, { item_id: "", quantity: 2 });
  });
});

// ─── CreateBundleRequestSchema ────────────────────────────────────────────────

describe("CreateBundleRequestSchema", () => {
  const validItem = { item_id: "item-1", quantity: 2 };

  it("accepts valid bundle", () => {
    valid(CreateBundleRequestSchema, { name: "Hamper A", items: [validItem] });
  });

  it("rejects empty items array", () => {
    invalid(CreateBundleRequestSchema, { name: "Empty Bundle", items: [] });
  });

  it("rejects empty bundle name", () => {
    invalid(CreateBundleRequestSchema, { name: "", items: [validItem] });
  });
});

// ─── OrderLineInputSchema (.refine XOR) ───────────────────────────────────────

describe("OrderLineInputSchema", () => {
  const base = { name: "Premium Dates", quantity: 2, unit_price: 50000 };

  it("accepts line with only item_id", () => {
    valid(OrderLineInputSchema, { ...base, item_id: "item-1" });
  });

  it("accepts line with only bundle_id", () => {
    valid(OrderLineInputSchema, { ...base, bundle_id: "bundle-1" });
  });

  it("rejects line with both item_id and bundle_id", () => {
    invalid(OrderLineInputSchema, { ...base, item_id: "item-1", bundle_id: "bundle-1" });
  });

  it("rejects line with neither item_id nor bundle_id", () => {
    invalid(OrderLineInputSchema, { ...base });
  });

  it("rejects line with empty string item_id (treated as falsy)", () => {
    // empty string is falsy — same as not providing it
    invalid(OrderLineInputSchema, { ...base, item_id: "" });
  });

  it("rejects negative unit_price", () => {
    invalid(OrderLineInputSchema, { ...base, item_id: "item-1", unit_price: -100 });
  });

  it("rejects quantity less than 1", () => {
    invalid(OrderLineInputSchema, { ...base, item_id: "item-1", quantity: 0 });
  });
});

// ─── CreateOrderRequestSchema ─────────────────────────────────────────────────

describe("CreateOrderRequestSchema", () => {
  const validLine = { item_id: "item-1", name: "Dates", quantity: 1, unit_price: 50000 };

  it("accepts valid order", () => {
    valid(CreateOrderRequestSchema, {
      customer_name: "Budi",
      phone: "081234567890",
      delivery_date: "2026-02-14",
      delivery_amount: 20000,
      items: [validLine],
    });
  });

  it("rejects empty items array", () => {
    invalid(CreateOrderRequestSchema, {
      customer_name: "Budi",
      phone: "081234567890",
      delivery_date: "2026-02-14",
      delivery_amount: 0,
      items: [],
    });
  });

  it("rejects missing customer_name", () => {
    invalid(CreateOrderRequestSchema, {
      customer_name: "",
      phone: "081234567890",
      delivery_date: "2026-02-14",
      delivery_amount: 0,
      items: [validLine],
    });
  });

  it("rejects negative delivery_amount", () => {
    invalid(CreateOrderRequestSchema, {
      customer_name: "Budi",
      phone: "081234567890",
      delivery_date: "2026-02-14",
      delivery_amount: -1,
      items: [validLine],
    });
  });
});

// ─── UpdateOrderStatusRequestSchema ──────────────────────────────────────────

describe("UpdateOrderStatusRequestSchema", () => {
  const validStatuses = ["pending", "confirmed", "packed", "shipped", "done", "cancelled"];

  it.each(validStatuses)("accepts status: %s", (status) => {
    valid(UpdateOrderStatusRequestSchema, { status });
  });

  it("rejects unknown status", () => {
    invalid(UpdateOrderStatusRequestSchema, { status: "processing" });
  });

  it("rejects missing status field", () => {
    invalid(UpdateOrderStatusRequestSchema, {});
  });
});

// ─── RawItemSchema (response validation) ─────────────────────────────────────

describe("RawItemSchema", () => {
  const baseItem = {
    ID: "item-1",
    Name: "Dates",
    Stock: 100,
    ReservedStock: 20,
    Unit: "box",
    CreatedAt: "2026-01-01T00:00:00+07:00",
    UpdatedAt: "2026-01-01T00:00:00+07:00",
  };

  it("accepts valid raw item", () => {
    valid(RawItemSchema, baseItem);
  });

  it("rejects negative Stock", () => {
    invalid(RawItemSchema, { ...baseItem, Stock: -1 });
  });

  it("rejects negative ReservedStock", () => {
    invalid(RawItemSchema, { ...baseItem, ReservedStock: -1 });
  });

  it("accepts zero Stock", () => {
    valid(RawItemSchema, { ...baseItem, Stock: 0, ReservedStock: 0 });
  });
});

// ─── RawBundleItemSchema ──────────────────────────────────────────────────────

describe("RawBundleItemSchema", () => {
  it("rejects Quantity of 0", () => {
    invalid(RawBundleItemSchema, { ID: "bi-1", BundleID: "b1", ItemID: "i1", Quantity: 0 });
  });

  it("accepts Quantity of 1", () => {
    valid(RawBundleItemSchema, { ID: "bi-1", BundleID: "b1", ItemID: "i1", Quantity: 1 });
  });
});

// ─── RawOrderSchema (response validation) ────────────────────────────────────

describe("RawOrderSchema", () => {
  const baseOrder = {
    ID: "order-1",
    CustomerName: "Budi",
    Phone: "081234",
    DeliveryDate: "2026-02-14T00:00:00+07:00",
    DeliveryAmount: 0,
    Status: "pending",
    TotalPrice: 1000,
    InvoiceSignedURL: null,
    CreatedAt: "2026-01-01T00:00:00+07:00",
    Items: [],
  };

  it("accepts valid raw order", () => {
    valid(RawOrderSchema, baseOrder);
  });

  it("defaults InvoiceSignedURL null when omitted", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { InvoiceSignedURL: _, ...withoutInvoice } = baseOrder;
    const result = RawOrderSchema.safeParse(withoutInvoice);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.InvoiceSignedURL).toBeNull();
    }
  });

  it("rejects invalid Status enum", () => {
    invalid(RawOrderSchema, { ...baseOrder, Status: "dispatched" });
  });
});

// ─── RawInvoiceSchema ─────────────────────────────────────────────────────────

describe("RawInvoiceSchema", () => {
  it("accepts valid invoice", () => {
    valid(RawInvoiceSchema, {
      invoice_url: "https://storage.example.com/invoice.pdf",
      order_id: "order-1",
    });
  });

  it("rejects non-URL invoice_url", () => {
    invalid(RawInvoiceSchema, {
      invoice_url: "not-a-url",
      order_id: "order-1",
    });
  });

  it("rejects empty invoice_url", () => {
    invalid(RawInvoiceSchema, { invoice_url: "", order_id: "order-1" });
  });
});
