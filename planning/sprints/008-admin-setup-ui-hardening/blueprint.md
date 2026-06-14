# Sprint 008 Blueprint: Admin Setup UI Hardening

## Builder Summary

Sprint 008 wraps existing onboarding APIs in a constrained admin/setup workspace.

Primary implementation shape:

- add admin/setup workspace access to the Sprint 007 app shell
- add an `AdminSetupWorkspace` UI in `apps/web`
- add client helpers for existing `/admin/*` and settings routes
- add only narrowly scoped backend support if the UI cannot safely assign
  teachers with existing data
- keep all school ownership server-derived; never send `school_id`
- update docs and smoke checklist
- preserve the 100-test backend suite

This sprint should not become full TU, user management, finance, documents,
principal analytics, or a new module bundle.

## Read First

Builder must read:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `CONTEXT.md`
4. `planning/STATE.md`
5. `planning/DECISIONS.md`
6. `planning/DOMAIN.md`
7. `planning/RISKS.md`
8. `planning/QUESTIONS.md`
9. `planning/ARCHITECT-BUILDER-RUNBOOK.md`
10. `planning/sprints/008-admin-setup-ui-hardening/requirements.md`
11. `planning/sprints/008-admin-setup-ui-hardening/acceptance.md`
12. `planning/sprints/003-admin-onboarding-minimal/requirements.md`
13. `planning/sprints/003-admin-onboarding-minimal/acceptance.md`
14. `docs/API.md`
15. `docs/DATA_MODEL.md`
16. `docs/PERMISSIONS.md`
17. `docs/UX_VISUAL_STANDARD.md`
18. `docs/VALIDATION.md`
19. `docs/SETUP.md`
20. `docs/PILOT_SMOKE_CHECKLIST.md`
21. existing `apps/web/src/*`
22. `apps/api/src/app.ts`
23. `packages/db/src/onboarding.ts`

## Implementation Slices

### Slice 0: Pre-Edit Plan

Before editing files, Builder must summarize:

- current shell/workspace structure
- admin workspace navigation and component plan
- exact existing APIs to use
- whether a new backend helper endpoint is needed for teacher-membership listing
- auth/role guard plan
- UI state and error handling plan
- tests/validation plan
- docs to update
- explicit deferrals

Stop and ask Ian/Architect if the plan creates full user management, full TU,
finance, documents, principal analytics, broad import machinery, or new modules.

### Slice 1: Shell Access

Extend `apps/web/src/api.ts`:

- add `admin` workspace access when membership roles include `admin_sekolah` or
  `soka_internal`
- keep `teacher` workspace unchanged
- keep `parent` workspace unchanged

Extend workspace type and switcher:

- `teacher`
- `parent`
- `admin`

Rules:

- Show Admin/Setup only for admin roles.
- Multi-role users may switch between all supported workspaces.
- Do not make the admin workspace visible to `guru`, `wali_kelas`, or
  `orang_tua` unless they also have an admin role.

### Slice 2: Admin Setup Workspace

Create a compact workspace such as:

```text
apps/web/src/AdminSetupWorkspace.tsx
apps/web/src/adminSetupApi.ts
```

Recommended sections:

1. Setup Overview
2. Classes
3. Students
4. Teacher Assignments
5. Parent Link Codes
6. School Settings

Use anchor/chip nav or tabs. Do not create routes/pages unless the app already
has routing.

### Slice 3: Class Setup UI

Use:

- `GET /admin/classes`
- `POST /admin/classes`

Expected behavior:

- load class list on workspace open
- create form: name required, optional grade level and academic year if schema
  supports them
- refresh after create
- show API errors clearly

### Slice 4: Student Setup UI

Use:

- `GET /admin/students`
- `POST /admin/students`
- `POST /admin/students/bulk`
- `POST /admin/students/:id/assign-class`

Expected behavior:

- list students with class status if returned
- create single student
- assign/reassign selected student to selected class
- simple bulk text import

Recommended bulk format:

```text
Nama Siswa 1
Nama Siswa 2
Nama Siswa 3
```

