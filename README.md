# Espanella — Leuzien Frontend

Operations dashboard and customer-facing UI for [Leuzien](../leuzien), a hampers order management platform. Built with Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Testing | Vitest + Testing Library |
| Auth pattern | Backend-for-Frontend (HttpOnly cookies) |

---

## Prerequisites

- Node.js 20+
- The [Leuzien backend](../leuzien) running at `http://localhost:8080`

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Set the following variables in `.env.local`:

```env
# URL of the running Leuzien backend
LEUZIEN_API_URL=http://localhost:8080/api/v1

# Secret used to sign session cookies (min 32 characters)
COOKIE_SECRET=change-me-to-a-long-random-string

# Set to "production" in deployed environments
NODE_ENV=development
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app proxies all backend requests through Next.js route handlers — the browser never communicates with the Go backend directly.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

---

## Project Structure

```
src/
  app/
    (auth)/           # Login and register pages
    (dashboard)/      # Authenticated shell
      dashboard/      # Overview and metrics
      catalog/        # Items and bundles browsing
      orders/         # Order list, detail, and new-order builder
      admin/          # Admin-only: item/bundle CRUD, order ops, stock audit
    api/              # Next.js BFF route handlers (proxies to backend)
  components/
    auth/             # Login, register, logout forms
    catalog/          # Item and bundle display components
    orders/           # Order composer, order list, order detail
    admin/            # Admin tables, item/bundle forms, invoice actions
    dashboard/        # Dashboard summary cards
    layout/           # Sidebar, topbar, navigation shell
    ui/               # shadcn/ui base components
  hooks/              # TanStack Query hooks (useItems, useOrders, etc.)
  lib/
    api/              # Typed API modules, adapter layer, Zod schemas
    auth/             # Cookie helpers, session resolver, route guards
    utils/            # Currency, date, pagination utilities
  types/              # Shared TypeScript types (normalized frontend models)
  tests/              # Unit tests for adapters, schemas, and hooks
```

---

## Architecture

### Backend-for-Frontend (BFF)

The browser talks only to Next.js. Next.js route handlers (`src/app/api/`) forward requests to the Go backend with a Bearer token injected server-side. Access and refresh tokens are stored in `HttpOnly; SameSite=Lax` cookies and are never exposed to client JavaScript.

**Token refresh flow:**
1. Any backend `401` triggers a transparent `POST /auth/refresh`.
2. If refresh succeeds, cookies are rotated and the original request is retried once.
3. If refresh fails, cookies are cleared and the user is redirected to `/login`.

### Adapter Layer

The backend uses PascalCase JSON for domain responses (items, bundles, orders, stock) and snake_case for auth and invoice DTOs. `src/lib/api/adapters.ts` normalizes all responses into consistent camelCase frontend types before they reach any component. UI code never handles raw backend response shapes.

### Role-Based Access

- `user` role: catalog browsing, order creation and management.
- `admin` role: all of the above plus item/bundle CRUD, order status updates, invoice generation, and stock movement audit.

Route guards in `src/lib/auth/guards.ts` enforce role checks at the server-component layer before rendering any admin page.

---

## Roles and Test Accounts

New registrations are always assigned the `user` role. To create an admin account, register normally then update the role directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Related

- [Leuzien Backend](../leuzien) — Go + Gin REST API
- [System Design](docs/system-design.md) — Frontend architecture decisions and backend contract summary
- [Backend Gap Report](docs/backend-gap-report.md) — Known backend limitations and recommended improvements
