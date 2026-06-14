# Sprint 007 Builder Handoff Prompt

You are Claude acting as Builder for SOKA Baru.

Codex/Architect has prepared Sprint 007: Pilot Readiness & App Shell. Your job
is to read the repo, produce a pre-edit implementation plan, wait for approval,
then implement only the approved Sprint 007 scope.

## Start By Reading

Read these files before planning:

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
12. `planning/sprints/007-pilot-readiness-app-shell/blueprint.md`
13. `planning/sprints/007-pilot-readiness-app-shell/acceptance.md`
14. `docs/API.md`
15. `docs/DATA_MODEL.md`
16. `docs/PERMISSIONS.md`
17. `docs/UX_VISUAL_STANDARD.md`
18. `docs/VALIDATION.md`
19. existing `apps/web/src/*`
20. existing root/workspace `package.json` scripts

## Before Editing Files

Stop after reading and summarize your implementation plan.

Your pre-edit plan must include:

1. Current web UI structure and what feels like raw validation UI.
2. Proposed app shell/component structure.
3. Role detection and role switching plan.
4. Login/session handling plan, including whether sign-out is practical.
5. Teacher workspace surfaces to expose.
6. Parent workspace surfaces to expose.
7. Seed/demo and setup documentation plan.
8. Whether you will add a `pnpm validate` script.
9. Smoke checklist plan.
10. Files to create/modify.
11. Validation commands to run.
12. Explicit deferrals.

Do not edit files until Ian approves the plan or asks for Architect review.

## Sprint 007 Scope

Build:

- role-aware app shell for existing MVP surfaces
- clear sign-in and membership/role state
- teacher workspace using existing Papan Pagi, attendance, and Nilai & Catatan
- parent workspace using existing Beranda Anak, attendance, notifications,
  grades, notes, and messages
- understandable loading/empty/error states
- local/live setup documentation
- pilot smoke checklist
- optional root validation script wrapping existing checks
- completion notes and state/docs updates

## Non-Negotiables

Do not:

- add new product modules
- create dead navigation for unimplemented modules
- trust client-supplied `school_id`
- change parent visibility rules
- expose draft grades to parents
- expose internal notes to parents
- build Pengumuman/broadcast
- build full admin/TU UI
- build full raport/finalization
- build payment, parent premium, finance, invoice, or receipt flows
- build student login, assignments, materials, submissions, or LMS workflows
- build principal analytics
- build browser/native push or Capacitor packaging
- replace Better Auth, Neon/Postgres, Hono, Drizzle, React, Vite, TypeScript,
  or Tailwind
- copy SOKA Lama code wholesale
- start Sprint 008

## Validation Required Before PR

Run:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
```

If you add `pnpm validate`, run it too or explain why it duplicates the commands
above.

If a command cannot run, document:

- exact command attempted
- exact failure
- whether it is environment-related
- what equivalent validation was run instead

## Completion Response

When done, report:

- app shell changes
- role/session handling behavior
- teacher workspace changes
- parent workspace changes
- setup/smoke docs added
- scripts changed, if any
- tests or validation run and final test count
- docs updated
- explicit deferrals

Do not merge the PR. Leave it ready for Architect review.
