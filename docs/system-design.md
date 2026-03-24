# Leuzien Frontend System Design

## 1. Objective

Build a production-ready web frontend for Leuzien that fully applies the existing backend API capabilities from the Go service in [README.md](/home/sirclo/go/src/leuzien/README.md). The frontend should support both `user` and `admin` roles, expose catalog and order flows, and provide an admin workspace for inventory, bundle, invoice, and stock-audit operations.

The proposed stack is:

- Next.js with App Router and TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query for client-side fetching and cache invalidation
- React Hook Form + Zod for form handling and validation

## 2. Product Scope

### In Scope

- Authentication: register, login, refresh, logout, current user profile
- Catalog browsing for items and bundles
- Order creation, order list, order detail, order deletion
- Admin item CRUD
- Admin bundle CRUD
- Admin order status management
- Admin invoice generation and invoice URL retrieval
- Admin stock movement browsing
- Dashboard summaries derived from available API data

### Explicitly Out of Scope

- Notification management UI, because the backend currently exposes notification schedulers and providers but no HTTP endpoints for notification logs or settings
- Customer-specific order isolation in the frontend, because the backend does not currently scope orders by authenticated user ID
- Payment flow, checkout gateway, or online payment reconciliation
- Real-time updates over WebSocket or SSE

## 3. Backend Contract Summary

Base URL:

`http://localhost:8080/api/v1`

### Auth Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/logout`

### Shared Authenticated Endpoints for `user` and `admin`

- `GET /items`
- `GET /items/:id`
- `GET /bundles`
- `GET /bundles/:id`
- `POST /orders`
- `GET /orders`
- `GET /orders/:id`
- `DELETE /orders/:id`

### Admin-Only Endpoints

- `POST /items`
- `PUT /items/:id`
- `DELETE /items/:id`
- `POST /bundles`
- `PUT /bundles/:id`
- `DELETE /bundles/:id`
- `PATCH /orders/:id/status`
- `POST /orders/:id/invoice`
- `GET /orders/:id/invoice`
- `GET /stock-movements`
- `GET /items/:id/stock-movements`

### Important API Constraints

1. The JSON shape is inconsistent.
	 Auth and invoice endpoints return snake_case DTOs.
	 Item, bundle, order, and stock-movement endpoints serialize Go structs without JSON tags, so the response keys are PascalCase such as `ID`, `Name`, `CreatedAt`, `Items`, `ReservedStock`, and `InvoiceSignedURL`.

2. Orders are not scoped to the authenticated user.
	 The route comments say users can view their own orders, but the current service and repository implementation list and fetch all orders without user filtering.

3. Available stock is not returned directly.
	 The frontend must compute it as:

	 $$availableStock = stock - reservedStock$$

4. Bundle details do not include expanded item names.
	 Bundle items only return `ItemID` and `Quantity`, so the frontend should join bundle lines with the item catalog when rendering readable bundle compositions.

5. Invoice URLs are generated and stored server-side.
	 `GET /orders/:id/invoice` returns the most recently stored signed URL and can return `404` when no invoice has been generated yet.

6. Pagination is offset-based.
	 Supported query params: `limit`, `offset`.

## 4. Frontend Architecture Decision

### Recommended Pattern

Use Next.js as a frontend shell plus a thin Backend-for-Frontend layer.

This means:

- Browser UI talks to Next.js route handlers or server actions
- Next.js talks to the Go backend with Bearer tokens
- Tokens are stored in secure HttpOnly cookies managed by Next.js
- Client components never read raw access or refresh tokens directly

### Why This Pattern Fits Leuzien

- The backend already expects Bearer tokens, not cookie sessions
- Access and refresh tokens should not live in localStorage
- Token refresh rotation is already supported by the backend
- Server components can render protected screens without exposing secrets to client JavaScript
- Cross-origin complexity becomes easier to control because the browser mainly talks to the same-origin Next.js app

### Authentication Flow

