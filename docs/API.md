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
