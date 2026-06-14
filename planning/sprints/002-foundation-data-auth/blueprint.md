# Sprint 002 Blueprint: Foundation Data/Auth

## Objective

Create the production-grade foundation that all MVP modules will depend on: project scaffold, custom API, database schema, auth, school binding, role assignments, and tenant isolation.

Sprint 002 is not a product-feature sprint. It exists to make sure later Guru, Orang Tua, and Admin onboarding workflows sit on a clean multi-school foundation.

## Files To Review First

- `AGENTS.md`
- `CONTEXT.md`
- `planning/STATE.md`
- `planning/DECISIONS.md`
- `planning/DOMAIN.md`
- `planning/RISKS.md`
- `planning/QUESTIONS.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/PERMISSIONS.md`
- `docs/API.md`
- `planning/sprints/002-foundation-data-auth/requirements.md`
- `planning/sprints/002-foundation-data-auth/acceptance.md`

## Approved Stack Baseline

- Frontend: React, Vite, TypeScript, Tailwind.
- Backend API: Hono custom TypeScript API.
- Database: Neon Postgres.
- ORM and migrations: Drizzle ORM.
- Auth: Better Auth with email/password sessions.
- Tenancy: backend service/query enforcement first; Postgres Row Level Security as defense-in-depth if it fits cleanly.

Supabase is reference context from SOKA Lama only. Do not build new Supabase client, Supabase Auth, or Supabase Edge Function foundations.

## Recommended Workspace Shape

Builder may adjust naming if the implementation toolchain requires it, but the default shape should be:

```text
apps/
  web/              # React/Vite app; only minimal validation UI in Sprint 002
  api/              # Hono API server
packages/
  db/               # Drizzle schema, migrations, seed helpers
  auth/             # Better Auth config and auth helpers if useful
  shared/           # Shared roles, types, validation schemas if useful
docs/
planning/
```

If the Builder chooses a simpler single-app structure for speed, the reason must be recorded in the Sprint 002 completion notes.

## Implementation Slices

### Slice 1: Project Scaffold

Create the minimal runnable application structure for the approved stack.

Expected outputs:

- Package/workspace setup.
- TypeScript config.
- Lint/build/test scripts where practical.
- `apps/web` Vite React baseline if no existing implementation scaffold is present.
- `apps/api` Hono baseline with a health route.
- Environment variable examples without real secrets.

Minimum environment variables:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- API/web origin variables as needed for local development.

### Slice 2: Database And Migrations

Create Drizzle schema and migrations for the Sprint 002 foundation tables.

Required tables or equivalent structures:

- Better Auth user/session/account/verification tables, based on the chosen Better Auth adapter output.
- `schools`
- `school_memberships`
- `membership_roles`
- Optional `user_profiles` if Better Auth's user table should not hold SOKA-specific profile fields.

Recommended `schools` fields:

- `id`
- `name`
- `school_code`
- `status`
- `created_at`
- `updated_at`

Recommended `school_memberships` fields:

- `id`
- `school_id`
- `user_id`
- `status`
- `joined_at`
- `created_at`
- `updated_at`

Recommended `membership_roles` fields:

- `id`
- `membership_id`
- `role`
- `created_at`

Initial role values:

- `guru`
- `wali_kelas`
- `orang_tua`
- `siswa`
- `admin_sekolah`
- `kepala_sekolah`
- `soka_internal`

MVP active product roles are only Guru/Wali Kelas and Orang Tua. `siswa`, `admin_sekolah`, `kepala_sekolah`, and `soka_internal` can exist in the foundation so later sprints do not require a role-model rewrite.

### Slice 3: Auth Flow

Implement or scaffold Better Auth email/password.

Required behaviors:

- User can sign up or log in with email/password.
- API can resolve the authenticated user from the session.
- API can return the user's school memberships and roles.
- Auth code does not rely on demo credentials or hardcoded mock users.

