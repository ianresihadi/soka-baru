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

Copy the example file and fill it in:

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Neon or local Postgres). |
| `BETTER_AUTH_SECRET` | Long random string used by Better Auth. Use any long random value for local dev. |
| `BETTER_AUTH_URL` | API base URL. Local default `http://localhost:8787`. |
| `WEB_ORIGIN` | Comma-separated web origins allowed to call the API. Local default `http://localhost:5173`. |
| `PORT` | API server port. Local default `8787`. |

## 2. Install dependencies

```bash
pnpm install
```

## 3. Offline checks (no database needed)

The automated test suite runs fully in-process with PGlite and applies the real
Drizzle migrations, so it does not need `DATABASE_URL`:

```bash
pnpm db:generate   # regenerate migrations from schema (offline)
pnpm test          # 100 API tests (PGlite + real migrations)
pnpm typecheck     # tsc --noEmit across all packages
pnpm --filter @soka/web build
```

Or run the combined quality gate:

```bash
pnpm validate      # test + typecheck + web build (does NOT run install)
```

## 4. Live database path (Neon or local Postgres)

With `DATABASE_URL` set in `.env`:

```bash
pnpm db:migrate    # apply migrations to the live database
pnpm db:seed       # seed local-dev demo data (idempotent)
```

`pnpm db:seed` is **local-dev / pilot rehearsal only** and is safe to re-run
(idempotent). It does not create production credentials.

## 5. Run the dev servers

```bash
pnpm dev:api       # Hono API on http://localhost:8787
pnpm dev:web       # Vite web app on http://localhost:5173
```

Open `http://localhost:5173`. The web app proxies `/api`, `/me`, `/guru`,
`/parent`, `/admin`, etc. to the API (see `apps/web/vite.config.ts`).

## 6. Seeded demo accounts (LOCAL DEV ONLY)

`pnpm db:seed` creates the following. **These are local-dev credentials only and
must never be used in production.**

| Email | Password | Roles | School | Can test |
|---|---|---|---|---|
| `guru.a@example.com` | `LocalDevPassword123!` | `guru`, `wali_kelas` | SD Soka Alpha (`SOKA-A`) | Teacher workspace: Papan Pagi, attendance for **Kelas 1A**, Nilai & Catatan (create/publish). |
| `multi@example.com` | `LocalDevPassword123!` | `wali_kelas`, `orang_tua` | SD Soka Alpha (`SOKA-A`) | Both workspaces (role switcher). As parent, linked to child **Adinda Putri**: Beranda, attendance, published grades/notes, messages, notifications. |
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
- There is no admin setup UI yet; teacher accounts/memberships and the demo
  class/roster/parent-link are created via the seed (server-controlled), not via
  a client self-claim path.
