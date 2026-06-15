# scripts/

Dependency-light Node helper scripts for SOKA Baru's local/live pilot rehearsal.
They use only Node built-ins (`fetch`, `fs`) and never print secret values.

| Script | Package script | Purpose |
|---|---|---|
| `load-env.mjs` | — | Shared `.env` loader (non-overwrite). Imported by the others. |
| `check-env.mjs` | `pnpm check:env` | Validate live-path environment variables. |
| `live-smoke.mjs` | `pnpm smoke:live` | HTTP smoke check of the Better Auth session flow + seeded roles. |

## Pilot rehearsal order

```bash
# 1. Offline checks (no database needed)
pnpm install
pnpm validate            # = pnpm test && pnpm typecheck && pnpm --filter @soka/web build
                         # On Windows/Corepack, run `corepack enable` first (see below).

# 2. Configure + validate environment
cp .env.example .env     # Windows CMD: copy .env.example .env
                         # PowerShell:  Copy-Item .env.example .env
                         # then edit with real values
pnpm check:env           # fails clearly if required vars are missing/placeholder

# 3. Live database (Neon or local Postgres; DATABASE_URL in .env)
pnpm db:migrate
pnpm db:seed             # local-dev demo accounts only

# 4. Start servers (separate terminals)
pnpm dev:api             # http://localhost:8787
pnpm dev:web             # http://localhost:5173

# 5. Scripted smoke (API must be running + seeded)
pnpm smoke:live          # SOKA_API_URL overrides the default API URL

# 6. Manual smoke
# Walk docs/PILOT_SMOKE_CHECKLIST.md (admin / teacher / parent paths).
```

## `pnpm validate` on Windows / Corepack

`validate` calls nested `pnpm` commands. If `pnpm` is not on PATH (a Corepack
quirk), activate it once, then run validate:

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm validate
```

## Notes

- `.env` is gitignored; never commit real secrets.
- Seeded accounts (`admin.a@`, `guru.a@`, `multi@`, password `LocalDevPassword123!`)
  are **local-dev / pilot rehearsal only** — never production-safe.
- `smoke:live` is read-only apart from normal Better Auth session records.
