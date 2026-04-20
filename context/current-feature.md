# Current Feature

## Feature: 1.2 — Backend: Express + Prisma Setup

## Status

In Progress

## Goals

- Scaffold production-ready Express + TypeScript + Prisma backend in `apps/api`
- Validate all env vars at startup with Zod
- `GET /api/health` returns `{ status: "ok", timestamp: "..." }`
- All config modules (Prisma, R2, Stripe, Resend) import without throwing

## Notes

- Package name: `@seednest/api`
- Uses `tsx` for dev, `tsup` for build
- Auth middleware stubs only — full implementation in Spec 1.5

## History

- **1.1 — Monorepo Scaffold** ✅ — Turborepo + pnpm workspaces, `packages/tsconfig` (base/nextjs/react-native), `@seednest/shared`. Merged to main 2026-04-20.
