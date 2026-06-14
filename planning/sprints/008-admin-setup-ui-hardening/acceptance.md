# Sprint 008 Acceptance Criteria

Sprint 008 is complete when all criteria below are met.

## Admin Workspace Access

- Users with `admin_sekolah` or `soka_internal` can access an Admin/Setup
  workspace from the app shell.
- Users without admin roles cannot see or access the Admin/Setup workspace.
- Teacher and parent workspaces from Sprint 007 still work.
- Role switching remains clear for multi-role users.

## Class Setup

- Admin can list classes in their own tenant.
- Admin can create a class.
- Created classes appear after refresh/create.
- Cross-tenant class data is not shown.

## Student Setup

- Admin can list students in their own tenant.
- Admin can create a single student.
- Admin can create multiple students through a simple supported bulk input.
- Admin can assign/reassign a student to a class in the same tenant.
- Student assignment rejects cross-school class/student combinations through
  existing backend validation.

## Teacher Assignment

- Admin can assign an existing teacher membership to a class.
- Admin can choose `wali_kelas` or `guru` role in class.
- If subject is supported, admin can supply it for `guru`.
- Non-teacher memberships are rejected clearly.
- If a new teacher-membership listing endpoint is added, it returns same-tenant
  eligible memberships only and is covered by tests.

## Parent Link Codes

- Admin can generate a parent link code for a selected student.
- Admin can list existing parent link codes.
- Admin can revoke an active code.
- Parent linking remains code-based; no free claim by student name/NISN is
  introduced.

## School Settings

- Admin can view or load current settings using an allowed route.
- Admin can update attendance cutoff, school timezone, and default KKM.
- Invalid timezone or invalid setting values produce clear errors and are not
  silently saved.

## UX

- Admin workspace is operational and compact.
- It uses clear sections/tabs/chips with no dead navigation.
- Tenant context is visible enough for setup confidence.
- Success/error/loading/empty states are understandable.
- The UI never asks for `school_id`.

## Permissions And Tenant Isolation

- `/admin/*` behavior remains restricted to `admin_sekolah`/`soka_internal`.
- Existing parent visibility rules remain unchanged.
- Existing teacher class-access rules remain unchanged.
- Existing 100 API tests remain green.
- Any new backend route has focused tests proving auth, role guard, and
  tenant isolation.

## Documentation

- `docs/API.md` is updated for any added route.
- `docs/PERMISSIONS.md` documents Admin Setup UI access.
- `docs/VALIDATION.md` documents Sprint 008 validation and test counts.
- `docs/PILOT_SMOKE_CHECKLIST.md` includes an admin setup path.
- `planning/STATE.md` and Sprint 008 completion notes are updated.

## Validation Commands

Before opening the PR, Builder must run:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
pnpm validate
```

If the local environment cannot run `pnpm validate` because nested `pnpm` is not
on PATH, Builder must run the three constituent commands and document the exact
environment issue.

## Scope Guardrails

Sprint 008 must not include:

- full TU/admin product
- general user management
- public privileged role assignment
- payment/finance workflows
- documents/letters/government reporting
- principal analytics
- student login or learning workflows
- broadcast/pengumuman
- push delivery
- Sprint 009 work
