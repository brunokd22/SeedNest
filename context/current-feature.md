# Current Feature

## Feature: 1.7 — Auth Pages (Web)

## Status

Completed

## Goals

- Build all 5 auth pages: sign-up, sign-in, verify-email (OTP), forgot-password, reset-password
- Each page uses shadcn/ui + react-hook-form + Zod + better-auth client
- OTP verify-email: 6-box input with auto-advance and 60s resend cooldown
- Role-based redirect after sign-in (MANAGER → /dashboard, CUSTOMER → /explore)

## Notes

- Add `emailOTP` plugin to backend auth config to support OTP verification
- Client plugin: `emailOTPClient` from `better-auth/client/plugins`
- `signUpWithRole` helper wraps `authClient.signUp.email` to pass additional `role` field
- Use schemas from `@seednest/shared` where available; define local schemas for confirm-password

## History

- **1.7 — Auth Pages (Web)** ✅ — All 5 auth pages implemented: sign-up (role select, show/hide password), sign-in (Google OAuth, role-based redirect), verify-email (6-box OTP with auto-advance + 60s resend cooldown), forgot-password (always-safe response), reset-password (confirm password match). emailOTP plugin added to backend. Shared zod upgraded to v4. Zero TS errors.
- **1.6 — Next.js Web App Scaffold** ✅ — Next.js 15 + Tailwind v4 + shadcn/ui (22 components, zinc base, green CSS vars). TanStack Query, Better Auth client, Axios. Route groups (public/auth/customer/manager). Auth middleware with role-based redirects. Zero TS errors.
- **1.5 — Better Auth Configuration** ✅ — Better Auth wired to Prisma adapter; email/password with verification; optional Google OAuth; React Email templates (verification, reset-password, welcome); full `requireAuth`/`requireRole` middleware; `/api/auth` mounted in Express. Zero TS errors.
- **1.4 — Shared Types Package** ✅ — `packages/shared/src/` populated with types (user, nursery, order, issue, api), constants, and Zod schemas (auth, nursery, seedling, order, issue). All enums match Prisma schema. Compiles with zero TypeScript errors.
- **1.1 — Monorepo Scaffold** ✅ — Turborepo + pnpm workspaces, `packages/tsconfig` (base/nextjs/react-native), `@seednest/shared`. Merged to main 2026-04-20.
- **1.2 — Backend: Express + Prisma Setup** ✅ — `@seednest/api` with Express, Zod env validation, Prisma singleton, R2/Stripe/Resend config, error handler, validate middleware, auth stubs, haversine util, and `GET /api/health`. Merged to main 2026-04-20.
- **1.3 — Database Schema (Prisma)** ✅ — Full Prisma schema (12 models, 9 enums), seed script with admin/manager/nursery/categories/seedlings. Applied to Neon via `db push`, seeded successfully. Merged to main 2026-04-28.
