# Sprint 010 Builder Handoff Prompt

You are Builder for SOKA Baru. Implement **Sprint 010: Pilot UX & Visual
Productization**.

## Read First

Read these files before planning or editing:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `CONTEXT.md`
4. `planning/STATE.md`
5. `planning/DECISIONS.md`
6. `planning/DOMAIN.md`
7. `planning/RISKS.md`
8. `planning/QUESTIONS.md`
9. `planning/ARCHITECT-BUILDER-RUNBOOK.md`
10. `docs/UX_VISUAL_STANDARD.md`
11. `docs/PILOT_SMOKE_CHECKLIST.md`
12. `docs/SETUP.md`
13. `planning/sprints/010-pilot-ux-visual-productization/requirements.md`
14. `planning/sprints/010-pilot-ux-visual-productization/blueprint.md`
15. `planning/sprints/010-pilot-ux-visual-productization/acceptance.md`
16. `apps/web/src/App.tsx`
17. `apps/web/src/AppShell.tsx`
18. `apps/web/src/LoginPanel.tsx`
19. `apps/web/src/RoleSwitcher.tsx`
20. `apps/web/src/TeacherWorkspace.tsx`
21. `apps/web/src/PapanPagi.tsx`
22. `apps/web/src/TeacherGradesNotes.tsx`
23. `apps/web/src/ParentWorkspace.tsx`
24. `apps/web/src/ParentHome.tsx`
25. `apps/web/src/AdminSetupWorkspace.tsx`
26. `apps/web/src/index.css`
27. `packages/db/src/seed.ts`

## Pre-Edit Plan Required

Before editing any files, summarize:

- the current UI problems;
- the productized visual direction you will implement;
- exact files you will change;
- whether you will add small shared UI components/classes;
- whether seed/demo data will change;
- desktop and mobile visual verification plan;
- validation commands;
- explicit deferrals.

Wait for Ian approval before editing.

## Approved Scope

You may:

- improve the existing web app shell;
- improve existing admin, teacher, and parent workspaces;
- add small frontend UI primitives/components;
- update local CSS/Tailwind usage;
- improve local-dev seed/demo presentation only if small and safe;
- update UX/pilot/validation docs;
- update `planning/STATE.md` and Sprint 010 completion notes.

You must not:

- add Pengumuman/broadcast;
- add push delivery;
- add payments, full raport, student login, LMS, principal analytics, or full TU;
- add a new backend product module;
- add database schema/migrations unless Architect explicitly approves;
- change auth, roles, tenant isolation, or parent visibility;
- add demo auth bypass;
- add fake runtime mock data;
- reintroduce Supabase;
- start Sprint 011.

## UX Direction

Follow the approved UX principle:

**Hangat, ramah, tertib, dan operasional.**

Teacher UI:

- dense-but-calm;
- task-first;
- Papan Pagi order unchanged;
- attendance should be fast and obvious.

Parent UI:

- mobile-first;
- reassurance-first;
- details behind summaries;
- no dense tables on the first screen.

Admin setup:

- guided setup;
- operational and scannable;
- not a full TU module.

## Visual QA Required

Before PR, visually check:

- login screen;
- admin setup workspace;
- teacher Papan Pagi / attendance;
- parent home;
- desktop around 1366x768;
- mobile around 390x844.

Report screenshots or a concise visual QA note in completion notes. Watch for
text overflow, overlap, broken mobile layout, unreadable contrast, and dead
navigation.

## Validation Required

Before opening a PR, run:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
pnpm validate
```

If global `pnpm` is unavailable, use:

```bash
corepack pnpm@10.33.0 ...
```

and record the exact command results.

## Completion Notes

Update:

- `docs/UX_VISUAL_STANDARD.md`
- `docs/PILOT_SMOKE_CHECKLIST.md` if walkthrough changes
- `docs/VALIDATION.md` if validation changes
- `planning/STATE.md`
- `planning/sprints/010-pilot-ux-visual-productization/completion-notes.md`

Record exact commands and results. Do not merge the PR yourself.
