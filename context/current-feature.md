# Current Feature

## Feature: 1.8 — Expo Mobile App Scaffold

## Status

Completed

## Goals

- Scaffold @seednest/mobile with Expo SDK 52, expo-router v4, file-based routing
- NativeWind v4 (Tailwind v3) for styling, Zustand for auth state, SecureStore for token
- Bottom tab navigator (5 tabs), auth stack (sign-in/up/verify-email/forgot-password)
- Reusable components: Button, Input, Screen, EmptyState, LoadingSpinner

## Notes

- Auth uses Bearer tokens (SecureStore) — backend needs bearer plugin for full integration
- `EXPO_PUBLIC_API_URL` controls the API base URL in Expo
- NativeWind v4 uses Tailwind CSS v3 (separate from web's Tailwind v4)
- `main: "expo-router/entry"` is required for file-based routing

## History

- **1.8 — Expo Mobile App Scaffold** ✅ — Scaffold @seednest/mobile with Expo SDK 52, expo-router v4, file-based routing. NativeWind v4 (Tailwind v3) for styling, Zustand for auth state, SecureStore for token. Bottom tab navigator (5 tabs), auth stack (sign-in/up/verify-email/forgot-password). Reusable components: Button, Input, Screen, EmptyState, LoadingSpinner.
- **1.7 — Auth Pages (Web)** ✅ — All 5 auth pages implemented: sign-up (role select, show/hide password), sign-in (Google OAuth, role-based redirect), verify-email (6-box OTP with auto-advance + 60s resend cooldown), forgot-password (always-safe response), reset-password (confirm password match). emailOTP plugin added to backend. Shared zod upgraded to v4. Zero TS errors.
- **1.6 — Next.js Web App Scaffold** ✅ — Next.js 15 + Tailwind v4 + shadcn/ui (22 components, zinc base, green CSS vars). TanStack Query, Better Auth client, Axios. Route groups (public/auth/customer/manager). Auth middleware with role-based redirects. Zero TS errors.
- **1.5 — Better Auth Configuration** ✅ — Better Auth wired to Prisma adapter; email/password with verification; optional Google OAuth; React Email templates (verification, reset-password, welcome); full `requireAuth`/`requireRole` middleware; `/api/auth` mounted in Express. Zero TS errors.
- **1.4 — Shared Types Package** ✅
- **1.1 — Monorepo Scaffold** ✅
- **1.2 — Backend: Express + Prisma Setup** ✅
- **1.3 — Database Schema (Prisma)** ✅