1. User submits login form to a Next.js route handler.
2. Next.js forwards credentials to `POST /auth/login`.
3. Next.js stores `access_token`, `refresh_token`, and expiry metadata in secure HttpOnly cookies.
4. Protected server-side fetches inject `Authorization: Bearer <access_token>`.
5. On `401`, the Next.js server attempts `POST /auth/refresh` using the stored refresh token.
6. If refresh succeeds, cookies are rotated and the original request is retried once.
7. If refresh fails, cookies are cleared and the user is redirected to login.
8. Logout calls backend `POST /auth/logout`, then clears local cookies.

## 5. Proposed Application Structure

```text
src/
	app/
		(marketing)/
			page.tsx
		(auth)/
			login/page.tsx
			register/page.tsx
		(dashboard)/
			layout.tsx
			page.tsx
			catalog/
				items/page.tsx
				items/[id]/page.tsx
				bundles/page.tsx
				bundles/[id]/page.tsx
			orders/
				page.tsx
				new/page.tsx
				[id]/page.tsx
			admin/
				page.tsx
				items/page.tsx
				bundles/page.tsx
				orders/page.tsx
				stock/page.tsx
	components/
		layout/
		navigation/
		auth/
		catalog/
		orders/
		admin/
		ui/
	lib/
		api/
			client.ts
			auth.ts
			items.ts
			bundles.ts
			orders.ts
			invoices.ts
			stock.ts
			adapters.ts
			schemas.ts
		auth/
			cookies.ts
			session.ts
			guards.ts
		utils/
			currency.ts
			date.ts
			pagination.ts
			role.ts
	hooks/
	types/
```

## 6. Route Map and UX Responsibilities

### Public Routes

#### `/`

- Brand landing page for Leuzien
- Short explanation of catalog and order management
- Entry points to login and register

#### `/login`

- Email and password form
- Inline error states for invalid credentials
- Redirect by role after success

#### `/register`

- Full name, email, password form
- Success state that leads into authenticated dashboard

### Shared Authenticated Routes

#### `/dashboard`

- Welcome panel using `GET /auth/me`
- Summary cards derived from recent orders, items, and bundles
- Low-stock preview calculated from item list when accessible
- Role-aware shortcuts to order creation and admin workspace

#### `/catalog/items`

- Paginated item table or card grid
- Search and client-side filtering by name or unit
- Display stock, reserved stock, and available stock

#### `/catalog/items/[id]`

- Item detail summary
- Stock breakdown
- For admins, link to item stock movement page

#### `/catalog/bundles`

- Paginated list of bundles
- Each bundle card shows bundle name and resolved item composition

#### `/catalog/bundles/[id]`

- Bundle detail with joined item names and quantities
- Use item catalog data to resolve human-readable line names

#### `/orders`

- Paginated order list
- Filters by status and delivery date range
- Clear warning banner that order visibility is backend-global today

#### `/orders/new`

- Order composer
- Choose direct items and bundles
- Quantity editors
- Delivery date picker
- Delivery amount input
- Line name and unit price input because backend accepts invoice snapshot fields
- Price summary before submit

#### `/orders/[id]`

- Order detail view
- Order lines, totals, delivery date, and status timeline
- Delete action for allowed roles
- Invoice status panel

### Admin Routes

#### `/admin`

- Operations overview
- Metrics cards for catalog count, order count, pending orders, low stock count

#### `/admin/items`

- CRUD table for items
- Create and edit dialog or drawer
- Bulk-friendly layout, but keep actual writes single-record because backend only exposes single-item mutations

#### `/admin/bundles`

- CRUD table for bundles
- Bundle form with repeatable item rows
- Client-side validation to ensure at least one bundle item and quantity >= 1

#### `/admin/orders`

- Admin order table
- Status update action using `PATCH /orders/:id/status`
- Invoice generation and invoice retrieval actions per row or in detail drawer

#### `/admin/stock`

- Global stock movement table using `GET /stock-movements`
- Optional item-specific drill-down using `GET /items/:id/stock-movements`

## 7. UI Design Direction

The frontend should avoid generic admin-dashboard styling. It should feel like a modern operations tool for a premium hampers brand.

