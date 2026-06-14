# Sprint 002 Builder Handoff Prompt

You are the Builder for SOKA Baru Sprint 002: Foundation Data/Auth.

Your job is to implement the technical foundation for multi-school data ownership, authentication, school binding, role assignments, and tenant isolation. Do not build product workflows yet.

## Read First

Read these files in order before making changes:

1. `AGENTS.md`
2. `CONTEXT.md`
3. `planning/STATE.md`
4. `planning/DECISIONS.md`
5. `planning/DOMAIN.md`
6. `planning/RISKS.md`
7. `planning/QUESTIONS.md`
8. `docs/ARCHITECTURE.md`
9. `docs/API.md`
10. `docs/DATA_MODEL.md`
11. `docs/PERMISSIONS.md`
12. `docs/VALIDATION.md`
13. `planning/sprints/002-foundation-data-auth/requirements.md`
14. `planning/sprints/002-foundation-data-auth/blueprint.md`
15. `planning/sprints/002-foundation-data-auth/acceptance.md`

## Approved Stack

Use this baseline unless you find a concrete blocker:

- Frontend validation UI: React, Vite, TypeScript, Tailwind.
- Backend API: Hono.
- Database: Neon Postgres.
- ORM/migrations: Drizzle.
- Auth: Better Auth email/password.

Supabase is not the SOKA Baru backend baseline.

## Before Editing

Before making code changes, summarize your implementation plan in the thread:

1. Package/workspace structure you will create.
2. Core files you expect to create or modify.
3. Database tables/migrations you will add.
4. How Better Auth will be wired.
5. How `school_code` binding will work.
6. How tenant isolation will be enforced without trusting client-supplied `school_id`.
7. Whether you plan to implement Postgres RLS now or defer it with a reason.
8. Tests or validation steps you will run.

If a decision would change product scope, stop and ask. If a decision is only implementation detail, choose conservatively and document it.

## Build Scope

Implement the smallest foundation that satisfies Sprint 002 acceptance.

Required implementation areas:

- Project scaffold for web/API/database packages.
- Hono API with health and protected validation routes.
- Drizzle schema and migrations for auth/membership/role foundation.
- Better Auth email/password auth.
- School binding through unique `school_code`.
- Membership and role assignment model.
- Tenant-aware backend helpers/services.
- Seed data for two schools.
- Tests or documented validation proving cross-school isolation.

## Required Data Rules

- Every school-owned table must have `school_id` or a clear tenant path.
- Protected routes must resolve the user from the auth session.
- Protected school-scoped routes must resolve membership server-side.
- API handlers must not authorize from client-supplied `school_id`.
- A user may have multiple roles in the same school.
- A user may belong to more than one school in the future.
- `siswa` may exist as a role value but must not become active MVP UI.

## Minimum Validation Scenario

Create or document a validation scenario with:

- School A.
- School B.
- User A in School A.
- User B in School B.
- One user with multiple roles.
- A protected route or service call that would leak data if tenant isolation failed.

Validation must prove:

- User A cannot read School B records.
- User A cannot mutate School B records.
- Supplying School B's `school_id` from the client does not bypass User A's membership scope.
- Role checks allow expected access and deny unexpected access.

## Out Of Scope

Do not build:

- Guru daily loop UI.
- Orang Tua PWA experience.
- Attendance capture.
- Parent messaging.
- Student pages.
- Payments.
- Full TU/Admin Sekolah module.
- Kepala Sekolah dashboard.
- Subdomain-per-school.
- Physical database per school.

Minimal validation UI is allowed only if it proves auth, membership, or tenant isolation.

## Documentation Duties

After implementation, update:

- `planning/STATE.md`
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/DATA_MODEL.md`
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`

If implementation creates a durable architecture decision, add it to `planning/DECISIONS.md`.

## Definition Of Done

Sprint 002 is done when:

- The foundation can run locally or has a clear documented blocker.
- Drizzle migrations/schema exist for the auth and membership foundation.
- Better Auth email/password is implemented or scaffolded.
- `school_code` can bind a user to a school.
- Membership roles support multiple roles per user.
- Tenant isolation is enforced in backend code.
- Postgres RLS is either implemented or explicitly deferred with reason.
- Two-school isolation is validated by tests or exact documented validation.
- Sprint docs are updated with what was built and what remains.

Stay inside Foundation Data/Auth. The next sprint, Admin Onboarding Minimal, will turn this foundation into real onboarding workflows.
