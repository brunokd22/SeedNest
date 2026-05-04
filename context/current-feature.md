# Current Feature

## Feature: 1.10 — Customer Nav Layout (Web)

## Status

Completed

## Goals

- Sticky top `CustomerNav` with desktop links (Explore, My Orders, My Issues) and mobile Sheet hamburger
- `CartBadge` inline component reads `totalItems()` from Zustand cart store, links to `/cart`
- `cart-store.ts`: Zustand + persist middleware (localStorage key `'seednest-cart'`), `addItem` merges duplicates by seedlingId
- `(customer)/layout.tsx`: Server component role guard redirecting non-CUSTOMER to `/dashboard`
- `UserMenu` in customer nav: My Orders, My Issues, Sign Out → `/sign-in`

## Notes

- Zustand must be installed (`pnpm add zustand` in apps/web)
- `store/` directory lives at `apps/web/src/store/`
- Customer layout is server component for role guard; CustomerNav is client component
- `addItem` must merge quantities when the same `seedlingId` is added again

## History

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
