# SOKA Baru

SOKA Baru is a clean rebuild planning workspace for SOKA, a school operating app for Indonesian private elementary schools.

## Status

See `planning/STATE.md` for the current project state.

## Operating Model

This repo uses a 120x-style Architect / Builder workflow:

- `planning/` holds state, decisions, domain context, risks, questions, and sprint files.
- `docs/` holds durable technical documentation.
- `references/` records external source material.

The handoff is a folder, not a conversation.

## Application Workspace (since Sprint 002)

pnpm workspaces monorepo:

```text
apps/api      # Hono API (auth, membership, tenant-isolation, daily loop, parent trust, nilai & catatan)
apps/web      # React/Vite/Tailwind role-aware app shell (teacher + parent workspaces)
packages/db   # Drizzle schema, migrations, tenant-aware repositories, seed
packages/auth # Better Auth (email/password) config
packages/shared # roles, shared types, zod validation
```

### Local development

Full local setup, env values, seeded demo accounts, and the pilot smoke
checklist live in **`docs/SETUP.md`** and **`docs/PILOT_SMOKE_CHECKLIST.md`**.
Quick start:

```bash
cp .env.example .env     # set DATABASE_URL, BETTER_AUTH_SECRET, etc.
pnpm install
pnpm validate            # test + typecheck + web build (one quality gate)

# With a live Postgres (Neon or local) configured in .env:
pnpm db:migrate
pnpm db:seed             # local-dev demo data (idempotent)
pnpm dev:api             # http://localhost:8787
pnpm dev:web             # http://localhost:5173
```
