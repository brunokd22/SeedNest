# Current Feature

## Feature: 2.3 — Backend: Seedling CRUD API + Low-Stock Notifications

## Status

Completed

## Goals

- Update `shared/schemas/seedling.ts` with proper validation (min/max/trim/defaults)
- `notification.service.ts` stub: `createNotification`
- `seedling.service.ts`: getSeedlingsByNursery (paginated+filtered), getSeedlingById, createSeedling, updateSeedling (triggers low-stock check), deleteSeedling, checkAndNotifyLowStock
- `sendLowStockAlert` added to `resend.ts`
- `routes/seedling.ts`: nursery-scoped router (mergeParams) + global `/api/seedlings/search` router
- Register both in `app.ts`

## Notes

- `SeedlingSize`/`AvailabilityStatus` used from `@prisma/client` in API; shared schema keeps `../types/nursery` (no Prisma dep in shared)
- `checkAndNotifyLowStock` wraps in try/catch — never throws, never breaks main flow
- Global search fetches all matching, computes haversine in memory, then paginates
- Both routers exported from `routes/seedling.ts` (default + named `globalSeedlingRouter`)

## History

- **2.3 — Backend: Seedling CRUD API + Low-Stock Notifications** ✅ — Updated shared seedling schema (min/max/trim/defaults). notification.service.ts stub. seedling.service.ts (6 functions incl. paginated filter query + checkAndNotifyLowStock with try/catch guard). sendLowStockAlert HTML email in resend.ts. Nursery-scoped router + globalSeedlingRouter (/api/seedlings/search with haversine sort). Zero TS errors.
- **2.2 — Backend: Category CRUD API** ✅ — createCategorySchema/updateCategorySchema in shared. checkNurseryOwnership middleware (reads nurseryId param, verifies ownership, attaches req.nursery). category.service.ts (getCategoriesByNursery, createCategory, updateCategory, deleteCategory with seedling guard). Routes at /api/nurseries/:nurseryId/categories with mergeParams. Zero TS errors.
- **2.1 — Backend: Nursery CRUD API** ✅ — nursery.service.ts (6 functions incl. haversine geo-sort), routes/nursery.ts (public /explore + /:id/public, manager CRUD), registered at /api/nurseries. AppError/NotFoundError/ForbiddenError added to errorHandler. NurseryWithDistance.distanceKm made optional. Zero TS errors.
- **1.10 — Customer Nav Layout (Web)** ✅ — Sticky CustomerNav with desktop links, CartBadge (live Zustand count), CustomerUserMenu (My Orders/My Issues/Sign Out). Mobile Sheet hamburger. Zustand cart-store with persist middleware (seednest-cart), addItem merges duplicates. Server layout role guard redirects non-CUSTOMER to /dashboard. Zero TS errors.
- **1.9 — Manager Sidebar Layout (Web)** ✅ — Collapsible sidebar (256px/64px) with 6 nav items, active route highlighting, tooltips when collapsed, localStorage persistence, mobile Sheet drawer. ManagerShell client component owns collapse state + header (page title, NotificationBell, UserMenu). Server layout with role guard redirecting non-MANAGER to /explore. Zero TS errors.
- **1.8 — Expo Mobile App Scaffold** ✅ — Scaffold @seednest/mobile with Expo SDK 52, expo-router v4, file-based routing. NativeWind v4 (Tailwind v3) for styling, Zustand for auth state, SecureStore for token. Bottom tab navigator (5 tabs), auth stack (sign-in/up/verify-email/forgot-password). Reusable components: Button, Input, Screen, EmptyState, LoadingSpinner.
- **1.7 — Auth Pages (Web)** ✅ — All 5 auth pages implemented: sign-up (role select, show/hide password), sign-in (Google OAuth, role-based redirect), verify-email (6-box OTP with auto-advance + 60s resend cooldown), forgot-password (always-safe response), reset-password (confirm password match). emailOTP plugin added to backend. Shared zod upgraded to v4. Zero TS errors.
- **1.6 — Next.js Web App Scaffold** ✅ — Next.js 15 + Tailwind v4 + shadcn/ui (22 components, zinc base, green CSS vars). TanStack Query, Better Auth client, Axios. Route groups (public/auth/customer/manager). Auth middleware with role-based redirects. Zero TS errors.
- **1.5 — Better Auth Configuration** ✅ — Better Auth wired to Prisma adapter; email/password with verification; optional Google OAuth; React Email templates (verification, reset-password, welcome); full `requireAuth`/`requireRole` middleware; `/api/auth` mounted in Express. Zero TS errors.
- **1.4 — Shared Types Package** ✅
- **1.1 — Monorepo Scaffold** ✅
- **1.2 — Backend: Express + Prisma Setup** ✅
- **1.3 — Database Schema (Prisma)** ✅
