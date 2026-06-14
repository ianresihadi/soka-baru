# Architecture

## Overview

SOKA Baru architecture has an approved MVP baseline for Sprint 002. Later sprints may refine it through an explicit decision or ADR.

The working direction is a staged school operating platform:

- Desktop/tablet-first web dashboard for Guru/Wali Kelas with responsive mobile fallback.
- PWA/mobile web first for Orang Tua, designed for later Capacitor wrapping.
- Siswa platform prepared for Phase 2, not active in MVP.
- Custom backend with multi-tenant school data and role-based permissions.
- Existing SOKA Lama code may inform implementation, but must be migrated selectively.
- Notification delivery starts with in-app notification records, attempts browser push if feasible, and defers native push until Capacitor/Play Store.

## Approved MVP Stack

- Frontend: React, Vite, TypeScript, Tailwind.
- Teacher interface: desktop/tablet-first web dashboard with responsive mobile fallback.
- Parent interface: mobile-first PWA/mobile web, designed for later Capacitor wrapping.
- Backend API: Hono custom TypeScript API.
- Database: Neon Postgres.
- ORM and migrations: Drizzle ORM.
- Auth: Better Auth for email/password login and sessions.
- Tenancy: explicit `school_id` scoping in backend service/query layer, with Postgres Row Level Security as defense-in-depth where compatible.

## Reference Stack From SOKA Lama

SOKA Lama appears to use:

- React
- Vite
- TypeScript
- Tailwind
- Supabase

This is reference context only. Supabase is not the SOKA Baru backend baseline.

## Workspace Structure (Sprint 002)

pnpm workspaces monorepo (no Turborepo/Nx yet — see `planning/DECISIONS.md`):

```text
apps/
  api/        # Hono API: createApp factory, middleware, foundation routes
  web/        # React/Vite/Tailwind minimal validation UI (Sprint 002 only)
packages/
  db/         # Drizzle schema, migrations, client, tenant-aware repositories, seed
  auth/       # Better Auth config (email/password, Drizzle adapter)
  shared/     # Role enum, shared types, zod validation schemas
```

Internal packages are consumed as TypeScript source (no build step); `tsx`,
Vite, and Vitest transpile on the fly, and each package runs `tsc --noEmit`.

Tenant isolation is enforced in the backend service/query layer. The active
`school_id` is resolved server-side from membership data; handlers never trust a
client-supplied `school_id`. Postgres RLS is deferred (see `docs/PERMISSIONS.md`).

## Architecture Decisions

See `planning/DECISIONS.md`.

## UX Standard

See `docs/UX_VISUAL_STANDARD.md`.
