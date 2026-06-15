# Sprint 008 Completion Notes: Admin Setup UI Hardening

Status: Implemented by Builder on branch `claude/sprint-008-admin-setup`. Ready
for Architect review. PR not merged.

## Admin workspace changes

- Added a third app-shell workspace, **Admin / Setup**, shown only to users whose
  memberships include `admin_sekolah` or `soka_internal`.
- New components:
  - `apps/web/src/AdminSetupWorkspace.tsx` — compact, dense-but-calm workspace
    with chip nav over six real sections: Ringkasan (tenant context + counts),
    Kelas, Siswa, Penugasan Guru, Kode Tautan Ortu, Pengaturan Sekolah. Per-action
    success/error notices, loading/empty states, refresh-after-write, and a
    confirm before revoking a code. Never sends `school_id`.
  - `apps/web/src/adminSetupApi.ts` — typed client over the existing `/admin/*`
    routes + the new `GET /admin/memberships`, with friendly error mapping.
- Shell wiring:
  - `apps/web/src/api.ts` — `WorkspaceAccess` gains `admin`; added
    `availableWorkspaces()` and a shared `Workspace = "teacher"|"parent"|"admin"`.
  - `apps/web/src/RoleSwitcher.tsx` — now renders exactly the `available`
    workspaces passed in (supports 2–3 options), labelled incl. "Admin / Setup".
  - `apps/web/src/AppShell.tsx` — computes available workspaces, renders the
    switcher when >1, renders `AdminSetupWorkspace` with tenant context, and falls
    back to the empty state when none.

## Backend changes

- Added one narrow, read-only route: **`GET /admin/memberships?role=guru|wali_kelas`**
  (`apps/api/src/app.ts`), guarded by `requireAuth` + `requireMembership` +
  `requireAdmin`. `role` must be `guru`/`wali_kelas` else `400 invalid_input`; a
  client-supplied `schoolId` query param is ignored.
- Added service helper `listTeacherMembershipsForTenant(db, ctx, roleFilter?)`
  in `packages/db/src/onboarding.ts`: same-tenant memberships joined to `user`,
  returning minimal fields (`membershipId`, `userId`, `name`, `email`, `roles[]`).
  Always teacher-eligible — when `roleFilter` is omitted it defaults to
  `guru`/`wali_kelas`, so parent-only and admin-only memberships are never
  returned (Architect P2 fix); an explicit filter narrows within teacher roles.
  Read-only; no account or role creation; not general user management.
- Extended school settings to make **default KKM editable** (Architect review):
  `schoolSettingsUpdateSchema` now accepts `defaultKkm` (0–100 integer, matching
  per-grade KKM rules); `updateSchoolSettings` persists it. No new route — the
  existing `PATCH /admin/school-settings` carries the field. Invalid values
  return `400 invalid_input` and are not persisted.
- No schema/migration (the `school_settings.default_kkm` column already existed).
  No change to parent visibility, teacher class-access, or existing onboarding
  behavior.

## Seed change (deterministic, idempotent, local-dev only)

- `packages/db/src/seed.ts` now also creates `admin.a@example.com` bound to
  School A with `admin_sekolah` (via the internal `bindUserToSchoolByCode` path,
  never public self-binding) so the Admin / Setup workspace is demoable locally.
  Idempotent; no production credentials.

## API routes used / added

- Used (existing): `GET|POST /admin/classes`, `GET|POST /admin/students`,
  `POST /admin/students/bulk`, `POST /admin/students/:id/assign-class`,
  `POST /admin/classes/:id/teachers`, `GET|POST /admin/parent-link-codes`,
  `POST /admin/parent-link-codes/:id/revoke`, `GET /guru/settings` (read; its
  existing guard already admits admin roles), `PATCH /admin/school-settings`
  (now also carries `defaultKkm`).
- Added: `GET /admin/memberships`.

## Tests added / final count

- Added 7 focused tests for `GET /admin/memberships` in
  `apps/api/src/__tests__/onboarding.test.ts`: requires auth (401); forbids
  teacher-only (403) and `orang_tua` (403); same-tenant only (School A admin
  cannot see School B's membership); `?role=` teacher filtering excludes
  parent-only; rejects unsupported role filter (400); ignores a client `schoolId`.
- Added 3 tests for `defaultKkm` on `PATCH /admin/school-settings` in
  `apps/api/src/__tests__/daily-loop.test.ts`: admin updates it (persisted);
  out-of-range (150) / non-integer (70.5) rejected (400) and not persisted;
  non-admin forbidden (403). Existing timezone validation remains green.
- Final: **110 tests passing** (was 100). Suite: tenant 17, onboarding **32**,
  daily-loop **23**, parent-trust 17, academic-records 21.

## Validation command results

- `pnpm install` — ok.
- `pnpm test` — 110/110 passing.
- `pnpm typecheck` — clean across all packages (incl. new admin UI).
- `pnpm --filter @soka/web build` — succeeds.
- `pnpm validate` — succeeds (runs the three above; no nested-pnpm PATH issue in
  this environment).
- Live DB migrate/seed and the admin UI HTTP flow were not exercised here (no
  `DATABASE_URL`); documented in `docs/SETUP.md` + `docs/PILOT_SMOKE_CHECKLIST.md`.

## Documentation updated

- `docs/API.md` — `GET /admin/memberships` + Admin Setup usage notes.
- `docs/PERMISSIONS.md` — Sprint 008 Admin Setup UI access section.
- `docs/VALIDATION.md` — Sprint 008 tests + results (107).
- `docs/SETUP.md` — admin demo account + admin-UI notes; removed the stale
  "no admin setup UI yet" note.
- `docs/PILOT_SMOKE_CHECKLIST.md` — added an admin setup path (steps A–G).
- `planning/STATE.md` + this completion-notes file.
- `planning/DECISIONS.md` unchanged — no durable decision changed (the read-only
  membership endpoint is within existing Sprint 003/008 scope).

## Explicit deferrals

- Default KKM editing is **in scope and implemented** (Architect review reversed
  the earlier read-only deferral): editable via `PATCH /admin/school-settings`.
- Not built: full TU/admin product, general user management, account/role
  creation from UI, staff HR/attendance, payments/finance/invoices,
  documents/letters/government reporting, institutional calendar, principal
  analytics, student login/learning workflows, complex/Excel importer, parent
  premium, broadcast/Pengumuman, push, DB-per-school, Sprint 009.
