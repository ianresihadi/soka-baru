# Claude Start Prompt: Sprint 002 Foundation Data/Auth

Paste this prompt into Claude while working in:

```text
C:\Users\USER\Documents\SOKA
```

## Prompt

You are the Builder for SOKA Baru Sprint 002: Foundation Data/Auth.

Use the repository as the source of truth. Do not rely on chat history outside this folder.

Read these files first, in this order:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `CONTEXT.md`
4. `planning/STATE.md`
5. `planning/DECISIONS.md`
6. `planning/DOMAIN.md`
7. `planning/RISKS.md`
8. `planning/QUESTIONS.md`
9. `planning/ARCHITECT-BUILDER-RUNBOOK.md`
10. `docs/ARCHITECTURE.md`
11. `docs/API.md`
12. `docs/DATA_MODEL.md`
13. `docs/PERMISSIONS.md`
14. `docs/VALIDATION.md`
15. `planning/sprints/002-foundation-data-auth/requirements.md`
16. `planning/sprints/002-foundation-data-auth/blueprint.md`
17. `planning/sprints/002-foundation-data-auth/acceptance.md`
18. `planning/sprints/002-foundation-data-auth/handoff-prompt.md`

After reading, do not edit files yet.

First, summarize your implementation plan:

1. Package/workspace structure you will create.
2. Core files you expect to create or modify.
3. Database tables/migrations you will add.
4. How Better Auth will be wired.
5. How `school_code` binding will work.
6. How tenant isolation will be enforced without trusting client-supplied `school_id`.
7. Whether you plan to implement Postgres RLS now or defer it with a reason.
8. Tests or validation steps you will run.
9. Any blockers, assumptions, or decisions that need Architect/Ian approval.

Approved stack:

- Frontend validation UI: React, Vite, TypeScript, Tailwind.
- Backend API: Hono.
- Database: Neon Postgres.
- ORM/migrations: Drizzle.
- Auth: Better Auth email/password.

Important boundaries:

- Supabase is not the SOKA Baru backend baseline.
- Do not build Guru daily loop UI.
- Do not build Orang Tua PWA features.
- Do not build attendance capture.
- Do not build parent messaging.
- Do not build payments.
- Do not build Kepala Sekolah dashboard.
- Do not redefine product scope or invent business rules.

Your first response should be the implementation plan only. Wait for approval before editing files.
