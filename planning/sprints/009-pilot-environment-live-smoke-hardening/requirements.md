# Sprint 009 Requirements: Pilot Environment / Live Smoke Hardening

## Purpose

Sprint 009 proves that SOKA Baru can run against a real Postgres environment and
can be walked through as a first-pilot rehearsal using the app shell and role
workflows built in Sprints 002-008.

This sprint is not about adding product breadth. It is about reducing pilot risk:

- environment setup should be hard to misconfigure silently;
- live database migrate/seed should be repeatable;
- Better Auth sign-in/session/sign-out should be verified over HTTP, not only by
  injected test sessions;
- the documented admin, teacher, and parent smoke paths should be executable;
- validation commands should work consistently on Ian's Windows environment and
  in Claude's shell.

## Why This Sprint Now

After Sprint 008, the MVP has:

- tenant-aware auth/membership foundation;
- admin setup workspace;
- teacher Papan Pagi, attendance, messages, grades, and notes;
- parent home, attendance, notifications, grades, notes, and messages;
- deterministic local-dev seed data;
- setup and smoke docs.

The remaining blocker before a controlled pilot is confidence in the live path.
Automated PGlite tests prove business logic, but a pilot needs a real database,
real Better Auth cookies, real dev servers, and a repeatable smoke script/check.

## Goals

1. Make environment validation explicit.
2. Prove live database migrate + seed against `DATABASE_URL`.
3. Prove Better Auth HTTP sign-in/session/sign-out flow.
4. Provide a scripted live smoke check for the core seeded roles.
5. Update setup and pilot docs so Ian can run the rehearsal without relying on
   hidden chat context.
6. Keep all existing automated tests green.

## Target Users

- Ian / Architect reviewing pilot readiness.
- Claude / Builder implementing the approved hardening.
- A future SOKA operator preparing a controlled pilot rehearsal.

This sprint does not target day-to-day school users directly.

## In Scope

### Environment Validation

Add a small script or command that validates required environment variables for
the live path:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `WEB_ORIGIN`
- API port / web URL assumptions where applicable

The validator should:

- fail clearly when a required value is missing;
- warn when an obviously placeholder/insecure value is used;
- avoid printing secrets;
- be safe to run locally.

### Live Smoke Script

Add a scripted smoke check that can run against a live API/web setup or at least
the live API. The exact shape is Builder-owned, but it should prove the most
important pilot path:

- API health responds;
- seeded admin can sign in through Better Auth over HTTP;
- `/me` returns a session after sign-in;
- `/me/memberships` returns the admin school membership;
- admin-only endpoint can be called, such as `/admin/classes` or
  `/admin/memberships`;
- sign-out clears the session;
- unauthenticated `/me` after sign-out returns unauthorized/null behavior.

If feasible in a small script, also prove:

- teacher sign-in can load `/guru/classes` or `/guru/papan-pagi`;
- parent sign-in can load `/parent/children` or `/parent/home`.

This script should not create a new product workflow. It is a rehearsal tool.

### Quality Gate Hardening

Fix or document the current Windows/Corepack nested `pnpm` issue so validation is
less surprising.

Acceptable solutions:

- adjust root scripts so they do not depend on a nested global `pnpm` that is not
  on PATH in the Codex environment; or
- add a clearly documented Windows/Corepack alternative command set.

Preferred outcome: `pnpm validate` or an equivalent documented command works
reliably after `corepack enable` / pinned pnpm install.

### Setup And Smoke Documentation

Update:

- `docs/SETUP.md`
- `docs/PILOT_SMOKE_CHECKLIST.md`
- `docs/VALIDATION.md`

The docs should separate:

- offline checks that do not need a live database;
- live database steps;
- live API/web server steps;
- scripted smoke;
- manual role smoke.

### Optional Small Tooling

Builder may add small scripts under `scripts/`, for example:

- `scripts/check-env.mjs`
- `scripts/live-smoke.mjs`
- `scripts/README.md`

Keep them dependency-light. Use built-in Node `fetch` where possible.

## Out Of Scope

Sprint 009 must not build:

- Pengumuman / broadcast announcements;
- browser push or native push;
- deployment automation tied deeply to one provider;
- CI/CD pipeline redesign;
- new production observability stack;
- full E2E browser automation with Playwright unless Builder can keep it very
  small and justified;
- new product modules;
- role/permission behavior changes;
- new database schema unless absolutely required for smoke/readiness;
- payments, documents, principal analytics, student login, LMS, or full TU.

## Non-Negotiables

- Do not weaken auth, tenant isolation, or parent visibility rules.
- Do not introduce demo bypass auth.
- Do not commit real secrets.
- Do not print secrets in logs.
- Do not make seeded local-dev accounts sound production-safe.
- Do not depend on Supabase.
- Do not start Sprint 010 or Pengumuman work.

## Expected Outputs

- Sprint 009 hardening scripts/commands.
- Updated package scripts if needed.
- Updated setup/smoke/validation docs.
- Completion notes with exact commands run.
- Existing 110 API tests still passing.
- Typecheck clean.
- Web build successful.

## Success Definition

By the end of Sprint 009, Ian should be able to answer:

"Can I set up a live database, run migrations and seed, start SOKA, sign in as
admin/teacher/parent over real Better Auth HTTP, and walk the pilot smoke path
without relying on Claude's chat history?"

The answer should be yes.
