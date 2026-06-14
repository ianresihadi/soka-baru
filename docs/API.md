# API

## Overview

API design starts from the approved Sprint 002 stack baseline.

## API Baseline

- Hono custom TypeScript API.
- Better Auth for email/password auth and session handling.
- Drizzle ORM for typed database access and migrations.
- Neon Postgres as the primary database.
- Tenant-aware service/query layer that scopes school-owned reads and writes by `school_id`.
- Optional Postgres Row Level Security as defense-in-depth where it fits the Better Auth session model cleanly.

Session 5 confirms the MVP auth baseline:

- Email/password login.
- Unique `school_code` per school.
- User binding to `school_id` during account creation or first login.

## Required API Behaviors For Sprint 002

- Authenticate a user through email/password.
- Resolve the user's active school membership and role assignments.
- Bind a user to a school through `school_code` or school-issued invitation/link code.
- Reject cross-school reads and writes.
- Support one user with multiple roles in the same school.
- Keep Siswa role representable in the model without exposing Siswa MVP UI.

Supabase APIs are not part of the SOKA Baru baseline.

## Implemented In Sprint 002

The Hono API lives in `apps/api`. App wiring is a factory, `createApp(deps)`
(`apps/api/src/app.ts`), so tests can inject a stub auth resolver and an
in-process database. The production server (`apps/api/src/index.ts`) injects
Better Auth session resolution and the Neon Postgres database.

Routes:

| Route | Auth | Purpose |
|---|---|---|
| `GET /health` | none | Liveness check. |
| `GET|POST /api/auth/*` | Better Auth | Email/password sign-up, sign-in, session. |
| `GET /me` | session | Returns the authenticated `userId`. |
| `GET /me/memberships` | session | Lists the user's memberships, schools, and roles. |
| `POST /school-bindings/by-code` | session | Binds the user to a school via `schoolCode` + roles. |
| `GET /tenant-check/school` | session + membership | Validation scaffold: returns the caller's tenant school. |
| `POST /tenant-check/school` | session + membership + role | Validation scaffold: scoped write; ignores any client `schoolId`. |

The `tenant-check` routes are validation scaffolding, not product workflows.

Middleware pattern (`apps/api/src/app.ts`): `requireAuth` resolves the user
from the session, `requireMembership` resolves the active tenant context
server-side, and `requireRole(...)` checks assigned roles. Handlers never read
`school_id` from the request body for authorization.

Better Auth is configured in `packages/auth/src/auth.ts` (email/password only,
Drizzle adapter, shared Neon database).
