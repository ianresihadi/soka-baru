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

## Sprint 002 Implementation Status

Implemented:

- Membership/role model (`school_memberships` + `membership_roles`) supporting
  multiple roles per user and future multi-school membership.
- Server-side tenant resolution (`getActiveTenantContext`): `school_id` and
  roles come only from membership rows, never from client input.
- Tenant-aware repository functions in `packages/db/src/repositories.ts`. The
  safe path requires a server-resolved `TenantContext`; `assertSameTenant`
  rejects any client-supplied foreign `school_id` with `TenantViolationError`.
- API middleware `requireAuth` / `requireMembership` / `requireRole`.
- Public binding role guard: the session-only `POST /school-bindings/by-code`
  endpoint only allows self-assigning roles in `SELF_BINDABLE_ROLES`
  (`orang_tua` for Sprint 002). Privileged roles (`guru`, `wali_kelas`,
  `admin_sekolah`, `kepala_sekolah`, `soka_internal`) cannot be self-assigned by
  a client that knows a `school_code`; they are assigned only by seed/internal
  code calling the repository directly, until an admin-controlled onboarding
  path exists (Sprint 003). Even `orang_tua` self-binding will be tightened to
  invitation/link codes later.
- Automated tenant-isolation tests (`apps/api/src/__tests__/tenant.test.ts`),
  including tests proving a client cannot self-assign `admin_sekolah` or
  `soka_internal` (or smuggle a privileged role in a mixed array) through the
  public endpoint.

### Sprint 003 Onboarding Access

- School creation (`POST /admin/schools`) is restricted to `soka_internal`.
- All other `/admin/*` onboarding routes require `admin_sekolah` or
  `soka_internal` and are scoped to the caller's `school_id`.
- Onboarding operations that take a client-supplied foreign key (class, student,
  teacher membership) verify the referenced row belongs to the caller's tenant
  before acting; otherwise they return 404 (or 422 for a non-teacher membership).
- Parent link redemption (`POST /parent-links/redeem`) is a server-controlled
  binding path: the school and student come from the code row, and it grants
  `orang_tua` legitimately because the school issued the code. This is the safe
  alternative to public self-binding for the `orang_tua` role.
- Parent-child access (`GET /me/children`) is derived only from
  `parent_student_links` of the parent's own memberships.
- Tests: `apps/api/src/__tests__/onboarding.test.ts` proves cross-school
  isolation for classes/students/teacher-assignments/link-codes, the link-code
  lifecycle (used/expired/revoked), and the role guards.

### Postgres RLS — Deferred (with reason)

RLS is NOT implemented in Sprint 002. SOKA Baru does not use Supabase Auth, so
RLS would not be auto-wired to JWT claims; binding a per-request tenant context
through a pooled Neon connection (`SET LOCAL`) adds complexity and connection
pool-leak risk that is not justified at the foundation stage. Tenant isolation
is therefore enforced in the backend service/query layer and is covered by
mandatory tests. RLS remains a future defense-in-depth option: it would add a
second barrier at the database layer once a clean request→session→tenant
context wiring exists. See `planning/DECISIONS.md` (2026-06-14).

Final detailed permission rules should be expanded during later sprints.
