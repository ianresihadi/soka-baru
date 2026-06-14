# Sprint 003 Requirements: Admin Onboarding Minimal

## Goal

Enable a real school to be set up with the minimum data required for the MVP teacher-parent trust loop.

Sprint 003 turns the Sprint 002 foundation into practical onboarding capability. It is not a full TU/Admin Sekolah module.

## Business Objective

SOKA cannot prove the Guru/Wali Kelas and Orang Tua MVP unless a school can be onboarded with:

- School identity.
- Classes.
- Students.
- Teacher/class assignments.
- Parent-student links controlled by the school.

The goal is operational readiness for later MVP workflows, not administrative completeness.

## In Scope

- Create or manage school records needed for MVP setup.
- Create classes for a school.
- Create students manually.
- Import students from a simple CSV.
- Assign students to classes.
- Assign Guru/Wali Kelas to classes.
- Generate parent invitation/link codes.
- Link a parent membership to one or more students through a school-controlled code.
- Minimal admin/setup API routes and validation UI if useful.
- Seed/demo onboarding scenario for two schools to prove isolation.
- Tests for cross-school isolation and parent-student link safety.

## Out Of Scope

- Full TU module.
- Staff HR records beyond teacher membership/class assignment.
- Payments/SPP.
- Documents/letters.
- Staff attendance.
- Institutional calendar.
- Principal dashboard.
- Student-facing UI.
- Parent PWA polish.
- Attendance capture.
- Parent messaging.
- Bulk Excel parser with complex formatting.
- Government reporting.

## Required Roles And Access

Sprint 003 may use:

- `soka_internal` for internal setup/admin routes.
- `admin_sekolah` for future school-admin setup capability.
- `guru` / `wali_kelas` as assignable teacher roles.
- `orang_tua` as parent membership role.

Important:

- Public self-binding remains limited to non-privileged parent behavior decided in Sprint 002.
- Privileged roles must not be self-assigned from public endpoints.
- Admin/setup routes must require `soka_internal` or `admin_sekolah`.

## Required Data Areas

Sprint 003 should add or scaffold data support for:

- `classes`
- `students`
- `student_class_memberships` or equivalent student-class assignment table
- `teacher_assignments`
- `parent_student_link_codes` or equivalent invitation/link-code table
- `parent_student_links`

Exact table names can be adjusted by Builder if the data model is cleaner, but the concepts must be represented clearly in `docs/DATA_MODEL.md`.

## Business Rules

- Every school-owned onboarding table must be scoped to `school_id` or have a clear tenant path.
- A class belongs to one school.
- A student belongs to one school.
- A student can be assigned to a class.
- A teacher assignment must connect a teacher membership to a class in the same school.
- A parent-student link can only connect a parent membership and student from the same school.
- Parent-student linking must be controlled by school-issued invitation/link code.
- Parents cannot freely claim a child by name, NISN, or guessable personal details.
- Link codes must not grant access across schools.
- Link codes should be one-time or explicitly status-tracked.

## Validation Requirements

Sprint 003 must prove:

- School A setup data cannot be read or mutated by School B users.
- A School A admin cannot assign a School B student to a School A class.
- A School A admin cannot assign a School B teacher to a School A class.
- A parent cannot link to a student from another school.
- An invalid, expired, used, or cross-school link code is rejected.
- Parent-student links are explicit and queryable for the authenticated parent.
- Existing Sprint 002 tests still pass.

## Dependencies

- Sprint 002 merged foundation:
  - Hono API.
  - Better Auth.
  - Drizzle schema/migrations.
  - `schools`, `school_memberships`, `membership_roles`.
  - tenant-aware helpers/middleware.
  - public self-binding guard.

## Non-Goals Reminder

Do not make this sprint a polished admin product. Build the minimum reliable onboarding layer that allows later Sprint 004 and Sprint 005 workflows to use real data.
