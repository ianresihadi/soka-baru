# Sprint 007 Blueprint: Pilot Readiness & App Shell

## Builder Summary

Sprint 007 is a consolidation sprint.

Primary implementation shape:

- replace the raw validation-first `apps/web/src/App.tsx` experience with a
  role-aware app shell
- keep existing teacher and parent workflows, but make them navigable and
  presentable
- improve local/live setup docs and pilot smoke checks
- optionally add a lightweight root validation script
- avoid backend schema changes unless a tiny seed/setup fix is necessary
- avoid new product modules

The sprint should make SOKA easier to run and demo. It should not make SOKA
broader.

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
10. `planning/CHECKPOINT-001-006.md`
11. `planning/sprints/007-pilot-readiness-app-shell/requirements.md`
12. `planning/sprints/007-pilot-readiness-app-shell/acceptance.md`
13. `docs/API.md`
14. `docs/DATA_MODEL.md`
15. `docs/PERMISSIONS.md`
16. `docs/UX_VISUAL_STANDARD.md`
17. `docs/VALIDATION.md`
18. existing `apps/web/src/*` components
19. existing root and workspace `package.json` scripts

## Implementation Slices

### Slice 0: Pre-Edit Plan

Before editing files, Builder must summarize:

- current UI entry structure
- proposed app shell structure
- route/surface/navigation plan
- auth/session handling plan
- seed/demo documentation plan
- validation/check script plan
- smoke checklist plan
- files to create/modify
- tests/build commands to run
- explicit deferrals

Stop and ask Ian/Architect if the plan adds a new product module or changes
auth, tenancy, pricing, parent visibility, or role permissions.

### Slice 1: Inspect Current Web Surface

Inspect:

- `apps/web/src/App.tsx`
- `apps/web/src/PapanPagi.tsx`
- `apps/web/src/ParentHome.tsx`
- `apps/web/src/TeacherGradesNotes.tsx`
- `apps/web/vite.config.ts`

Current known issue:

- `App.tsx` still presents "Foundation Validation" and raw logs as the main
  experience.

Sprint 007 should move diagnostics out of the primary flow. Diagnostics may stay
behind a small collapsible developer section if useful.

### Slice 2: App Shell

Recommended component split:

```text
apps/web/src/App.tsx
apps/web/src/AppShell.tsx
apps/web/src/LoginPanel.tsx
apps/web/src/RoleSwitcher.tsx
apps/web/src/TeacherWorkspace.tsx
apps/web/src/ParentWorkspace.tsx
```

Builder may choose a smaller split if it keeps the code simpler.

Required shell behavior:

- unauthenticated users see sign-in first
- authenticated users can load memberships
- if memberships include teacher roles, show teacher workspace
- if memberships include `orang_tua`, show parent workspace
- if the user has both, allow switching
- if the user has no supported membership/children, show a clear empty state
- show current signed-in email/user context where available
- do not show raw JSON logs as the primary UI

Use existing APIs:

- `POST /api/auth/sign-in/email`
- `GET /me`
- `GET /me/memberships`
- existing `/guru/*` routes
- existing `/parent/*` routes

If sign-out is implemented, use Better Auth's supported route pattern. Do not
create a fake sign-out state that leaves the server session active.

### Slice 3: Navigation

Use role-aware navigation, not a marketing homepage.

Teacher navigation may include:

- Papan Pagi
- Absensi
- Nilai & Catatan
- Pesan Ortu

Parent navigation may include:

- Beranda Anak
- Absensi
- Nilai
- Catatan
- Pesan Guru
- Notifikasi

These can be anchors/sections inside existing components. Builder should not
create dead menu items that route to empty pages.

If a section is not separately implemented, it can point to the existing
component area that already contains the workflow.

### Slice 4: UX Standard

Follow `docs/UX_VISUAL_STANDARD.md`.

Teacher side:

- dense-but-calm
- task-first
- compact sections
- no oversized hero/marketing composition
- no nested cards inside cards

Parent side:

- mobile-first
- reassurance-first
- simple summaries before details
- clear action states for unread notifications and messages

Global shell:

