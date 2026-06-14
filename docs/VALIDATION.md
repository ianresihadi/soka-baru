# Validation Plan

## Overview

SOKA Baru should prove correctness through both technical tests and school-workflow checks.

## Validation Principles

- Critical outputs must trace back to source data or explicit user input.
- Attendance, grades, parent links, and permissions require especially careful validation.
- MVP acceptance must be judged against real user workflows, not just code completion.

## Initial Checklist

| Area | Validation Method | Status | Notes |
|---|---|---|---|
| Product scope | Grill decisions recorded in planning files. | In progress | Session 0 started. |
| Role access | Permission matrix, backend tenant-isolation tests, and optional RLS tests. | Done (Sprint 002) | 12 automated tests in `apps/api/src/__tests__/tenant.test.ts`. RLS deferred. |
| Attendance | Unit/integration tests plus manual workflow check. | Not started | Core daily loop candidate. |
| Grades | Tests for KKM, finalization, and parent visibility. | Not started | Scope needs confirmation. |
| Parent messaging | Workflow tests across staff and parent roles. | Not started | Core communication candidate. |

## Sprint 002 — Foundation Tenant Isolation

Automated tests run fully in-process using PGlite (no external Postgres needed)
and apply the real Drizzle migrations before asserting behavior.

Run:

```bash
pnpm install
pnpm db:generate   # generate migrations from schema (offline)
pnpm typecheck     # tsc --noEmit across all packages
pnpm test          # vitest: 12 tenant/auth/role tests
```

What is proven (`apps/api/src/__tests__/tenant.test.ts`):

- `school_code` binding derives `school_id` server-side; unknown code rejected;
  binding is idempotent (no duplicate memberships).
- A user can hold multiple roles; `siswa` is a valid role value with no MVP UI.
- Repository reads/writes are scoped to the caller's tenant; School B data does
  not leak into School A listings.
- A client-supplied foreign `school_id` cannot widen access: at the route layer
  a smuggled `schoolId` in the body is ignored (write lands on the caller's
  school, School B untouched); at the repository layer `assertSameTenant`
  throws `TenantViolationError`.
- Role checks allow `guru`/`wali_kelas` and deny `orang_tua`-only on a protected
  write; unauthenticated requests get 401.

For a live database (Neon/local Postgres), set `DATABASE_URL` then run
`pnpm db:migrate` and `pnpm db:seed` (seeds School A, School B, and a multi-role
user; local-dev credentials only).
