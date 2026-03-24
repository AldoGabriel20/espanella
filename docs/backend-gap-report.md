# Leuzien Backend Gap Report

**Date:** March 24, 2026  
**Scope:** Frontend implementation vs. current Go backend contract

---

## Executive Summary

The frontend is fully functional but carries five structural workarounds caused by backend limitations. In order of priority, fixing **JSON naming conventions** and **order ownership** would eliminate the largest classes of frontend complexity. Adding a **pagination envelope** and a **price field on items** would remove the remaining significant hacks. Notification and analytics endpoints are lower priority but are visible gaps in the UX.

---

## P1 — Mixed JSON Naming Convention

### Problem

Domain structs (`Order`, `Item`, `Bundle`, `BundleItem`, `OrderItem`, `StockMovement`) are serialized directly via `c.JSON(...)` without `json` struct tags, producing **PascalCase keys** (`CustomerName`, `TotalPrice`, `InvoiceSignedURL`). Auth and invoice DTOs use snake_case tags. The frontend must handle two incompatible response shapes and contains a dedicated adapter layer to normalize them.

### Frontend workaround

`src/lib/api/adapters.ts` maintains a full dual-path adapter that converts PascalCase → camelCase for item/bundle/order/stock endpoints and snake_case → camelCase for auth/invoice endpoints. Both the Zod schemas and the adapter functions are duplicated in concept to cover both conventions.

### Recommended fix

Add `json:"..."` tags to all domain structs, standardizing on **snake_case** to match the DTO layer:

```go
type Order struct {
    ID              uuid.UUID   `json:"id"`
    CustomerName    string      `json:"customer_name"`
    Phone           string      `json:"phone"`
    DeliveryDate    time.Time   `json:"delivery_date"`
    Status          string      `json:"status"`
    TotalPrice      float64     `json:"total_price"`
    DeliveryAmount  float64     `json:"delivery_amount"`
    InvoiceSignedURL string     `json:"invoice_signed_url,omitempty"`
    Items           []OrderItem `json:"items,omitempty"`
    CreatedAt       time.Time   `json:"created_at"`
}
```

Apply the same pattern to `Item`, `Bundle`, `BundleItem`, `OrderItem`, and `StockMovement`. This is a **non-breaking change if the frontend adapter is updated in the same release.**

---

## P1 — Order Ownership (Missing `user_id`)

### Problem

The `Order` struct and `orders` table have no `user_id` column. `GET /orders` and `GET /orders/:id` list **all orders system-wide** regardless of the authenticated caller. `DELETE /orders/:id` also has no ownership check — any `user` role can delete any order. This is a correctness issue and a security concern.

### Frontend workaround

`src/components/orders/OrdersListClient.tsx` renders a persistent amber warning banner:

> "Orders are visible to all authenticated team members. Per-user order scoping is not yet implemented in the API."

### Recommended fix

1. Add `user_id UUID REFERENCES users(id)` to the `orders` table.
2. Add a `UserID uuid.UUID` field to the `Order` struct.
3. In `CreateOrder`, set `order.UserID = claims.UserID` from the JWT claims.
4. In `ListOrders`, scope the query: `WHERE user_id = $1` for the `user` role; admins see all orders (no filter, or an optional query param `?all=true`).
5. In `DeleteOrder`, verify `order.UserID == claims.UserID` (or allow admin unconditionally).

Migration:

