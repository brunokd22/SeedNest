# Current Feature

## Feature: 1.5 — Better Auth Configuration

## Status

Completed

## Goals

- Configure Better Auth with Prisma adapter, email/password, Google OAuth (optional)
- Create React Email templates (verification, reset-password, welcome)
- Implement full auth middleware (requireAuth, requireRole)
- Mount `/api/auth` routes in Express

## Notes

- Google OAuth is gated on `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` env vars (optional)
- Email rendered with `@react-email/components` + `@react-email/render`
- Auth middleware reads session via `auth.api.getSession` + `fromNodeHeaders`

## History

- **1.5 — Better Auth Configuration** ✅ — Better Auth wired to Prisma adapter; email/password with verification; optional Google OAuth; React Email templates (verification, reset-password, welcome); full `requireAuth`/`requireRole` middleware; `/api/auth` mounted in Express. Zero TS errors.
- **1.4 — Shared Types Package** ✅ — `packages/shared/src/` populated with types (user, nursery, order, issue, api), constants, and Zod schemas (auth, nursery, seedling, order, issue). All enums match Prisma schema. Compiles with zero TypeScript errors.
- **1.1 — Monorepo Scaffold** ✅ — Turborepo + pnpm workspaces, `packages/tsconfig` (base/nextjs/react-native), `@seednest/shared`. Merged to main 2026-04-20.
- **1.2 — Backend: Express + Prisma Setup** ✅ — `@seednest/api` with Express, Zod env validation, Prisma singleton, R2/Stripe/Resend config, error handler, validate middleware, auth stubs, haversine util, and `GET /api/health`. Merged to main 2026-04-20.
- **1.3 — Database Schema (Prisma)** ✅ — Full Prisma schema (12 models, 9 enums), seed script with admin/manager/nursery/categories/seedlings. Applied to Neon via `db push`, seeded successfully. Merged to main 2026-04-28.