Builder can transform each line into `{ fullName }` and call the existing bulk
endpoint. If class assignment is included, apply `classId` only if existing
schema supports it.

Do not build Excel parsing, drag-drop spreadsheet uploads, or complex import
mapping.

### Slice 5: Teacher Assignment UI

Use:

- `POST /admin/classes/:id/teachers`

Problem to inspect:

- Current APIs may not expose a list of same-tenant teacher memberships.

Allowed narrow backend addition if needed:

- `GET /admin/memberships?role=guru|wali_kelas`
- requires `admin_sekolah`/`soka_internal`
- returns only same-tenant memberships
- includes only fields needed to select a teacher membership, such as
  `membershipId`, `userId`, `name/email` if available, and roles
- no cross-school users
- no write capability
- no general user-management UI

If adding this endpoint, add focused tests proving:

- admin sees same-tenant memberships only
- School A admin cannot list School B memberships
- parent-only memberships are excluded when role filter asks for teachers

Teacher assignment form:

- class selector
- teacher membership selector or membership id input if no listing endpoint is
  added
- role in class: `wali_kelas` or `guru`
- optional subject
- clear error for `membership_not_teacher`

### Slice 6: Parent Link Code UI

Use:

- `GET /admin/parent-link-codes`
- `POST /admin/parent-link-codes`
- `POST /admin/parent-link-codes/:id/revoke`

Expected behavior:

- select student
- generate code
- display code clearly with status/expiry
- list existing codes
- revoke active code

Do not add free claim, NISN search claim, or parent account creation.

### Slice 7: School Settings UI

Use:

- `GET /guru/settings` if allowed for admin roles
- `PATCH /admin/school-settings`

Fields:

- attendance cutoff time
- school timezone
- default KKM

Validation:

- rely on shared/backend validation
- show `invalid_input` errors clearly, especially invalid timezone

Do not add settings beyond existing schema.

### Slice 8: Backend Tests

If no API behavior changes, existing 100 tests may remain enough.

If Builder adds `GET /admin/memberships`, add tests in an existing admin/onboarding
test file or a new focused file:

- requires auth + admin role
- returns same-tenant memberships only
- supports teacher role filtering
- rejects `orang_tua` / non-admin callers
- does not trust client-supplied `school_id`

Existing tests must remain green.

### Slice 9: Frontend Validation

Required:

- `pnpm typecheck`
- `pnpm --filter @soka/web build`
- manual smoke documentation update

No new frontend test runner is required unless Builder already has one.

### Slice 10: Documentation

Update:

- `docs/API.md` if an admin membership listing route is added or if the setup UI
  changes usage notes
- `docs/PERMISSIONS.md` to describe Admin Setup UI access
- `docs/VALIDATION.md` with Sprint 008 validation results
- `docs/PILOT_SMOKE_CHECKLIST.md` to include admin setup path before teacher and
  parent flows
- `planning/STATE.md`
- Sprint 008 `completion-notes.md`

## Suggested File Changes

Expected files:

- `apps/web/src/api.ts`
- `apps/web/src/RoleSwitcher.tsx`
- `apps/web/src/AppShell.tsx`
- `apps/web/src/AdminSetupWorkspace.tsx`
- `apps/web/src/adminSetupApi.ts`
- `apps/api/src/app.ts` only if adding a narrow helper route
- `packages/db/src/onboarding.ts` only if adding a narrow service helper
- `apps/api/src/__tests__/onboarding.test.ts` or similar if backend changes
- `docs/API.md`
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`
- `docs/PILOT_SMOKE_CHECKLIST.md`
- `planning/STATE.md`
- `planning/sprints/008-admin-setup-ui-hardening/completion-notes.md`

## Non-Negotiables

- Do not trust client-supplied `school_id`.
- Do not expose admin workspace to non-admin roles.
- Do not create general user management unless explicitly approved later.
- Do not allow public self-assignment of privileged roles.
- Do not create a full TU module.
- Do not add payments, documents, letters, staff attendance, principal analytics,
  student login, assignments, materials, broadcast/pengumuman, or push.
- Do not build complex Excel import.
- Do not create dead navigation.
- Do not start Sprint 009.
