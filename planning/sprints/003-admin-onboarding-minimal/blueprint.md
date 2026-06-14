# Sprint 003 Blueprint: Admin Onboarding Minimal

## Objective

Build the minimum onboarding capability required to make a real school usable in SOKA: classes, students, teacher assignments, and parent-student linking through school-controlled codes.

Sprint 003 should build on Sprint 002 without changing the core stack or tenant model.

## Files To Review First

- `AGENTS.md`
- `CLAUDE.md`
- `CONTEXT.md`
- `planning/STATE.md`
- `planning/DECISIONS.md`
- `planning/DOMAIN.md`
- `planning/RISKS.md`
- `planning/QUESTIONS.md`
- `planning/ARCHITECT-BUILDER-RUNBOOK.md`
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/DATA_MODEL.md`
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`
- `planning/sprints/002-foundation-data-auth/completion-notes.md`
- `planning/sprints/003-admin-onboarding-minimal/requirements.md`
- `planning/sprints/003-admin-onboarding-minimal/acceptance.md`

## Implementation Principle

Use the Sprint 002 foundation:

- Hono API in `apps/api`.
- Drizzle schema and repositories in `packages/db`.
- Better Auth in `packages/auth`.
- Shared roles/types/zod in `packages/shared`.
- Tenant context from server-resolved membership, not client `school_id`.

Do not introduce Supabase, a second ORM, a second auth system, or a separate admin product.

## Recommended Implementation Slices

### Slice 1: Data Model And Migrations

Add Drizzle schema and generated migration for onboarding tables.

Recommended tables:

- `classes`
- `students`
- `student_class_memberships`
- `teacher_assignments`
- `parent_student_link_codes`
- `parent_student_links`

Recommended `classes` fields:

- `id`
- `school_id`
- `name`
- `grade_level`
- `academic_year`
- `status`
- `created_at`
- `updated_at`

Recommended `students` fields:

- `id`
- `school_id`
- `full_name`
- `nisn` or `student_number` nullable
- `status`
- `created_at`
- `updated_at`

Recommended `student_class_memberships` fields:

- `id`
- `school_id`
- `student_id`
- `class_id`
- `academic_year`
- `status`
- `created_at`
- `updated_at`

Recommended `teacher_assignments` fields:

- `id`
- `school_id`
- `teacher_membership_id`
- `class_id`
- `assignment_type`
- `status`
- `created_at`
- `updated_at`

Recommended `parent_student_link_codes` fields:

- `id`
- `school_id`
- `student_id`
- `code`
- `status`
- `expires_at`
- `created_by_membership_id`
- `used_by_membership_id`
- `used_at`
- `created_at`
- `updated_at`

Recommended `parent_student_links` fields:

- `id`
- `school_id`
- `parent_membership_id`
- `student_id`
- `relationship`
- `status`
- `created_at`
- `updated_at`

Keep naming consistent with existing Drizzle style if Builder chooses minor variations.

### Slice 2: Tenant-Aware Repository Functions

Create repository/service functions that require a server-resolved `TenantContext` or explicit internal setup context.

Recommended functions:

- `createClassForTenant`
- `listClassesForTenant`
- `createStudentForTenant`
- `importStudentsForTenant`
- `assignStudentToClassForTenant`
- `assignTeacherToClassForTenant`
- `createParentLinkCodeForTenant`
- `redeemParentLinkCodeForTenant`
- `listLinkedStudentsForParent`

Rules:

- Never trust client `school_id`.
- Cross-school IDs must be rejected before write.
- Link code redemption must validate code status, expiry, student school, and parent membership school.

### Slice 3: Admin/Setup API Routes

Add minimal API routes for setup validation.

Recommended route group:

- `POST /setup/classes`
- `GET /setup/classes`
- `POST /setup/students`
- `POST /setup/students/import`
- `POST /setup/classes/:classId/students`
- `POST /setup/classes/:classId/teachers`
- `POST /setup/students/:studentId/parent-link-codes`
- `POST /parent-links/redeem`
- `GET /me/linked-students`

Access:

- Setup routes require auth, membership, and role `admin_sekolah` or `soka_internal`.
- Parent link redemption requires auth, membership, and role `orang_tua`.
- Teacher assignment should only accept memberships from the same school with `guru` or `wali_kelas`.

These routes are allowed to be plain and unpolished. They are foundation/admin validation routes, not final product UI.

### Slice 4: CSV Import

Support a simple CSV import path for students.

Minimum format:

```csv
full_name,nisn,student_number
```

Only `full_name` is required.

Rules:

- Import belongs to the admin's active school.
- Invalid rows should be reported clearly.
- Do not build complex Excel import in this sprint.

Builder may choose to defer CSV to a documented script if API multipart parsing would distract from core onboarding, but student import/create must still be covered somehow.

### Slice 5: Minimal Validation UI Or Scripts

Builder may add minimal validation UI in `apps/web` or scripts if helpful.

Allowed UI:

- Simple setup validation controls for classes/students/link codes.
- No polished admin dashboard.
- No teacher/parent product experience.

### Slice 6: Tests

Add automated tests for onboarding rules.

Required tests:

- Admin can create class/student in own school.
- School A admin cannot attach School B student/class/teacher.
- Student-class assignment is tenant-scoped.
- Teacher assignment requires same-school teacher membership.
- Parent link code can link parent to student in same school.
- Parent cannot redeem invalid/used/expired/cross-school code.
- Parent can list only linked students.
- Existing Sprint 002 tenant/auth tests still pass.

## API And Permission Documentation

Update:

- `docs/API.md`
- `docs/DATA_MODEL.md`
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`

If Builder chooses a different table structure or defers CSV/API/UI details, document the reason.

## Explicit Non-Goals

Do not build:

- Full TU interface.
- Payment workflows.
- Attendance.
- Parent messaging.
- Teacher dashboard.
- Parent mobile/PWA polish.
- Kepala Sekolah dashboard.
- Student learning workflows.
- Multi-school switcher UI.
- Production-grade import wizard.

## Completion Notes

At completion, Builder should add `planning/sprints/003-admin-onboarding-minimal/completion-notes.md` covering:

- Tables/migrations added.
- API routes added.
- How setup/admin access works.
- How parent link codes work.
- What tests passed.
- What remains for Sprint 004 Guru Daily Loop and Sprint 005 Parent Trust Loop.
