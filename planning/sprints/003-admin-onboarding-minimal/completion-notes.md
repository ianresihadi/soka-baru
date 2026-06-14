# Sprint 003 Completion Notes (Builder)

## Tables / migrations

Migration `packages/db/migrations/0001_*.sql` adds (all school-owned):

- `classes`, `students` (`class_id` homeroom FK), `teacher_assignments`,
  `parent_link_codes`, `parent_student_links`, `audit_events`.

## Service layer

`packages/db/src/onboarding.ts`:

- Platform: `createSchool`, `assignSchoolAdmin`.
- Tenant-scoped: `createClass`/`listClasses`, `createStudent`/`createStudents`/
  `listStudents`, `assignStudentToClass`, `assignTeacherToClass`,
  `createParentLinkCode`/`listParentLinkCodes`/`revokeParentLinkCode`.
- Parent: `redeemParentLinkCode`, `listChildrenForParent`.
- `recordAuditEvent` helper.

Every function that receives a client-supplied id (class/student/membership)
verifies the row belongs to `ctx.schoolId` before acting.

## API routes

`/admin/schools` (soka_internal), `/admin/classes`, `/admin/students`(+`/bulk`),
`/admin/students/:id/assign-class`, `/admin/classes/:id/teachers`,
`/admin/parent-link-codes`(+`/:id/revoke`), `/parent-links/redeem`,
`/me/children`. See `docs/API.md`.

## Access / business rules

- Only `soka_internal` creates schools; other onboarding requires
  `admin_sekolah`/`soka_internal`, scoped to the tenant.
- Redemption is the safe server-controlled path that grants `orang_tua`; public
  self-binding of privileged roles remains blocked (Sprint 002 guard intact).

## Parent link code lifecycle

Single-use, default 14-day expiry (override per request), Crockford Base32
(8 chars), unique with retry. Redeem checks `active` + not expired; on success
ensures parent membership + `orang_tua` role, creates the link, marks code
`used`, writes an audit event. Expiry is checked lazily (no cron). Revoke sets
`status=revoked`.

## Validation

- `pnpm test` → 39 tests pass (17 `tenant.test.ts` + 22 `onboarding.test.ts`),
  in-process PGlite + real migrations.
- `pnpm typecheck` → clean across all packages.
- `apps/web` builds.

## Decisions (approved by Ian)

- School creation restricted to `soka_internal`.
- Student↔class via direct `students.class_id` (one homeroom), not a join table.
- Added `audit_events` table for lightweight trust-sensitive audit.

## Known limitations / what remains

- No admin UI; onboarding is API + tests only (kept minimal, per boundaries).
- Teacher account/membership creation is via internal/seed binding; Sprint 003
  only assigns existing teacher memberships to classes. A staff-onboarding flow
  can be added later if needed.
- `school_settings` deferred to Sprint 004 (attendance cutoff / KKM / status
  thresholds will need it).
- `audit_events` currently records parent-link events; later sprints extend it
  to attendance corrections, grade changes after publication, and note publish.
- Full Better Auth HTTP flow not exercised against a live Postgres here.