- should feel warm, tidy, and operational
- use stable layout dimensions where possible
- no decorative gradient/orb/bokeh backgrounds
- avoid one-note color palettes
- text must not overflow buttons/cards on mobile

### Slice 5: Seed/Demo Path

Inspect:

- `packages/db/src/seed.ts`
- `.env.example`
- `README.md`
- existing docs

Required output:

- document how to set `.env`
- document how to run migration and seed against a live/local Postgres database
- document seeded demo accounts and their roles if present
- document what a teacher and parent can test after seeding

If seed data lacks a parent/teacher happy path for 001-006, Builder may adjust
seed data minimally. Any seed changes must stay deterministic and local-dev
only.

Do not add production demo credentials. Local demo credentials must be clearly
marked local-dev/pilot rehearsal only.

### Slice 6: Validation Script

Current required commands:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
```

Builder may add:

```json
"validate": "pnpm test && pnpm typecheck && pnpm --filter @soka/web build"
```

Do not include `pnpm install` inside the script.

Do not introduce Turborepo, Nx, a new test runner, or a heavy CI system unless
Architect approves.

### Slice 7: Pilot Smoke Checklist

Create `docs/PILOT_SMOKE_CHECKLIST.md`.

Minimum checklist:

1. Install dependencies.
2. Configure `.env`.
3. Run migrations.
4. Run seed.
5. Start API.
6. Start web.
7. Sign in as teacher.
8. Verify teacher membership and assigned class.
9. Record attendance.
10. Sign in as parent.
11. Verify linked child.
12. Verify attendance appears.
13. Sign back in as teacher.
14. Create and publish grade.
15. Verify parent can see published grade.
16. Create and publish note.
17. Verify parent can see published note.
18. Parent sends message.
19. Teacher sees or responds to message if UI supports it.

The checklist should be practical and should not claim browser/native push is
available.

### Slice 8: Tests

Sprint 007 should preserve the existing backend test suite.

Add tests only where code changes create risk:

- if seed logic changes, add or update lightweight validation around seed helpers
  if practical
- if shared validation changes, add relevant tests
- if API behavior changes, add focused API tests

For UI shell changes, minimum validation is:

- `pnpm --filter @soka/web build`
- TypeScript clean
- manual or documented smoke check

Do not add a heavy E2E dependency unless Builder can justify it within the
sprint scope.

### Slice 9: Documentation

Add or update:

- `docs/SETUP.md`
- `docs/PILOT_SMOKE_CHECKLIST.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/007-pilot-readiness-app-shell/completion-notes.md`

Update only if behavior changed:

- `docs/API.md`
- `docs/PERMISSIONS.md`
- `docs/UX_VISUAL_STANDARD.md`

## Suggested File Changes

Expected files to change or be added:

- `apps/web/src/App.tsx`
- `apps/web/src/AppShell.tsx`
- `apps/web/src/LoginPanel.tsx`
- `apps/web/src/RoleSwitcher.tsx`
- `apps/web/src/TeacherWorkspace.tsx`
- `apps/web/src/ParentWorkspace.tsx`
- `apps/web/src/PapanPagi.tsx` if section integration is needed
- `apps/web/src/ParentHome.tsx` if section integration is needed
- `package.json` if adding `validate`
- `README.md` if local setup pointers need cleanup
- `.env.example` if required env values are incomplete
- `packages/db/src/seed.ts` only if seed data is insufficient for smoke testing
- `docs/SETUP.md`
- `docs/PILOT_SMOKE_CHECKLIST.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/007-pilot-readiness-app-shell/completion-notes.md`

## Non-Negotiables

- Do not trust client-supplied `school_id`.
- Do not change parent visibility rules.
- Do not expose draft grades or internal notes to parents.
- Do not add new product modules.
- Do not create dead navigation for unimplemented modules.
- Do not add payments, parent premium, student login, assignments, materials,
  principal analytics, full TU, full raport, announcements, or push delivery.
- Do not replace Better Auth, Hono, Drizzle, Neon/Postgres, React, Vite,
  TypeScript, or Tailwind.
- Do not copy SOKA Lama code wholesale.
- Do not start Sprint 008.
