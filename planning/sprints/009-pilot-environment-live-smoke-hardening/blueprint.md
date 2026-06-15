# Sprint 009 Blueprint: Pilot Environment / Live Smoke Hardening

## Builder Summary

Sprint 009 is a hardening sprint for live pilot rehearsal.

Primary implementation shape:

- inspect current scripts, `.env.example`, `docs/SETUP.md`, and
  `docs/PILOT_SMOKE_CHECKLIST.md`;
- add a small environment validator;
- add a live HTTP smoke script for seeded demo accounts;
- improve validation scripts if needed to avoid the nested `pnpm` PATH issue;
- update setup/validation/smoke docs;
- run existing tests/typecheck/build.

This sprint should not add new product modules or change business workflows.

## Read First

Builder must read:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `CONTEXT.md`
4. `planning/STATE.md`
5. `planning/DECISIONS.md`
6. `planning/DOMAIN.md`
7. `planning/RISKS.md`
8. `planning/QUESTIONS.md`
9. `planning/ARCHITECT-BUILDER-RUNBOOK.md`
10. `planning/sprints/009-pilot-environment-live-smoke-hardening/requirements.md`
11. `planning/sprints/009-pilot-environment-live-smoke-hardening/acceptance.md`
12. `docs/SETUP.md`
13. `docs/PILOT_SMOKE_CHECKLIST.md`
14. `docs/VALIDATION.md`
15. `.env.example`
16. `package.json`
17. `apps/api/src/index.ts`
18. `packages/auth/src/auth.ts`
19. `packages/db/src/seed.ts`
20. `apps/web/vite.config.ts`

## Implementation Slices

### Slice 0: Pre-Edit Plan

Before editing files, Builder must summarize:

- current root scripts and why `pnpm validate` may fail in some environments;
- current live setup path;
- proposed scripts/files to add;
- exact HTTP smoke path;
- environment variables used;
- validation commands;
- docs to update;
- explicit deferrals.

Stop and ask Ian/Architect if the plan introduces deployment-provider lock-in,
new product modules, auth changes, or new schema.

### Slice 1: Environment Validator

Add a small script, likely:

```text
scripts/check-env.mjs
```

Recommended behavior:

- load `.env` if present, without adding a heavy dotenv dependency unless
  already available or strongly justified;
- validate the live-path variables:
  - `DATABASE_URL`
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL`
  - `WEB_ORIGIN`
  - `PORT` (optional/default acceptable)
  - optional web URL / API URL values used by the smoke script
- fail with clear messages;
- warn on placeholder values from `.env.example`;
- never print secret values;
- exit non-zero when required values are missing.

Add a package script such as:

```json
"check:env": "node scripts/check-env.mjs"
```

### Slice 2: Live Smoke Script

Add a small HTTP smoke script, likely:

```text
scripts/live-smoke.mjs
```

Suggested configuration:

- `SOKA_API_URL` default `http://localhost:8787`
- optional `SOKA_WEB_URL` default `http://localhost:5173`
- seeded local-dev credentials from `docs/SETUP.md`
- never treat those credentials as production-safe

Minimum HTTP checks:

1. `GET /health` returns `{ status: "ok" }`.
2. Sign in as `admin.a@example.com` through Better Auth:
   `POST /api/auth/sign-in/email`.
3. Preserve the returned cookie jar manually inside the script.
4. `GET /me` returns authenticated user.
5. `GET /me/memberships` includes `admin_sekolah` in SD Soka Alpha.
6. `GET /admin/classes` or `GET /admin/memberships` succeeds.
7. `POST /api/auth/sign-out` succeeds.
8. `GET /me` after sign-out is unauthorized.

Recommended additional checks if simple:

9. Sign in as `guru.a@example.com`; `GET /guru/classes` returns Kelas 1A.
10. Sign in as `multi@example.com`; `GET /parent/children` returns Adinda Putri.

