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

## Architecture Decisions

See `planning/DECISIONS.md`.

## UX Standard

See `docs/UX_VISUAL_STANDARD.md`.
