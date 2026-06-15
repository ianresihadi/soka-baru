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

## Implemented In Sprint 004 (Guru Daily Loop)

Teacher/admin routes require an authenticated session, an active membership, and
a teacher-or-admin role; class access is verified against `teacher_assignments`
(admins operate school-wide). `orang_tua` cannot access `/guru/*`.

| Route | Required role | Purpose |
|---|---|---|
| `GET /guru/classes` | guru/wali_kelas/admin/internal | Classes the caller can operate. |
| `GET /guru/settings` | guru/wali_kelas/admin/internal | School settings (cutoff, timezone). |
| `GET /guru/papan-pagi?classId&date` | guru/wali_kelas/admin/internal | Papan Pagi summary (4 sections + roster). |
| `PUT /guru/classes/:classId/attendance/:date` | guru/wali_kelas/admin/internal | Upsert class attendance; post-day change needs `correctionReason`. |
| `GET /guru/messages/unreplied?classId` | guru/wali_kelas/admin/internal | Unreplied parent threads for assigned classes. |
| `POST /guru/messages/:threadId/reply` | guru/wali_kelas/admin/internal | Reply; clears the thread from unreplied. |
| `PATCH /admin/school-settings` | admin_sekolah/soka_internal | Update cutoff/timezone. |
| `POST /parent/messages` | session + linked parent | Parent message about a linked child. |
| `GET /me/notifications` | session | Notification records for the user's memberships. |

Papan Pagi sections are returned in the fixed product order: (1) Status Absensi
Hari Ini, (2) Pesan Ortu Belum Dibalas, (3) Siswa Perlu Perhatian, (4) Jadwal
Mengajar Hari Ini. Attendance completion is `not_started`/`in_progress`/
`completed_on_time`/`completed_late`, computed against the school-local cutoff.
Notification records are created only for `sakit`/`izin`/`alpa`/`terlambat`
(never `hadir`), with no push delivery in Sprint 004.

`PATCH /admin/school-settings` validates `schoolTimezone` against the runtime's
`Intl` timezone database and returns `400 invalid_input` for an unknown zone, so
a bad value can never be saved and break Papan Pagi/attendance.

## Implemented In Sprint 005 (Parent Trust Loop)

Parent routes require only an authenticated session (`requireAuth`, not
`requireMembership`). Access is derived from `parent_student_links` joined to the
caller's memberships; no route accepts `school_id` and a parent can only reach
linked children. List endpoints have default and max limits.

| Route | Auth | Purpose |
|---|---|---|
| `GET /parent/children` | session | Linked children with class/school context (deterministic order). |
| `GET /parent/home?studentId` | session | Beranda Anak aggregate; `403 not_linked` for an unlinked `studentId`; calm empty state when no children. |
| `GET /parent/attendance?studentId&from&to&limit` | session | Read-only attendance history for a linked child (default 30, max 100). |
| `GET /parent/notifications?studentId&limit` | session | Caller-owned notifications, optional child filter (default 50, max 100). |
| `POST /parent/notifications/read` | session | Mark caller-owned notifications read; returns the count actually updated. |
| `GET /parent/messages/threads?studentId&limit` | session | Threads for linked children (default 50, max 100). |
| `GET /parent/messages/threads/:threadId` | session | Thread detail + chronological messages (`404` if not the caller's thread). |
| `POST /parent/messages` | session + linked parent | Existing send route (verifies the parent-student link). |

Beranda Anak returns selected child, child list (switcher), today's attendance
(or neutral null), a simple non-scoring `reassurance` (`headline`,
`needsAction`, `reasons`), latest notification, latest message thread, and
recent attendance. There is no parent attendance write path. In-app only; no
push.

## Implemented In Sprint 006 (Nilai & Catatan)

Teacher/admin routes require session + membership + a teacher/admin role and
class access via `teacher_assignments` (admins school-wide). Parent routes are
session-only and published-only.

| Route | Auth | Purpose |
|---|---|---|
| `GET /guru/classes/:classId/grades?studentId&subject&visibility&limit` | teacher/admin | List grades for an allowed class. |
| `POST /guru/classes/:classId/grades` | teacher/admin | Create a draft grade (KKM defaults from `school_settings.default_kkm`). |
| `PATCH /guru/grades/:gradeId` | teacher/admin | Update grade; an update after publish writes a `grade.updated` audit. |
| `POST /guru/grades/:gradeId/publish` | teacher/admin | Publish to linked parents (idempotent; notifies once). |
| `GET /guru/classes/:classId/student-notes?studentId&visibility&limit` | teacher/admin | List notes for an allowed class. |
| `POST /guru/classes/:classId/student-notes` | teacher/admin | Create an internal note. |
| `PATCH /guru/student-notes/:noteId` | teacher/admin | Update note; published-content change writes `student_note.updated` audit. |
| `POST /guru/student-notes/:noteId/publish` | teacher/admin | Publish/share (idempotent; notifies; audits). |
| `POST /guru/student-notes/:noteId/unpublish` | teacher/admin | Return to internal (audits; keeps historical notifications). |
| `GET /parent/grades?studentId&limit` | session | Published grades for a linked child (`isBelowKkm` per record). |
| `GET /parent/grades/summary?studentId` | session | `{ total, belowKkm }` over published grades. |
| `GET /parent/student-notes?studentId&limit` | session | Published notes for a linked child. |

`isBelowKkm` is computed as `(score / maxScore) * 100 < kkm` (percentage),
correct when `maxScore != 100`. Grade create/update reject `score > maxScore`
(422). Publish uses a conditional claim (`draft -> published` /
`internal -> published`) so concurrent publishes notify/audit exactly once.
Draft grades and internal notes are never returned by parent routes. Post-publish
grade updates are audited but do NOT emit a new parent notification. In-app only;
no push.

## Implemented In Sprint 008 (Admin Setup UI Hardening)

Sprint 008 adds the Admin / Setup web workspace over the existing `/admin/*`
onboarding routes. It introduces exactly one new backend route — a narrow,
read-only membership listing used by the teacher-assignment selector.

| Route | Required role | Purpose |
|---|---|---|
| `GET /admin/memberships?role=guru\|wali_kelas` | `admin_sekolah`/`soka_internal` | List same-tenant teacher-eligible memberships for class assignment. |

Behavior:

- Read-only. No write capability, no account/role creation, no general user
  management.
- Tenant-scoped: returns only memberships in the caller's server-resolved
  `school_id`; a client-supplied `schoolId` query param is ignored.
- Returns minimal fields only: `membershipId`, `userId`, `name`, `email`,
  `roles[]`.
- Always teacher-eligible: when `role` is omitted it defaults to all teacher
  roles (`guru`/`wali_kelas`), so parent-only and admin-only memberships are
  never returned. `role` (if present) must be `guru` or `wali_kelas` and narrows
  within that set; any other value returns `400 invalid_input`.

The workspace reuses existing routes for the rest of setup: `GET|POST
/admin/classes`, `GET|POST /admin/students`, `POST /admin/students/bulk`,
`POST /admin/students/:id/assign-class`, `POST /admin/classes/:id/teachers`,
`GET|POST /admin/parent-link-codes`, `POST /admin/parent-link-codes/:id/revoke`,
`GET /guru/settings` (read; its existing guard already admits admin roles), and
`PATCH /admin/school-settings` (attendance cutoff, school timezone, and default
KKM). `schoolSettingsUpdateSchema` accepts `defaultKkm` as a 0–100 integer
(matching per-grade KKM rules); an out-of-range or non-integer value returns
`400 invalid_input` and is not persisted. No new settings route was added — the
existing PATCH carries the new field.
