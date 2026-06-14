# Permissions

## Overview

SOKA Baru will require role-based access control and tenant isolation.

Session 5 confirms that each school's data must be owned by and isolated for that school. Session 10 confirms the implementation baseline: shared Neon Postgres database, custom Hono API, Better Auth sessions, Drizzle data access, and tenant enforcement in the backend service/query layer. Postgres Row Level Security may be added as defense-in-depth where compatible.

## Candidate Roles

| Role | Likely Access | Status |
|---|---|---|
| Wali Kelas / Guru | Operate class workflows, attendance, grades, notes, messages. | Active MVP |
| Orang Tua | View linked children's data, receive notifications, message school. | Active MVP |
| Siswa | Access learning materials and submit assignments if active. | Prepared for Phase 2 |
| Kepala Sekolah | Read-only monitoring and strategic dashboard if active. | Post-MVP/backlog |
| TU / Admin Sekolah | Manage master data and administration if active. | Not active MVP; minimal admin onboarding capability only |

## Role Assignment Model

Users should receive roles through school memberships, not a single global `role` column.

Baseline:

- A user can belong to one or more schools through memberships.
- A membership can have one or more roles.
- Permissions are evaluated from both `school_id` and assigned role(s).
- Parent-child access is granted through explicit parent-student links.

## Parent Access

- Parent access must come from explicit `parent_student_links`.
- Parent-student links are created through school-controlled invitations or link codes.
- Parents should not be able to freely claim students by name/NISN.
- A parent can access multiple linked children.
- A student can have multiple linked parents/guardians.

## Access Rules

- Users can only access records for their own `school_id`.
- Parent users can only access children linked to their account.
- Guru/Wali Kelas users can only access classes, students, attendance, grades, notes, and messages within their school and assignments.
- Siswa should be prepared as a future role but not activated in MVP.
- API handlers must not accept `school_id` from the client as the source of truth for authorization.
- Protected requests must resolve `school_id` from the authenticated session and membership.
- Database access should go through tenant-aware helpers/repositories that require `school_id`.
- Tests must prove a School A user cannot read or mutate School B records.

## Auth Baseline

- Email/password login.
- Better Auth is the baseline auth implementation.
- Unique `school_code` per school.
- `school_code` binds users to `school_id` during account creation or first login.
- Subdomain-per-school is deferred.

Final detailed permission rules should be expanded during Sprint 002 implementation.
