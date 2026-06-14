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
apps/api      # Hono API (auth, membership, tenant-isolation foundation)
apps/web      # React/Vite/Tailwind validation UI (foundation only)
packages/db   # Drizzle schema, migrations, tenant-aware repositories, seed
packages/auth # Better Auth (email/password) config
packages/shared # roles, shared types, zod validation
```

### Local development

```bash
cp .env.example .env     # set DATABASE_URL, BETTER_AUTH_SECRET, etc.
pnpm install
pnpm db:generate         # generate Drizzle migrations (offline)
pnpm typecheck           # tsc --noEmit across all packages
pnpm test                # vitest tenant/auth/role tests (in-process PGlite)

# With a live Postgres (Neon or local) configured in .env:
pnpm db:migrate
pnpm db:seed
pnpm dev:api             # http://localhost:8787
pnpm dev:web             # http://localhost:5173
```