```sql
ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id);
UPDATE orders SET user_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1); -- backfill
ALTER TABLE orders ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

---

## P2 — Missing Pagination Envelope

### Problem

All list endpoints (`GET /items`, `GET /bundles`, `GET /orders`, `GET /stock-movements`) return a bare JSON array with no total count or `has_more` flag. The frontend cannot show "page X of Y" or know when the last page is reached.

### Frontend workaround

`DashboardClient.tsx` fetches `limit: 100` items and `limit: 50` orders and uses `.length` as a proxy for the real total. Counts are silently wrong once real data exceeds the cap.

### Recommended fix

Wrap list responses in a standard envelope:

```go
type PagedResponse[T any] struct {
    Data   []T `json:"data"`
    Total  int `json:"total"`
    Limit  int `json:"limit"`
    Offset int `json:"offset"`
}
```

Return this from all list handlers. The `Total` is a simple `COUNT(*)` run in a single extra query or via a `WITH` CTE.

---

## P2 — Client-Supplied Pricing / No Price Catalog

### Problem

`Item` and `Bundle` have no price field. `CreateOrderRequest` accepts `unit_price` directly from the client. The backend computes `LineTotal = UnitPrice * Quantity` and `TotalPrice` from client-submitted values, but it never validates or cross-checks them against any catalog reference. A client can submit any price, including zero.

### Frontend workaround

`OrderComposer.tsx` asks the operator to manually enter a unit price per line. There is no lookup, autocomplete, or default — the operator must know or guess the correct price every time.

### Recommended fix

Add a `Price` field to the `Item` struct and DB schema:

```sql
ALTER TABLE items ADD COLUMN price NUMERIC(12,2) NOT NULL DEFAULT 0;
```

```go
type Item struct {
    // existing fields ...
    Price float64 `json:"price"`
}
```

In `CreateOrder`, if `unit_price` is not supplied in a line, fall back to the item's catalog price. If `bundle_id` is set, compute the price as the sum of member item prices × their quantities. Clients that supply an explicit `unit_price` override (e.g. for custom pricing) can still do so; server-side the field becomes optional rather than required, with catalog price as the default.

---

## P3 — Bundle Response Does Not Include Item Names

### Problem

`GET /bundles/:id` returns `BundleItem` rows with only `ItemID` and `Quantity`. There are no item names in the response.

### Frontend workaround

`BundleDetailClient.tsx` fetches the full item list (`limit: 200`) in parallel with the bundle request, builds an in-memory `Map<itemId, Item>`, and joins it client-side. If the item list has not loaded yet, raw UUIDs are shown. `AdminBundlesClient.tsx` repeats the same join inline.

### Recommended fix

Two options — choose the simpler one:

**Option A (join in handler):** In `GetBundle` and `ListBundles`, after fetching bundle items, do a single `SELECT id, name FROM items WHERE id = ANY($1)` and attach item names to the response:

```go
type BundleItemWithName struct {
    BundleItem
    ItemName string `json:"item_name"`
}
```

**Option B (add `name` to BundleItem):** Store a denormalized `item_name` column on `bundle_items` (updated on item rename). Simpler at read time but requires maintaining consistency on item updates.

Option A is recommended — it is one extra query and requires no schema change.

---

## P3 — Missing `available_stock` in Item Response

### Problem

`Item` returns `Stock` and `ReservedStock` but no precomputed `AvailableStock`. When `ReservedStock > Stock` (an oversold state the backend can reach), the frontend clamps to zero via `Math.max(0, stock - reservedStock)`.

### Recommended fix

Compute and return `available_stock` in the handler or as a DB generated column:

```sql
ALTER TABLE items ADD COLUMN available_stock INTEGER GENERATED ALWAYS AS (GREATEST(stock - reserved_stock, 0)) STORED;
```

Or compute it in the handler before serializing:

```go
item.AvailableStock = max(0, item.Stock - item.ReservedStock)
```

This removes the computation from the frontend and provides a canonical value for any future API consumer.

---

## P4 — Missing Analytics / Dashboard Endpoint

### Problem

There is no server-side aggregation endpoint. The dashboard fetches raw item, bundle, and order lists with small caps (`limit: 100`, `limit: 50`) and counts/filters them in the browser. Counts are incorrect when data exceeds the cap. Low-stock detection re-runs client-side even though `011_add_low_stock_support.sql` already exists in the DB.

### Recommended fix

Add a single lightweight summary endpoint at `GET /admin/summary` (admin only):

```go
type AdminSummary struct {
    TotalItems     int `json:"total_items"`
    TotalBundles   int `json:"total_bundles"`
    TotalOrders    int `json:"total_orders"`
    PendingOrders  int `json:"pending_orders"`
    LowStockItems  int `json:"low_stock_items"`
    LowStockThreshold int `json:"low_stock_threshold"`
}
```

This is five `COUNT(*)` queries or a single CTE. It removes the need for the frontend to fetch and count capped entity lists and exposes the DB-level low-stock threshold rather than the hardcoded frontend constant (`5`).

---

## P4 — No Notification HTTP Endpoints

### Problem

The backend has a fully working notification system (WhatsApp via Fonnte, email via SMTP, delivery reminder scheduler, low-stock alert scheduler, `notification_logs` table). None of this is accessible over HTTP. The frontend renders a non-interactive bell icon as a placeholder.

### Recommended fix

Add two minimal endpoints:

```
GET  /admin/notifications           — list recent notification_logs (paginated)
POST /admin/notifications/test      — trigger a test notification to the caller's contact
```

These give the admin observability over the scheduler without requiring a full notification management UI. The `notification_logs` table and service already exist; the addition is a handler and repository method only.

---

## Summary Table

| Priority | Gap | Frontend Workaround | Backend Fix Effort |
|---|---|---|---|
| P1 | Mixed PascalCase/snake_case JSON | Full dual-path adapter layer | Add `json` tags to 6 structs — ~20 lines |
| P1 | No order ownership / user_id | Global visibility warning banner | Add `user_id` column + scoped query — medium |
| P2 | No pagination envelope | Capped LIST sizes, wrong totals | Wrap list responses in `PagedResponse[T]` |
| P2 | No catalog price on Item | Operator enters price manually each order | Add `price` column to `items`, optional override |
| P3 | Bundle items have no names | Client fetches all items, joins client-side | One extra `SELECT name` join in `GetBundle` handler |
| P3 | No `available_stock` in response | Client computes `max(0, stock-reserved)` | Add computed field in handler or DB |
| P4 | No analytics endpoint | Fetch+count with hard caps on dashboard | Add `GET /admin/summary` with 5 COUNT queries |
| P4 | No notification endpoints | Bell icon is a non-interactive placeholder | Add `GET /admin/notifications` from existing table |
