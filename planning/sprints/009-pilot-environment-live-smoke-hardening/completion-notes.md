# Sprint 009 Completion Notes: Pilot Environment / Live Smoke Hardening

Status: Implemented by Builder on branch `claude/sprint-009-live-smoke`. Ready for
Architect review. PR not yet opened.

## Scripts added / changed

- `scripts/load-env.mjs` (new) — shared, dependency-free `.env` loader for the
  Node helper scripts. Searches upward from cwd for `.env`, parses `KEY=VALUE`
  (ignores blanks/`#`, strips one quote layer), and **never overwrites** an
  already-set real env var. Returns the loaded path (or null); never logs values.
- `scripts/check-env.mjs` (new, `pnpm check:env`) — validates live-path env.
- `scripts/live-smoke.mjs` (new, `pnpm smoke:live`) — live HTTP Better Auth smoke.
- `scripts/README.md` (rewritten) — rehearsal order + Windows/Corepack note.
- `package.json` — added `"check:env"` and `"smoke:live"` scripts. `validate`
  unchanged.

## Environment loading (live entrypoints)

- `packages/db/src/loadEnv.ts` (new) — same loader as the script version, exported
  from `@soka/db`. Non-overwrite, dependency-free, no-op when no `.env`.
- Wired in:
  - `apps/api/src/index.ts` — calls `loadEnv()` first, then **dynamically**
    imports `@soka/auth`, `@soka/db`, and `./app` (Better Auth resolves the DB
    from `process.env` at module load, so env must be set before that import).
  - `packages/db/src/migrate.ts` — `loadEnv()` at the top of `main()` before
    reading `DATABASE_URL`.
  - `packages/db/src/seed.ts` — `loadEnv()` before a dynamic `import("@soka/auth")`.
- Why: previously **nothing** loaded `.env` (no dotenv; `tsx` does not auto-load),
  so the documented live path (`cp .env.example .env` → `pnpm db:migrate`) failed
  unless the user exported vars manually. This is the narrow live-path fix allowed
  by the sprint. No schema/migration; no behavior change when env is already set.

## Environment validation behavior (`pnpm check:env`)

- Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `WEB_ORIGIN`.
  - missing → FAIL; `.env.example` placeholder for `DATABASE_URL`/`BETTER_AUTH_SECRET`
    → FAIL; secret shorter than 16 chars → FAIL; non-`postgres://` URL or non-http
    URL/origin → FAIL.
- Optional (WARN only): `PORT`, `SOKA_API_URL`, `SOKA_WEB_URL`.
- Prints variable names + status only; **never** prints secret values. Exits
  non-zero on any FAIL. A passing live `.env` must set the four required vars to
  real values (documented in `docs/SETUP.md` and the script's failure message).

## Live smoke behavior (`pnpm smoke:live`)

- Targets `SOKA_API_URL` (default `http://localhost:8787`). Assumes migrate + seed
  already ran.
- Manual cookie jar: reads `Set-Cookie` via `headers.getSetCookie()` when
  available, falling back to the raw `set-cookie` header; sends `Cookie` on
  subsequent requests; updates the jar on sign-out.
- Flow: `GET /health` → `POST /api/auth/sign-in/email` (admin) → `GET /me` →
  `GET /me/memberships` (asserts `admin_sekolah`) → `GET /admin/memberships`
  (admin-only) → `POST /api/auth/sign-out` → `GET /me` (expects 401); then optional
  `guru.a@` → `GET /guru/classes` (Kelas 1A) and `multi@` → `GET /parent/children`
  (Adinda Putri).
- Read-only apart from normal auth session records. Classified failures:
  API not running (exit 2), seed not run / wrong credentials (sign-in 4xx),
  auth/cookie/session failure (`/me` not authed or session not cleared), and
  protected-route/permission failure (admin route 403).
- Seeded accounts are explicitly labelled LOCAL-DEV only. No browser/native push
  is implied.

## Docs updated

- `docs/SETUP.md` — `.env` auto-load + non-overwrite note; what a passing `.env`
  needs; `pnpm check:env` step; Corepack activation for `validate`; test count
  100→110; scripted `pnpm smoke:live` step; renumbered sections.
- `docs/PILOT_SMOKE_CHECKLIST.md` — added a `check:env` setup step and a
  "Scripted smoke" section (S1–S6) before the manual paths.
- `docs/VALIDATION.md` — Sprint 009 section: tooling, quality-gate story, and
  results incl. the live-smoke limitation in this environment.
- `.env.example` — clarified required vs optional; added optional `SOKA_API_URL`/
  `SOKA_WEB_URL`; noted `.env` is gitignored.
- `planning/STATE.md` + this completion-notes file. `planning/DECISIONS.md`
  unchanged (no durable architecture decision; the loader is tooling, not a new
  provider baseline).

## Exact commands run + results (this environment)

- `pnpm install` — ok.
- `pnpm test` — **110/110 passing** (unchanged).
- `pnpm typecheck` — clean across all packages.
- `pnpm --filter @soka/web build` — succeeds.
- `pnpm validate` — succeeds (exit 0).
- `node --check` on all three scripts — passes.
- `pnpm check:env` — exit 1 with no `.env` (required missing); exit 1 with a
  placeholder `.env` (DB + secret rejected); exit 0 with real-looking values. No
  secrets printed. (Temporary `.env` files used for testing were removed and are
  gitignored.)
- `pnpm smoke:live` — **blocked** in this environment: no live Postgres server and
  no running API, so the full HTTP flow cannot execute. Proven instead that the
  script is syntactically valid and fails gracefully: `cannot reach
  http://localhost:8787 — is the API running?` with exit code 2.

## Live-environment limitations / follow-up

- The full `pnpm smoke:live` pass requires a real `DATABASE_URL`, applied
  migrations, seed data, and a running API — not available in the Builder
  environment. Ian can run it per `docs/SETUP.md` §4–§7.
- `pnpm validate` works here; the Windows/Corepack nested-`pnpm` issue is handled
  by documentation (`corepack enable` + `corepack prepare pnpm@10.33.0 --activate`)
  rather than a script change, to avoid Turborepo/Nx or fragile rewrites.

## Explicit deferrals

No Pengumuman/broadcast, push delivery, deployment-provider lock-in, CI/CD
redesign, observability stack, Playwright/E2E, new product module, auth
bypass/demo-login, role/permission change, schema/migration, or Supabase. No
Sprint 010 work.
