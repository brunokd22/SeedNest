# Current Feature

## Feature: 1.6 — Next.js Web App Scaffold

## Status

Completed

## Goals

- Scaffold Next.js 15 app with App Router, Tailwind v4, shadcn/ui (green), TanStack Query, Better Auth client
- Create route group structure: (public), (auth), (customer), (manager)
- Implement auth middleware with role-based redirects
- Wire up lib/, providers/, and env example

## Notes

- No tailwind.config.ts (Tailwind v4 CSS-based config only)
- shadcn style: default, base color: green, CSS variables: yes
- Light mode only (dark mode not supported per project spec)
- Auth client uses `better-auth/react`
- Middleware calls API's `/api/auth/get-session` for session check

## History

- **1.6 — Next.js Web App Scaffold** ✅ — Next.js 15 + Tailwind v4 + shadcn/ui (22 components, zinc base, green CSS vars). TanStack Query, Better Auth client, Axios. Route groups (public/auth/customer/manager). Auth middleware with role-based redirects. Zero TS errors.
- **1.5 — Better Auth Configuration** ✅ — Better Auth wired to Prisma adapter; email/password with verification; optional Google OAuth; React Email templates (verification, reset-password, welcome); full `requireAuth`/`requireRole` middleware; `/api/auth` mounted in Express. Zero TS errors.
- **1.4 — Shared Types Package** ✅ — `packages/shared/src/` populated with types (user, nursery, order, issue, api), constants, and Zod schemas (auth, nursery, seedling, order, issue). All enums match Prisma schema. Compiles with zero TypeScript errors.
- **1.1 — Monorepo Scaffold** ✅ — Turborepo + pnpm workspaces, `packages/tsconfig` (base/nextjs/react-native), `@seednest/shared`. Merged to main 2026-04-20.
- **1.2 — Backend: Express + Prisma Setup** ✅ — `@seednest/api` with Express, Zod env validation, Prisma singleton, R2/Stripe/Resend config, error handler, validate middleware, auth stubs, haversine util, and `GET /api/health`. Merged to main 2026-04-20.
- **1.3 — Database Schema (Prisma)** ✅ — Full Prisma schema (12 models, 9 enums), seed script with admin/manager/nursery/categories/seedlings. Applied to Neon via `db push`, seeded successfully. Merged to main 2026-04-28.
