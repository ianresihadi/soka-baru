# Data Model

## Overview

Session 5 confirms the multi-tenant data model baseline, and Session 10 confirms the implementation stack:

- One shared database.
- Per-school data ownership and isolation.
- `school_id` on every school-owned table.
- Backend service/query policy enforcement to prevent cross-school access.
- Postgres Row Level Security as defense-in-depth where compatible with the auth/session design.
- Neon Postgres as the baseline managed database.
- Drizzle ORM as the baseline schema, migration, and typed query layer.

Session 5 confirms the MVP core entities:

| Entity | Purpose | Status |
|---|---|---|
| `schools` | Tenant boundary for each school. | MVP core |
| `users` | Login identity. | MVP core |
| `school_memberships` | Connects a user to a school. | MVP core |
| `membership_roles` | Assigns one or more roles to a school membership. | MVP core |
| `students` | Student/child record. | MVP core |
| `classes` | Homeroom/class grouping. | MVP core |
| `teacher_assignments` | Connects teachers to classes/subjects/responsibilities. | MVP core |
| `parent_student_links` | Connects parent memberships to students. | MVP core |
| `attendance_records` | Daily attendance facts and corrections. | MVP core |
| `grades` | Basic academic score and KKM-related visibility. | MVP core |
| `student_notes` | Qualitative notes with publication status. | MVP core |
| `messages` | Communication between school and parents. | MVP core |
| `notifications` | Transactional event notifications. | MVP core |
| `school_settings` | Per-school settings such as attendance cutoff and thresholds. | MVP core |

## Tenancy Rule

Every entity that belongs to a school must be scoped by `school_id`.

The backend must resolve the authenticated user's active `school_id` through membership data before accessing school-owned records. Queries should use tenant-aware helpers or repositories so `school_id` scoping is not manually re-created in every handler.

Examples:

- students
- classes
- teacher assignments
- parent-student links
- attendance
- grades
- messages
- notifications
- student notes
- school settings

## School Settings

Session 5 confirms `school_settings` owns per-school configurable rules.

Initial settings:

- Attendance cutoff.
- Default KKM.
- Status thresholds for Aman, Perhatian, and Kritis.
- Future school-specific labels/statuses if needed.

SOKA should provide sensible defaults, but these rules should not be hardcoded globally.

## Lightweight Audit / History

Session 5 confirms MVP audit/history should focus on trust-sensitive records:

| Area | Audit Trigger |
|---|---|
| `attendance_records` | Corrections after the day changes. |
| `grades` | Changes after the grade has been published to parents. |
| `student_notes` | Publish/unpublish status changes. |
| `parent_student_links` | Create/remove link events. |

The MVP does not require full audit logs for every table.

## User and Role Model

Session 5 confirms users should not have a single global `role` column.

Baseline structure:

- `users`: login identity.
- `schools`: tenant boundary.
- `school_memberships`: connects a user to a school.
- `membership_roles`: one or more roles for a user's membership in a school.
- `parent_student_links`: connects parent memberships to students.

This supports cases like:

- Guru who is also wali kelas.
- Kepala sekolah who also teaches in a small school.
- Parent who is also a teacher.
- Parent with multiple children.

## Parent-Student Linking

Session 5 confirms parent-student links are created through school-controlled invitations or link codes.

Baseline:

- Admin onboarding creates or imports students first.
- The school issues a parent invitation or link code per child or family.
- Parent users sign up or log in with email/password and the invitation/link code.
- `parent_student_links` connects parent membership to student.
- One parent can link to multiple children.
- One student can have multiple parents/guardians.
- Parents should not freely claim children by name/NISN.

Final detailed data modeling continues in Session 5.