Add a package script such as:

```json
"smoke:live": "node scripts/live-smoke.mjs"
```

Important:

- The script must assume migrations and seed already ran.
- The script should explain that failures often mean API is not running, seed is
  missing, Better Auth env is wrong, or cookies are not being preserved.
- Do not write to the database except normal sign-in/session records.
- Avoid creating classes/students in smoke unless absolutely necessary.

### Slice 3: Validation Script Hardening

Investigate root `package.json` scripts:

```json
"typecheck": "pnpm -r typecheck"
"test": "pnpm --filter @soka/api test"
"validate": "pnpm test && pnpm typecheck && pnpm --filter @soka/web build"
```

Problem observed in Codex:

- `corepack pnpm@10.33.0 validate` starts successfully;
- nested calls to `pnpm ...` may fail when `pnpm` is not on PATH.

Acceptable fixes:

- document that users should run `corepack enable` and then `pnpm validate`;
- or change scripts to use `pnpm` in a way that works consistently in this
  environment;
- or add a separate script that calls package commands via Node child processes
  without assuming nested global `pnpm`.

Builder should choose the smallest robust fix. Do not introduce Turborepo/Nx.

### Slice 4: Optional Live Checklist Script

If useful, add:

```text
scripts/README.md
```

It should document:

- offline validation commands;
- live env check;
- migrate/seed;
- dev server startup;
- live smoke command;
- manual smoke checklist.

### Slice 5: Docs

Update `docs/SETUP.md`:

- separate offline and live paths;
- add environment validation command;
- add live smoke command;
- clarify seeded demo accounts are local-dev/pilot rehearsal only;
- document common failure modes.

Update `docs/PILOT_SMOKE_CHECKLIST.md`:

- add a scripted smoke section before manual checks;
- keep the manual admin/teacher/parent checklist;
- clarify when to run against local vs live API/web URL.

Update `docs/VALIDATION.md`:

- add Sprint 009 validation section;
- document environment validator and live smoke;
- update current test count if unchanged at 110;
- record exact validation commands.

Update `planning/STATE.md` and Sprint 009 completion notes after implementation.

Update `planning/DECISIONS.md` only if Builder makes a durable architecture
decision, such as adding a new deployment provider baseline. Avoid doing that in
this sprint unless Ian explicitly approves.

### Slice 6: Validation

Required before PR:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
pnpm validate
pnpm check:env
pnpm smoke:live
```

If `pnpm smoke:live` cannot run because no live `DATABASE_URL` or no running API
is available, Builder must:

- still validate that the script type/syntax is correct where possible;
- document the exact reason live smoke could not be executed;
- keep the manual steps clear enough for Ian to run.

If `pnpm validate` still fails due to the nested `pnpm` PATH issue, Builder must
either fix it inside scope or document the exact reason and provide a working
equivalent.

## Suggested File Changes

Expected files:

- `scripts/check-env.mjs`
- `scripts/live-smoke.mjs`
- optionally `scripts/README.md`
- `package.json`
- `.env.example`
- `docs/SETUP.md`
- `docs/PILOT_SMOKE_CHECKLIST.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/009-pilot-environment-live-smoke-hardening/completion-notes.md`

Code changes in app packages should be minimal. If Builder finds a real live
HTTP bug, fix it narrowly and test it.

## Non-Negotiables

- No real secrets committed.
- No auth bypass.
- No mock/demo credentials treated as production defaults.
- No new product module.
- No provider-specific deployment lock-in unless Ian explicitly approves.
- No new role behavior or permission weakening.
- No Supabase baseline.
- No Sprint 010 work.

## Architect Review Focus

Architect will check:

- scripts are small, readable, and safe;
- live smoke really verifies Better Auth cookie/session behavior;
- docs are executable by Ian;
- `pnpm validate` story is clearer than before;
- no scope creep entered;
- existing 110 tests/typecheck/build stay green.
