# API

## Overview

API design starts from the approved Sprint 002 stack baseline.

## API Baseline

- Hono custom TypeScript API.
- Better Auth for email/password auth and session handling.
- Drizzle ORM for typed database access and migrations.
- Neon Postgres as the primary database.
- Tenant-aware service/query layer that scopes school-owned reads and writes by `school_id`.
- Optional Postgres Row Level Security as defense-in-depth where it fits the Better Auth session model cleanly.

Session 5 confirms the MVP auth baseline:

- Email/password login.
- Unique `school_code` per school.
- User binding to `school_id` during account creation or first login.

## Required API Behaviors For Sprint 002

- Authenticate a user through email/password.
- Resolve the user's active school membership and role assignments.
- Bind a user to a school through `school_code` or school-issued invitation/link code.
- Reject cross-school reads and writes.
- Support one user with multiple roles in the same school.
- Keep Siswa role representable in the model without exposing Siswa MVP UI.

Supabase APIs are not part of the SOKA Baru baseline.

## Implemented In Sprint 002

The Hono API lives in `apps/api`. App wiring is a factory, `createApp(deps)`
(`apps/api/src/app.ts`), so tests can inject a stub auth resolver and an
in-process database. The production server (`apps/api/src/index.ts`) injects
Better Auth session resolution and the Neon Postgres database.

Routes:

| Route | Auth | Purpose |
|---|---|---|
| `GET /health` | none | Liveness check. |
| `GET|POST /api/auth/*` | Better Auth | Email/password sign-up, sign-in, session. |
| `GET /me` | session | Returns the authenticated `userId`. |
| `GET /me/memberships` | session | Lists the user's memberships, schools, and roles. |
| `POST /school-bindings/by-code` | session | Binds the user to a school via `schoolCode`. Self-assignable roles are restricted to `SELF_BINDABLE_ROLES` (`orang_tua` only); requesting any privileged role returns 403. |
| `GET /tenant-check/school` | session + membership | Validation scaffold: returns the caller's tenant school. |
| `POST /tenant-check/school` | session + membership + role | Validation scaffold: scoped write; ignores any client `schoolId`. |

The `tenant-check` routes are validation scaffolding, not product workflows.

Middleware pattern (`apps/api/src/app.ts`): `requireAuth` resolves the user
from the session, `requireMembership` resolves the active tenant context
server-side, and `requireRole(...)` checks assigned roles. Handlers never read
`school_id` from the request body for authorization.

Better Auth is configured in `packages/auth/src/auth.ts` (email/password only,
Drizzle adapter, shared Neon database).

## Implemented In Sprint 003 (Admin Onboarding)

Onboarding routes. All `/admin/*` routes require an authenticated session, an
active membership, and a role; foreign keys in the body/params are verified to
belong to the caller's tenant before use.

| Route | Required role | Purpose |
|---|---|---|
| `POST /admin/schools` | `soka_internal` | Create a school; optionally bind an `adminUserId` as `admin_sekolah`. |
| `POST /admin/classes` | `admin_sekolah`/`soka_internal` | Create a class. |
| `GET /admin/classes` | `admin_sekolah`/`soka_internal` | List classes in the tenant. |
| `POST /admin/students` | `admin_sekolah`/`soka_internal` | Create a student (optional `classId`). |
| `POST /admin/students/bulk` | `admin_sekolah`/`soka_internal` | Import students from a JSON array. |
| `GET /admin/students` | `admin_sekolah`/`soka_internal` | List students in the tenant. |
| `POST /admin/students/:id/assign-class` | `admin_sekolah`/`soka_internal` | Assign a student to a class (same school). |
| `POST /admin/classes/:id/teachers` | `admin_sekolah`/`soka_internal` | Assign a teacher membership to a class (`wali_kelas`/`guru`). |
| `POST /admin/parent-link-codes` | `admin_sekolah`/`soka_internal` | Generate a single-use parent link code for a student. |
| `GET /admin/parent-link-codes` | `admin_sekolah`/`soka_internal` | List link codes in the tenant. |
| `POST /admin/parent-link-codes/:id/revoke` | `admin_sekolah`/`soka_internal` | Revoke a link code. |
| `POST /parent-links/redeem` | session only | Parent redeems a code; school/student derived from the code, grants `orang_tua`. |
| `GET /me/children` | session only | List the parent's linked children. |

Only `soka_internal` may create schools (avoids the chicken-and-egg of needing
a school admin before the school exists). School creation and admin binding run
in a single transaction: an invalid `adminUserId` aborts the whole operation
(`404 admin_user_not_found`) so no orphan school is created. Teacher
*accounts/memberships* are created via internal/seed binding; Sprint 003 only
assigns existing teacher memberships to classes.

Parent link-code redemption is atomically single-use: the code is claimed with a
conditional `active -> used` update inside a transaction, so under concurrent
redeems exactly one succeeds and the rest get `400 code_used`.
