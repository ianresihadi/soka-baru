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
| Role access | Permission matrix, backend tenant-isolation tests, and optional RLS tests. | Done (Sprint 002/003/004/005) | 79 automated tests across `tenant`/`onboarding`/`daily-loop`/`parent-trust`. RLS deferred. |
| Parent messaging | Workflow tests across staff and parent roles. | Done (Sprint 004/005) | Teacher side in `daily-loop`; parent side in `parent-trust`. |
| Attendance | Unit/integration tests plus manual workflow check. | Done (Sprint 004) | `apps/api/src/__tests__/daily-loop.test.ts`. |
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
- Single-use under concurrency: a conditional `active -> used` claim yields
  exactly one winner; two concurrent redeems create exactly one link.
- School creation with an invalid `adminUserId` creates no school (transaction
  aborts) and returns 404.
- `GET /me/children` returns only the parent's linked children.
- Admin role guard: an `orang_tua` user is denied `/admin/*` (403).
- Audit: `parent_link_code.created` and `parent_student_link.created` events are
  recorded.

Total suite (Sprint 003): 42 tests across `tenant.test.ts` (17) and
`onboarding.test.ts` (25).

## Sprint 004 — Guru Daily Loop

Automated tests in `apps/api/src/__tests__/daily-loop.test.ts` (PGlite + real
migrations). What is proven:

- School settings default (`07:30`, `Asia/Jakarta`) and update.
- Teacher can operate an assigned class; an unassigned teacher is rejected;
  admin operates school-wide.
- All five attendance statuses; upsert does not duplicate rows.
- Students from another class/school are rejected; duplicate students rejected.
- Completion `completed_on_time` vs `completed_late` computed from the
  school-local wall-clock cutoff, using injected deterministic `now`
  (07:00 WIB → on time, 08:00 WIB → late); plus `not_started`/`in_progress`.
- Same-day edit needs no reason; post-day change without a reason is rejected;
  with a reason it succeeds and writes an `attendance_record.corrected` audit.
- `sakit`/`izin`/`alpa`/`terlambat` create parent notifications; `hadir` does
  not; re-saving the same status does not duplicate notifications.
- Papan Pagi returns the four sections with cutoff/timezone and includes
  `alpa`-today and `perhatian`/`kritis` students in attention.
- A linked parent can message; teacher sees it as unreplied; a reply clears it;
  unlinked/cross-school messaging is rejected.
- Cross-school isolation: a School A teacher cannot operate a School B class;
  notifications are limited to the user's memberships.
- `orang_tua` and unauthenticated callers cannot access `/guru/*`.
- An invalid `schoolTimezone` on `PATCH /admin/school-settings` is rejected
  (400) and leaves existing settings usable; a valid zone is accepted.

Total suite: 62 tests across `tenant` (17), `onboarding` (25), `daily-loop` (20).

Validation commands:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
```

## Sprint 005 — Parent Trust Loop

Automated tests in `apps/api/src/__tests__/parent-trust.test.ts` (PGlite + real
migrations). What is proven:

- Parent lists only linked children; no-child parent gets a calm empty home.
- Beranda Anak returns selected child, today's attendance, recent history,
  latest notification/thread, and a neutral "belum tercatat" when unrecorded.
- A parent cannot access another parent's child by `studentId` (home/attendance).
- Attendance history is linked-child-only, newest-first, with a max limit; there
  is no parent attendance mutation path.
- Notifications are caller-owned only; mark-read updates only owned rows and
  reports the true updated count; a foreign id stays unread.
- Threads/messages are linked-child-only; another parent's thread is not found;
  sending for an unlinked/cross-school child is rejected.
- `orang_tua` cannot access `/guru/*`; `/parent/home` returns 403 for an
  unlinked `studentId`; `/parent/children` works over session only.
- `needsAction` is true when any unread notification exists for the child, even
  if the latest notification is already read (older-unread case).

Total suite: 79 tests across `tenant` (17), `onboarding` (25), `daily-loop` (20),
`parent-trust` (17). No schema change in Sprint 005 (reused `notifications.read_at`).