School binding can be implemented in Sprint 002 as an API endpoint, service function, seed script, or minimal validation UI. It does not need polished onboarding screens.

### Slice 4: School Binding

Implement the foundation rule: a user is connected to a school through school-controlled binding, not arbitrary self-claim.

Minimum Sprint 002 binding path:

- A school exists with a unique `school_code`.
- A user can be attached to the school through `school_code`.
- The binding creates a `school_memberships` record.
- The binding assigns one or more `membership_roles`.
- Duplicate memberships for the same user and school are prevented.

Important rule:

The client may submit a `school_code` during binding, but protected data access after binding must use the authenticated session and membership records, not client-supplied `school_id`.

### Slice 5: Tenant Enforcement

Create a clear tenant enforcement pattern before building product modules.

Required backend pattern:

- Protected API routes require an authenticated user.
- Protected school-scoped routes resolve an active membership.
- School-owned queries receive `school_id` from the server-side membership context.
- API handlers must not trust a client-provided `school_id` for authorization.
- Shared helpers/services should make the safe path easy and the unsafe path obvious.

Recommended helper concepts:

- `requireAuth`
- `requireMembership`
- `requireRole`
- `withTenant`
- `getActiveMembership`
- tenant-aware repository/service functions.

Postgres RLS:

- Implement RLS only if the Builder can wire the request/session tenant context cleanly and testably.
- If RLS is deferred, document the reason in `docs/PERMISSIONS.md` and keep backend tenant-isolation tests mandatory.

### Slice 6: Seed Data

Create seed/demo data for validation, not product demo polish.

Required seed scenario:

- School A with at least one user and one membership.
- School B with at least one user and one membership.
- One user with multiple roles in one school.
- Optional future-role seed showing `siswa` can exist as a role value without active UI.

Seed data must not become production credentials. Any local passwords should be clearly marked as local development only.

### Slice 7: Validation

Validation must prove tenant isolation, not merely that routes respond.

Required checks:

- User from School A cannot read School B membership/school-scoped records.
- User from School A cannot mutate School B records.
- Client-supplied `school_id` cannot override the authenticated membership scope.
- User can authenticate and resolve active `school_id`.
- One user can hold multiple roles.
- Role checks allow and deny access as expected.
- `siswa` can exist as a role value without appearing in MVP navigation.

Preferred validation:

- Automated tests for auth/tenancy helpers and protected API routes.
- Seed-based integration tests using two schools.

Acceptable fallback if full automation is blocked:

- A documented validation script or manual checklist with exact commands and expected outcomes, plus a clear blocker note.

## API Surface For Sprint 002

Keep API routes minimal and foundation-focused.

Recommended routes or equivalent:

- `GET /health`
- Auth routes required by Better Auth.
- `GET /me`
- `GET /me/memberships`
- `POST /school-bindings/by-code`
- `GET /tenant-check/school`
- `POST /tenant-check/school`

The `tenant-check` routes are validation scaffolding. They should not become user-facing product workflows.

## Documentation Updates Required

Sprint 002 implementation should update:

- `planning/STATE.md`
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/DATA_MODEL.md`
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`

If implementation changes the approved stack or workspace shape, record the durable decision in `planning/DECISIONS.md`.

## Explicit Non-Goals

Do not build:

- Guru dashboard.
- Parent mobile/PWA screens.
- Student-facing UI.
- Attendance workflow.
- Parent messaging workflow.
- Payments.
- Full TU/Admin Sekolah module.
- Kepala Sekolah dashboard.
- Physical database per school.
- Subdomain-per-school routing.

Minimal validation UI is allowed only if it helps prove auth, membership, and tenant isolation.

## Builder Completion Notes

At the end of Sprint 002, Builder should record:

- What was scaffolded.
- Which tables/migrations exist.
- How auth works locally.
- How `school_id` isolation is enforced.
- Whether Postgres RLS was implemented or deferred.
- What tests/validation passed.
- What remains for Sprint 003 Admin Onboarding Minimal.
