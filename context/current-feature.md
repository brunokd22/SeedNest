# Current Feature

## Feature: 1.4 — Shared Types Package

## Status

Completed

## Goals

- Populate `packages/shared/src/` with TypeScript types, constants, and Zod schemas
- All enum values must match the Prisma schema from Spec 1.3
- Package compiles with no TypeScript errors
- Zod schemas importable from both `apps/api` and `apps/web`

## Notes

- Enums are defined directly in shared types (not imported from `@prisma/client`) so both apps can consume them
- `packages/shared` depends on `zod`; no Prisma dependency

## History

- **1.4 — Shared Types Package** ✅ — `packages/shared/src/` populated with types (user, nursery, order, issue, api), constants, and Zod schemas (auth, nursery, seedling, order, issue). All enums match Prisma schema. Compiles with zero TypeScript errors.

- **1.1 — Monorepo Scaffold** ✅ — Turborepo + pnpm workspaces, `packages/tsconfig` (base/nextjs/react-native), `@seednest/shared`. Merged to main 2026-04-20.
- **1.2 — Backend: Express + Prisma Setup** ✅ — `@seednest/api` with Express, Zod env validation, Prisma singleton, R2/Stripe/Resend config, error handler, validate middleware, auth stubs, haversine util, and `GET /api/health`. Merged to main 2026-04-20.
- **1.3 — Database Schema (Prisma)** ✅ — Full Prisma schema (12 models, 9 enums), seed script with admin/manager/nursery/categories/seedlings. Applied to Neon via `db push`, seeded successfully. Merged to main 2026-04-28.