### Visual Direction

- Warm neutral base, not stark white
- Deep green, brick, cream, and muted gold as accent palette
- Editorial typography for headings, readable sans-serif for body text
- Rounded cards with strong spacing and subtle layered backgrounds
- Product-focused presentation instead of purely spreadsheet-like interfaces

### shadcn/ui Components to Standardize

- `Button`
- `Card`
- `Badge`
- `Input`
- `Textarea`
- `Label`
- `Form`
- `Dialog`
- `Drawer`
- `DropdownMenu`
- `Table`
- `Tabs`
- `Sheet`
- `Select`
- `Popover`
- `Calendar`
- `Alert`
- `Toast` or `Sonner`
- `Skeleton`
- `Separator`

## 8. Data Modeling Strategy

### Internal Frontend Types

Normalize all backend responses into consistent camelCase frontend types.

Example normalized types:

```ts
type Item = {
	id: string;
	name: string;
	stock: number;
	reservedStock: number;
	availableStock: number;
	unit: string;
	createdAt: string;
	updatedAt: string;
};

type Bundle = {
	id: string;
	name: string;
	items: Array<{
		id: string;
		bundleId: string;
		itemId: string;
		quantity: number;
	}>;
	createdAt: string;
};

type Order = {
	id: string;
	customerName: string;
	phone: string;
	deliveryDate: string;
	status: "pending" | "confirmed" | "packed" | "shipped" | "done" | "cancelled";
	totalPrice: number;
	deliveryAmount: number;
	invoiceSignedUrl: string | null;
	createdAt: string;
	items: OrderItem[];
};
```

### Adapter Layer Requirement

Create a dedicated adapter layer between raw backend responses and UI models.

Responsibilities:

- Convert PascalCase response keys into camelCase
- Compute `availableStock`
- Join bundle lines with item names when both datasets are loaded
- Normalize nullable invoice fields
- Protect the UI from backend response inconsistencies

## 9. State Management Strategy

### Server State

Use TanStack Query for:

- Items list and detail
- Bundles list and detail
- Orders list and detail
- Stock movements
- Current user profile
- Invoice URL fetch and refresh

### Local UI State

Use component state or a small store only for:

- Sidebar open state
- Order builder draft rows
- Table filters and client-side search inputs
- Modal and drawer visibility

Avoid introducing global client state for server data already handled by Query.

## 10. Form Strategy

Use React Hook Form + Zod.

### Form Modules

- Login form
- Register form
- Item form
- Bundle form
- Order composer form
- Order status update form

### Validation Rules That Must Match Backend

- Password minimum length: 8
- Item stock minimum: 0
- Bundle item quantity minimum: 1
- Order must contain at least one line
- Each order line must contain exactly one of `item_id` or `bundle_id`
- Order line quantity minimum: 1
- Delivery date required
- Status required for admin patch action

## 11. API Integration Plan

### BFF Route Handlers or Server Actions

Create dedicated wrappers for:

- Login
- Register
- Logout
- Refresh
- Me
- Items CRUD
- Bundles CRUD
- Orders CRUD
- Order status update
- Invoice generate and fetch
- Stock movement listing

### Error Handling Rules

- `400`: render inline form validation or action error
- `401`: trigger refresh; if still unauthorized, redirect to login
- `403`: show forbidden page or disabled action state
- `404`: show empty state or missing resource page
- `409`: show conflict feedback for registration
- `500`: show non-blocking toast plus retry path where relevant

## 12. Role and Access Design

### `user`

- Can access dashboard, catalog, orders
- Can create orders
- Can list and view orders
- Can delete orders
- Cannot access admin pages

### `admin`

- Has everything `user` has
- Can access all admin pages
- Can create, update, delete items and bundles
- Can update order status
- Can generate and fetch invoice URLs
- Can browse stock movements

### Frontend Guarding Rule

Guard at two levels:

- Server-side redirect guard in layouts and pages
- Client-side conditional rendering for action buttons and navigation

Never rely on the frontend for true security, but keep UI behavior aligned with backend permissions.

