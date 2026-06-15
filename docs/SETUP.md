# Local Setup & Pilot Runbook

This document is the practical setup path for running SOKA Baru locally for
development, an internal demo, or a first controlled school pilot rehearsal.

It does not introduce production deployment automation — only local/live
database setup and the dev servers.

## Prerequisites

- Node.js >= 20
- pnpm 10.33.0 (the repo pins `packageManager`; `corepack enable` is the easiest
  way to match it)
- A Postgres database (Neon or local Postgres) for the live path

## 1. Environment variables

Copy the example file and fill it in. Use the command for your shell:

```bat
REM Windows CMD
copy .env.example .env
```

```powershell
# PowerShell
Copy-Item .env.example .env
```

```bash
# macOS / Linux / Git Bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Neon or local Postgres). |
| `BETTER_AUTH_SECRET` | Long random string used by Better Auth. Use any long random value for local dev. |
| `BETTER_AUTH_URL` | API base URL. Local default `http://localhost:8787`. |
| `WEB_ORIGIN` | Comma-separated web origins allowed to call the API. Local default `http://localhost:5173`. |
| `PORT` | API server port. Local default `8787`. |

`.env` is **auto-loaded** by the API server, `pnpm db:migrate`, and `pnpm db:seed`
(via a tiny built-in loader — no dotenv dependency). Real environment variables
already set in your shell are **not** overwritten by `.env`. `.env` is gitignored;
never commit real secrets.

A passing live `.env` must contain real values for `DATABASE_URL`,
`BETTER_AUTH_SECRET` (a long random string, ≥16 chars), `BETTER_AUTH_URL`, and
`WEB_ORIGIN`. The `.env.example` placeholders for `DATABASE_URL` and
`BETTER_AUTH_SECRET` are rejected by `pnpm check:env`.

## 2. Install dependencies

First make sure `pnpm` is available. This repo pins pnpm 10.33.0 via
`packageManager`; the easiest way to match it is Corepack. **Do this before
`pnpm install`** — it also fixes `pnpm is not recognized` on Windows and the
nested-`pnpm` failure in `pnpm validate`:

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
```

Then install:

```bash
pnpm install
```

## 3. Offline checks (no database needed)

The automated test suite runs fully in-process with PGlite and applies the real
Drizzle migrations, so it does not need `DATABASE_URL`:

```bash
pnpm db:generate   # regenerate migrations from schema (offline)
pnpm test          # 110 API tests (PGlite + real migrations)
pnpm typecheck     # tsc --noEmit across all packages
pnpm --filter @soka/web build
```

Or run the combined quality gate:

```bash
pnpm validate      # test + typecheck + web build (does NOT run install)
```

If `pnpm validate` fails on Windows because nested `pnpm` is not found, run the
Corepack activation above first, then re-run `pnpm validate`.

## 4. Validate the environment (live path)

After filling in `.env`, check it before touching the database:

```bash
pnpm check:env     # fails clearly on missing/placeholder required values
```

It validates `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and
`WEB_ORIGIN`, warns on optional vars (`PORT`, `SOKA_API_URL`, `SOKA_WEB_URL`), and
**never prints secret values**.

## 5. Live database path (Neon or local Postgres)

With a real `DATABASE_URL` in `.env`:

```bash
pnpm db:migrate    # apply migrations to the live database
pnpm db:seed       # seed local-dev demo data (idempotent)
```

`pnpm db:seed` is **local-dev / pilot rehearsal only** and is safe to re-run
(idempotent). It does not create production credentials.

## 6. Run the dev servers

```bash
pnpm dev:api       # Hono API on http://localhost:8787
pnpm dev:web       # Vite web app on http://localhost:5173
```

Open `http://localhost:5173`. The web app proxies `/api`, `/me`, `/guru`,
`/parent`, `/admin`, etc. to the API (see `apps/web/vite.config.ts`).

## 7. Scripted live smoke

With the API running and the database seeded, run the HTTP smoke check:

```bash
pnpm smoke:live    # SOKA_API_URL overrides the default http://localhost:8787
```

It verifies `GET /health`, signs in as `admin.a@example.com` over real Better
Auth, preserves the session cookie, checks `/me`, `/me/memberships`, an admin-only
route, sign-out, and that the session is cleared afterwards; then optional teacher
and parent reads. It is read-only apart from normal auth session records. Failures
are classified (API not running, seed not run, wrong credentials, auth/cookie
failure, permission failure). Then walk `docs/PILOT_SMOKE_CHECKLIST.md`.

## 8. Seeded demo accounts (LOCAL DEV ONLY)

`pnpm db:seed` creates the following. **These are local-dev credentials only and
must never be used in production.**

| Email | Password | Roles | School | Can test |
|---|---|---|---|---|
| `guru.a@example.com` | `LocalDevPassword123!` | `guru`, `wali_kelas` | SD Soka Alpha (`SOKA-A`) | Teacher workspace: Papan Pagi, attendance for **Kelas 1A**, Nilai & Catatan (create/publish). |
| `multi@example.com` | `LocalDevPassword123!` | `wali_kelas`, `orang_tua` | SD Soka Alpha (`SOKA-A`) | Both workspaces (role switcher). As parent, linked to child **Adinda Putri**: Beranda, attendance, published grades/notes, messages, notifications. |
| `admin.a@example.com` | `LocalDevPassword123!` | `admin_sekolah` | SD Soka Alpha (`SOKA-A`) | **Admin / Setup** workspace: create classes/students, assign students to classes, assign teachers, generate/revoke parent link codes, edit cutoff/timezone. |
| `guru.b@example.com` | `LocalDevPassword123!` | `guru` | SD Soka Beta (`SOKA-B`) | Teacher workspace for School B (used to demonstrate tenant isolation). |

Demo data created in **SD Soka Alpha** by the seed:

- Class **Kelas 1A**, with `guru.a@example.com` assigned as `wali_kelas`.
- Students: **Adinda Putri**, **Bagas Pratama**, **Citra Lestari** (in Kelas 1A).
- Parent link: `multi@example.com` is the `orang_tua` of **Adinda Putri**.

This gives one teacher happy path and one parent happy path so the 001-006
workflows can be smoke-tested end to end. See `docs/PILOT_SMOKE_CHECKLIST.md`.

## Notes & limitations

- Sign-out uses Better Auth's real `POST /api/auth/sign-out` route and clears the
  server session.
- Notifications are in-app only. Browser/native push is not available in this
  build.
- The Admin / Setup workspace (Sprint 008) lets an `admin_sekolah`/`soka_internal`
  user manage classes, students, teacher assignments, parent link codes, and
  school settings (attendance cutoff, timezone, and default KKM). It does **not**
  create user accounts or roles — teacher/admin accounts and memberships are still
  provisioned via the seed (server-controlled internal binding), not a client
  self-claim path.
