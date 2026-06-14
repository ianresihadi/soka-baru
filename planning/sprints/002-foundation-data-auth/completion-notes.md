# Sprint 002 Completion Notes (Builder)

## What was scaffolded

pnpm workspaces monorepo (no Turborepo yet):

- `apps/api` — Hono API. `createApp(deps)` factory + server entry that wires
  Better Auth session resolution.
- `apps/web` — React/Vite/Tailwind minimal validation UI (not a product screen).
- `packages/db` — Drizzle schema, generated migration, client, tenant-aware
  repositories, migrate + seed scripts.
- `packages/auth` — Better Auth (email/password, Drizzle adapter).
- `packages/shared` — `Role` enum + `ACTIVE_MVP_ROLES`, shared types, zod schemas.

Internal packages are consumed as TypeScript source (no build step).

## Tables / migrations

Generated `packages/db/migrations/0000_*.sql` covering:

- Better Auth: `user`, `session`, `account`, `verification`.
- SOKA foundation: `schools`, `school_memberships` (unique `school_id,user_id`),
  `membership_roles` (unique `membership_id,role`).

No product tables yet (students, attendance, etc.) — those belong to later
sprints.

## How auth works locally

Better Auth email/password via the Drizzle adapter on the shared Neon database.
Endpoints mounted at `/api/auth/*`. The API resolves the user from the Better
Auth session; `/me` and `/me/memberships` expose identity and membership/roles.
Seed users + passwords are local-dev only.

## How `school_id` isolation is enforced

- `getActiveTenantContext(db, userId)` resolves `school_id` + roles from
  membership rows — the only trusted source.
- Tenant-aware repositories take a server-resolved `TenantContext`; queries scope
  by `ctx.schoolId`. `assertSameTenant` rejects client-supplied foreign ids.
- API middleware: `requireAuth`, `requireMembership`, `requireRole`.
- Handlers never authorize from a client-supplied `school_id`.

## Postgres RLS

Deferred, with reason recorded in `docs/PERMISSIONS.md` and
`planning/DECISIONS.md`. Backend tenant-isolation tests are mandatory in its
place.

## Tests / validation

- `pnpm test` → 12 passing tests (in-process PGlite + real Drizzle migrations)
  covering binding, multi-role, `siswa` role value, read/write tenant scoping,
  client-supplied foreign `school_id` rejection, and role checks.
- `pnpm typecheck` → clean across all packages.
- `apps/web` builds via `vite build`.

## Known limitations / what remains for Sprint 003

- The full Better Auth HTTP sign-in/session flow was not exercised against a
  live Postgres in this environment (no `DATABASE_URL`). Documented for live
  verification with `pnpm db:migrate` + `pnpm db:seed` + `pnpm dev:api`.
- `getActiveTenantContext` picks the first active membership; multi-school
  selection UX is a later concern (the model already supports it).
- Dev-only cyclic workspace dependency (`packages/db` devDepends on
  `packages/auth` for the seed script); pnpm handles it. Could be removed later
  by relocating the seed.
- Sprint 003 (Admin Onboarding Minimal) turns this foundation into real
  onboarding: create school, import/create students, parent link codes, class
  and teacher assignment.
