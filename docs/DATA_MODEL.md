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

## Implemented In Sprint 002

Sprint 002 implemented the auth + tenant foundation only. Product tables
(`students`, `classes`, `attendance_records`, etc.) are intentionally NOT yet
created; they arrive with their owning sprints.

Drizzle schema: `packages/db/src/schema.ts`. Generated SQL migration:
`packages/db/migrations/0000_*.sql`.

Better Auth tables (managed via the Drizzle adapter):

- `user`, `session`, `account`, `verification`.

SOKA foundation tables:

| Table | Key fields | Notes |
|---|---|---|
| `schools` | `id` (uuid), `name`, `school_code` (unique), `status`, timestamps | Tenant boundary. |
| `school_memberships` | `id` (uuid), `school_id` → `schools.id`, `user_id` → `user.id`, `status`, `joined_at`, timestamps | Unique `(school_id, user_id)` prevents duplicate memberships. |
| `membership_roles` | `id` (uuid), `membership_id` → `school_memberships.id`, `role`, `created_at` | Unique `(membership_id, role)`. `role` is text validated by the shared `Role` enum. |

Role values seeded as valid: `guru`, `wali_kelas`, `orang_tua`, `siswa`,
`admin_sekolah`, `kepala_sekolah`, `soka_internal`. Only `guru`, `wali_kelas`,
and `orang_tua` are active MVP product roles (`ACTIVE_MVP_ROLES` in
`packages/shared`); `siswa` exists as a value with no MVP UI.

The active tenant context (`school_id` + roles) is resolved server-side from
`school_memberships`/`membership_roles` via `getActiveTenantContext`, never from
client input.

## Implemented In Sprint 003

Admin onboarding tables (migration `0001_*.sql`), all school-owned:

| Table | Key fields | Notes |
|---|---|---|
| `classes` | `id`, `school_id`, `name`, `grade_level?`, `academic_year?`, timestamps | Homeroom/class grouping. |
| `students` | `id`, `school_id`, `full_name`, `nisn?`, `class_id?` → `classes`, `status`, timestamps | One homeroom per student (`class_id`); set via assign-class. |
| `teacher_assignments` | `id`, `school_id`, `class_id`, `membership_id`, `role_in_class` (`wali_kelas`\|`guru`), `subject?` | Unique `(class_id, membership_id, role_in_class)`. |
| `parent_link_codes` | `id`, `school_id`, `student_id`, `code` (unique), `status` (`active`\|`used`\|`revoked`), `expires_at`, `created_by_user_id`, `redeemed_by_user_id?`, `redeemed_at?` | School-issued, single-use parent invitation. |
| `parent_student_links` | `id`, `school_id`, `student_id`, `parent_membership_id`, `relationship?` | Unique `(student_id, parent_membership_id)`. One parent↔many children, one child↔many parents. |
| `audit_events` | `id`, `school_id`, `actor_user_id?`, `action`, `entity_type`, `entity_id?`, `metadata jsonb?` | Lightweight audit; currently records parent-link-code and parent-link create events. |

Decisions reflected here: student↔class is a direct `class_id` FK (not a join
table); `audit_events` implements the DOMAIN-mandated lightweight audit for
trust-sensitive events.

## Implemented In Sprint 004

Daily-loop tables (migration `0002_*.sql`), all school-owned:

| Table | Key fields | Notes |
|---|---|---|
| `school_settings` | `id`, `school_id` (unique), `attendance_cutoff_time` (default `07:30`), `school_timezone` (default `Asia/Jakarta`) | Cutoff is school-local wall-clock. |
| `attendance_records` | `id`, `school_id`, `class_id`, `student_id`, `attendance_date` (`date`), `status`, `recorded_by_membership_id`, `note?` | Unique `(school_id, student_id, attendance_date)`; statuses `hadir`/`sakit`/`izin`/`alpa`/`terlambat`. |
| `message_threads` | `id`, `school_id`, `student_id`, `parent_membership_id`, `class_id?`, `status`, `last_message_at`, `last_parent_message_at`, `last_teacher_reply_at?` | Unique `(student_id, parent_membership_id)`. Unreplied = parent message newer than last teacher reply. |
| `messages` | `id`, `school_id`, `thread_id`, `student_id`, `sender_membership_id`, `sender_role`, `body` | Minimal parent↔teacher messages. |
| `notifications` | `id`, `school_id`, `recipient_membership_id`, `student_id?`, `type`, `title`, `body`, `payload` jsonb, `read_at?` | In-app only (no push); dedup by `(recipient, student, payload.date, payload.status)`. |

Change to existing `students`: added `objective_status` (`aman`/`perhatian`/
`kritis`, default `aman`), separate from the lifecycle `status` field.

## Implemented In Sprint 006

Academic/notes tables (migration `0003_*.sql`), all school-owned:

| Table | Key fields | Notes |
|---|---|---|
| `grades` | `id`, `school_id`, `class_id?`, `student_id`, `subject`, `assessment_name`, `assessment_date` (`date`), `score` (int), `max_score` (int, default 100), `kkm` (int), `visibility_status` (`draft`/`published`, default `draft`), `published_at?`, `recorded_by_membership_id` | KKM stored per record. `isBelowKkm` is computed in DTOs as `(score/maxScore)*100 < kkm` (percentage, not raw). Indexed by class/date, student/date, student/visibility. |
| `student_notes` | `id`, `school_id`, `class_id?`, `student_id`, `author_membership_id`, `category` (`general`/`academic`/`attendance`/`wellbeing`), `body`, `visibility_status` (`internal`/`published`, default `internal`), `published_at?` | Qualitative only; never mutates `students.objective_status`. Indexed by student/created, student/visibility, class/created. |

Change to `school_settings`: added `default_kkm` (int, default 75) — applied only
when a grade omits its own KKM; the resolved KKM is stored on the grade.

Audit (`audit_events`): `grade.updated` (update after publish), and
`student_note.published` / `student_note.unpublished` / `student_note.updated`
(published-content change). Notifications reuse the `notifications` table with
types `grade_published` and `note_published`, deduped per recipient + entity id.

No tables for raport, averages, ranking, formulas, behavior scoring, or
case-management were added.

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
