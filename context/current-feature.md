# Current Feature

## Feature: 1.3 — Database Schema (Prisma)

## Status

In Progress

## Goals

- Create the complete Prisma schema for SeedNest
- Write seed script with admin, manager, nursery, categories, and seedlings
- Run `prisma migrate dev` and `prisma db seed` successfully

## Notes

- Schema lives at `apps/api/prisma/schema.prisma`
- Uses Neon (PostgreSQL) — project `devstash`, branch `development`
- Seed uses `bcryptjs` for password hashing

## History

- **1.1 — Monorepo Scaffold** ✅ — Turborepo + pnpm workspaces, `packages/tsconfig` (base/nextjs/react-native), `@seednest/shared`. Merged to main 2026-04-20.
- **1.2 — Backend: Express + Prisma Setup** ✅ — `@seednest/api` with Express, Zod env validation, Prisma singleton, R2/Stripe/Resend config, error handler, validate middleware, auth stubs, haversine util, and `GET /api/health`. Merged to main 2026-04-20.
