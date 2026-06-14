# Sprint 008 Requirements: Admin Setup UI Hardening

## Goal

Make the existing Sprint 003 onboarding APIs usable through a constrained
admin/setup surface inside the Sprint 007 app shell.

Sprint 008 should let a real first-pilot operator set up the minimum school data
needed for SOKA's teacher-parent trust loop without using raw API calls or
editing seed files:

- classes
- students
- class assignment
- teacher assignment to classes
- parent link code generation/revocation
- basic school settings already supported by the API

This is **not** a full TU/Admin Sekolah module. It is a setup hardening sprint
for first-pilot operations.

## Product Context

Sprint 003 created the backend onboarding layer. Sprint 007 made SOKA demoable
through a role-aware app shell and deterministic seed data. The next practical
gap is that real onboarding still depends on internal scripts, seed data, or raw
API calls.

Sprint 008 should expose only the already-approved setup workflows needed to get
a school ready for:

- Papan Pagi
- attendance
- parent child visibility
- parent messages
- grades and student notes

It must not widen SOKA into a full school administration suite.

## Users

Primary setup users:

- `admin_sekolah`
- `soka_internal`

Indirectly affected users:

- `guru`
- `wali_kelas`
- `orang_tua`

Out of active scope:

- full TU staff role/product
- `kepala_sekolah`
- `siswa`

## In Scope

### 1. Admin Workspace In App Shell

Add a third workspace option for users with `admin_sekolah` or `soka_internal`:

- Admin / Setup workspace
- visible only when membership roles allow it
- reachable from the existing Sprint 007 role switcher/shell
- no dead navigation

The workspace should be operational and compact, not a separate admin product.

### 2. Class Setup

Use existing APIs:

- `GET /admin/classes`
- `POST /admin/classes`

Capabilities:

- list existing classes in the current tenant
- create a class with name, grade level, academic year if supported
- show empty/loading/error states
- refresh list after create

### 3. Student Setup

Use existing APIs:

- `GET /admin/students`
- `POST /admin/students`
- `POST /admin/students/bulk`
- `POST /admin/students/:id/assign-class`

Capabilities:

- list students
- create a single student
- assign/reassign student to a class
- create multiple students through a simple text/CSV-like input or JSON textarea
  if it maps safely to the existing `bulk` endpoint

Bulk import should stay simple. Do not build Excel parsing or complex import
mapping.

### 4. Teacher Assignment

Use existing API:

- `POST /admin/classes/:id/teachers`

Capabilities:

- assign an existing teacher membership to a class
- choose role in class: `wali_kelas` or `guru`
- optional subject if supported by the existing API
- show clear failure when the membership is not a teacher membership

Important:

- Sprint 008 does **not** create teacher accounts or privileged memberships from
  the UI unless an already-existing safe API supports it.
- If the current backend lacks a teacher-membership listing endpoint, Builder
  may add a narrowly scoped admin endpoint that lists same-tenant memberships
  eligible for teacher assignment. It must not expose cross-school users or
  create a general user-management module.

### 5. Parent Link Codes

Use existing APIs:

- `POST /admin/parent-link-codes`
- `GET /admin/parent-link-codes`
- `POST /admin/parent-link-codes/:id/revoke`

Capabilities:

- generate a link code for a selected student
- list active/used/revoked/expired codes
- copy/display code clearly
- revoke active codes

No free parent self-claim by name/NISN. Parent linking remains school-issued
code only.

### 6. Basic School Settings

Use existing API:

- `PATCH /admin/school-settings`

If there is no admin settings read route beyond `GET /guru/settings`, Builder
may reuse `GET /guru/settings` only if existing role guards allow
`admin_sekolah`/`soka_internal`.

Capabilities:

- update attendance cutoff
- update school timezone
- update default KKM

Do not create a full settings product. Keep it to existing `school_settings`
fields.

### 7. UX And Safety

The admin setup UI should:

- be dense-but-calm and operational
- make tenant context visible
- avoid destructive surprises
- show clear success/error messages
- never ask for or send `school_id`
- avoid hidden magic writes
- avoid dead routes/menus

### 8. Tests And Validation

Backend tests are required if Builder adds or changes any API/service behavior.

Frontend build/typecheck is required for UI changes.

The existing 100 API tests must remain green.

## Out Of Scope

- Full TU/Admin Sekolah product.
- General user management.
- Creating teacher/admin accounts from UI unless a safe scoped API already
  exists or is explicitly approved in this sprint as a narrow helper.
- Staff HR records.
- Staff attendance.
- Payments/SPP, invoices, receipts, reconciliation.
- Documents, letters, archives, government reporting.
- Institutional calendar.
- Principal analytics.
- Student login or learning workflows.
- Full Excel importer, spreadsheet mapping, or import wizard.
- Parent premium.
- Broadcast/Pengumuman.
- Browser/native push.
- New database-per-school architecture.

## Required Documentation Updates By Builder

Builder must update:

- `docs/API.md` if routes are added or clarified
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`
- `docs/SETUP.md` or `docs/PILOT_SMOKE_CHECKLIST.md` if setup flow changes
- `planning/STATE.md`
- `planning/sprints/008-admin-setup-ui-hardening/completion-notes.md`

Builder must update `planning/DECISIONS.md` only if a durable decision changes.
