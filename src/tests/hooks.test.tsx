/**
 * Integration tests for TanStack Query hooks.
 *
 * We mock the global fetch to simulate BFF responses without a real server.
 * Each test is wrapped in a fresh QueryClient to avoid cross-test cache pollution.
 */

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useItems, useCreateItem, useDeleteItem } from "@/hooks/useItems";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import type { Item, Order } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
  return { Wrapper, queryClient };
}

function mockFetch(data: unknown, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  } as Response);
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NOW = "2026-01-01T00:00:00+07:00";

const itemFixture: Item = {
  id: "item-1",
  name: "Premium Dates",
  description: null,
  stock: 100,
  reservedStock: 20,
  availableStock: 80,
  unit: "box",
  price: 0,
  primaryImageUrl: null,
  hasVideo: false,
  mediaCount: 0,
  media: [],
  createdAt: NOW,
  updatedAt: NOW,
};

const orderFixture: Order = {
  id: "order-1",
  customerName: "Budi Santoso",
  phone: "081234567890",
  deliveryDate: "2026-02-14T00:00:00+07:00",
  deliveryAmount: 50000,
  status: "pending",
  totalPrice: 350000,
  hasInvoice: false,
  address: null,
  cardRequest: false,
  notes: null,
  airwaybillNumber: null,
  courier: null,
  lockedByBatch: false,
  createdAt: NOW,
  items: [],
};

// ─── useItems ─────────────────────────────────────────────────────────────────

describe("useItems", () => {
  it("returns data when fetch succeeds", async () => {
    mockFetch({ data: [itemFixture], total: 1, limit: 50, offset: 0 });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useItems(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.items).toEqual([itemFixture]);
    expect(result.current.total).toBe(1);
  });

  it("calls the correct URL", async () => {
    mockFetch({ data: [itemFixture], total: 1, limit: 50, offset: 0 });
    const { Wrapper } = makeWrapper();
    renderHook(() => useItems(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/catalog/items");
    });
  });

  it("appends query params when provided", async () => {
    mockFetch({ data: [itemFixture], total: 1, limit: 10, offset: 20 });
    const { Wrapper } = makeWrapper();
    renderHook(() => useItems({ limit: 10, offset: 20 }), { wrapper: Wrapper });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/catalog/items?limit=10&offset=20"
      );
    });
  });

  it("enters error state when fetch fails", async () => {
    mockFetch({ message: "Unauthorized" }, 401);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useItems(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("Unauthorized");
  });
});

// ─── useCreateItem ────────────────────────────────────────────────────────────

describe("useCreateItem", () => {
  it("calls POST /api/catalog/items with correct body", async () => {
    mockFetch(itemFixture);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateItem(), { wrapper: Wrapper });

    const input = { name: "Premium Dates", stock: 100, unit: "box", price: 0 };
    result.current.mutate(input);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/catalog/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(input),
      })
    );
  });

  it("returns created item as data", async () => {
    mockFetch(itemFixture);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateItem(), { wrapper: Wrapper });

    result.current.mutate({ name: "Premium Dates", stock: 100, unit: "box", price: 0 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(itemFixture);
  });

  it("enters error state when POST fails", async () => {
    mockFetch({ message: "Item name already exists" }, 409);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateItem(), { wrapper: Wrapper });

    result.current.mutate({ name: "Dupe", stock: 0, unit: "kg", price: 0 });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("Item name already exists");
  });
});

// ─── useDeleteItem ────────────────────────────────────────────────────────────

describe("useDeleteItem", () => {
  it("calls DELETE /api/catalog/items/:id", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    } as Response);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteItem(), { wrapper: Wrapper });

    result.current.mutate("item-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/catalog/items/item-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("enters error state when DELETE fails", async () => {
    mockFetch({ message: "Item not found" }, 404);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteItem(), { wrapper: Wrapper });

    result.current.mutate("item-999");
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("Item not found");
  });
});

// ─── useOrders ────────────────────────────────────────────────────────────────

describe("useOrders", () => {
  it("returns orders when fetch succeeds", async () => {
    mockFetch({ data: [orderFixture], total: 1, limit: 50, offset: 0 });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useOrders(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.orders).toEqual([orderFixture]);
  });

  it("includes status query param when provided", async () => {
    mockFetch({ data: [], total: 0, limit: 50, offset: 0 });
    const { Wrapper } = makeWrapper();
    renderHook(() => useOrders({ status: "pending" }), { wrapper: Wrapper });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("status=pending")
      );
    });
  });
});

// ─── useUpdateOrderStatus ─────────────────────────────────────────────────────

describe("useUpdateOrderStatus", () => {
  it("calls PATCH /api/orders/:id with status body", async () => {
    mockFetch({ ...orderFixture, status: "confirmed" });
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateOrderStatus(), { wrapper: Wrapper });

    result.current.mutate({ id: "order-1", status: "confirmed" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/orders/order-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "confirmed" }),
      })
    );
  });

  it("enters error state when PATCH fails", async () => {
    mockFetch({ message: "Invalid status transition" }, 422);
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useUpdateOrderStatus(), { wrapper: Wrapper });

    result.current.mutate({ id: "order-1", status: "done" });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("Invalid status transition");
  });
});