## 13. Dashboard Metrics Strategy

Because the backend does not expose a summary endpoint, the dashboard should derive lightweight metrics from existing list endpoints.

Suggested cards:

- Total items
- Total bundles
- Total orders
- Pending orders
- Low-stock items

Implementation note:

- Fetch with a reasonable `limit` for initial dashboard use
- Document the tradeoff that totals may need dedicated backend summary endpoints later for scale

## 14. Order Builder Design

The order composer is the most important workflow and should be treated as a guided builder rather than a plain form.

### UX Rules

- Separate tabs for adding direct items and bundles
- Prevent duplicate accidental line explosions by clearly showing current draft lines
- Auto-calculate line totals and grand total locally
- Require either item or bundle selection per row
- Allow custom line naming for invoice-friendly display
- Allow manual unit price entry because pricing is currently client-supplied to the backend
- Show available stock indicators before submit

### Technical Notes

- Bundle submission should send `bundle_id` and quantity, not pre-expanded item rows
- Keep original catalog objects in memory for display labels
- Show backend stock errors as actionable feedback on submit

## 15. Admin Operations Design

### Inventory Management

- Primary table view with fast create/edit flow
- Highlight low-stock rows using computed available stock
- Expose reserved stock read-only to avoid false assumptions about actual availability

### Bundle Management

- Use searchable item selectors in the bundle form
- Resolve item names from the shared item catalog cache
- Show effective bundle composition summary before save

### Order Operations

- Status update control should use explicit allowed values:
	- `pending`
	- `confirmed`
	- `packed`
	- `shipped`
	- `done`
	- `cancelled`
- Invoice controls should distinguish:
	- Generate invoice
	- Open latest invoice URL
	- Empty state when invoice is not generated yet

### Stock Audit

- Global table columns: item ID, order ID, delta, reason, created at
- Item detail stock panel should deep-link into filtered stock movement view when possible

## 16. Performance and Rendering Strategy

- Use server components for route shells, authentication checks, and initial page composition
- Use client components for forms, tables with interactions, filters, and optimistic UI moments
- Hydrate TanStack Query with initial server-fetched data on critical pages when useful
- Defer non-critical panels below the fold
- Use pagination for all larger list views

## 17. Testing Strategy

### Unit Tests

- Response adapters
- Validation schemas
- Utility formatters
- Role guard helpers

### Component Tests

- Login form
- Order builder line editing
- Admin item and bundle forms
- Status update control

### End-to-End Tests

- Register and login flow
- Create order flow
- Admin item CRUD flow
- Admin bundle CRUD flow
- Admin order status update
- Admin invoice generation

## 18. Delivery Plan

### Phase 1

- Scaffold Next.js app
- Install Tailwind and shadcn/ui
- Build design tokens, layout shell, and navigation
- Build auth session handling through Next.js BFF

### Phase 2

- Implement shared catalog pages
- Implement dashboard metrics
- Implement order list and order detail

### Phase 3

- Implement order builder
- Improve validation and mutation UX

### Phase 4

- Implement admin inventory and bundle management
- Implement admin order operations and invoice tools
- Implement stock movement views

### Phase 5

- Add testing, polish, loading states, error boundaries, and responsive refinement

## 19. Open Backend Risks to Record

These are important to surface before frontend implementation starts:

1. Order endpoints are not user-scoped in the backend.
2. Catalog, order, and stock endpoints return PascalCase JSON keys while auth and invoice endpoints return snake_case keys.
3. The backend has no summary endpoint for dashboard analytics.
4. The backend has no notification or audit configuration endpoints for frontend management.
5. Pricing is provided by the client when creating orders, so the frontend must be careful about operator mistakes.

## 20. Final Recommendation

Proceed with a Next.js App Router frontend using Tailwind and shadcn/ui, but implement it as a secure BFF-style application rather than a thin SPA directly calling the Go API from the browser. That design best fits the current token-based backend, contains the response-shape inconsistencies in one place, and leaves room to evolve toward server-rendered dashboards and stricter role enforcement later.
