# Current Feature

## Feature: 1.9 — Manager Sidebar Layout (Web)

## Status

In Progress

## Goals

- Collapsible Manager dashboard sidebar: 256px expanded / 64px icon-only, persisted to localStorage
- Mobile: Sheet/drawer toggled from header menu button
- `ManagerSidebar.tsx`: 6 nav items with lucide icons, active route highlighting, tooltips when collapsed
- `ManagerShell.tsx`: Client component shell managing collapse state + header bar (page title, NotificationBell, UserMenu)
- `(manager)/layout.tsx`: Server component with role guard (redirect non-MANAGER to /explore)
- `UserMenu.tsx`: Sign Out calls `authClient.signOut()` then redirects to `/sign-in`

## Notes

- `(manager)/layout.tsx` is a server component; collapse state lives in `ManagerShell.tsx` (client)
- Tooltip requires shadcn `tooltip` component (installs `@radix-ui/react-tooltip`)
- Middleware already guards routes; layout guard is defense-in-depth
- `headers()` used in layout to forward cookie header to backend session check

## History

- **1.8 — Expo Mobile App Scaffold** ✅ — Scaffold @seednest/mobile with Expo SDK 52, expo-router v4, file-based routing. NativeWind v4 (Tailwind v3) for styling, Zustand for auth state, SecureStore for token. Bottom tab navigator (5 tabs), auth stack (sign-in/up/verify-email/forgot-password). Reusable components: Button, Input, Screen, EmptyState, LoadingSpinner.
- **1.7 — Auth Pages (Web)** ✅ — All 5 auth pages implemented: sign-up (role select, show/hide password), sign-in (Google OAuth, role-based redirect), verify-email (6-box OTP with auto-advance + 60s resend cooldown), forgot-password (always-safe response), reset-password (confirm password match). emailOTP plugin added to backend. Shared zod upgraded to v4. Zero TS errors.
- **1.6 — Next.js Web App Scaffold** ✅ — Next.js 15 + Tailwind v4 + shadcn/ui (22 components, zinc base, green CSS vars). TanStack Query, Better Auth client, Axios. Route groups (public/auth/customer/manager). Auth middleware with role-based redirects. Zero TS errors.
- **1.5 — Better Auth Configuration** ✅ — Better Auth wired to Prisma adapter; email/password with verification; optional Google OAuth; React Email templates (verification, reset-password, welcome); full `requireAuth`/`requireRole` middleware; `/api/auth` mounted in Express. Zero TS errors.
- **1.4 — Shared Types Package** ✅
- **1.1 — Monorepo Scaffold** ✅
- **1.2 — Backend: Express + Prisma Setup** ✅
- **1.3 — Database Schema (Prisma)** ✅
