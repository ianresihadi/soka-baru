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
| Role access | Permission matrix, backend tenant-isolation tests, and optional RLS tests. | Done (Sprint 002/003) | 39 automated tests across `tenant.test.ts` + `onboarding.test.ts`. RLS deferred. |
| Onboarding | Tests for school/class/student/teacher setup and parent links across two schools. | Done (Sprint 003) | `apps/api/src/__tests__/onboarding.test.ts`. |
| Parent-student links | Link-code generation, redemption, expiry/revoke, and parent-child access. | Done (Sprint 003) | Covered in `onboarding.test.ts`. |
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

## Sprint 003 — Admin Onboarding

Automated tests in `apps/api/src/__tests__/onboarding.test.ts` (PGlite + real
migrations). What is proven:

- Only `soka_internal` can create schools; duplicate `school_code` rejected;
  non-internal users get 403.
- Admin can create classes, create/import students, assign students to classes,
  and assign teacher memberships to classes (non-teacher membership → 422).
- Cross-school isolation: an admin cannot use another school's class, student,
  or teacher membership id (404), and listings never include other schools' rows.
- Parent link-code lifecycle: generate → redeem (grants `orang_tua` + link) →
  re-redeem rejected (`code_used`); unknown, expired, and revoked codes rejected.
- `GET /me/children` returns only the parent's linked children.
- Admin role guard: an `orang_tua` user is denied `/admin/*` (403).
- Audit: `parent_link_code.created` and `parent_student_link.created` events are
  recorded.

Total suite: 39 tests across `tenant.test.ts` (17) and `onboarding.test.ts` (22).
