# Sprint 009 Builder Handoff Prompt

You are Builder for SOKA Baru. Implement **Sprint 009: Pilot Environment / Live
Smoke Hardening**.

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
10. `planning/sprints/009-pilot-environment-live-smoke-hardening/requirements.md`
11. `planning/sprints/009-pilot-environment-live-smoke-hardening/blueprint.md`
12. `planning/sprints/009-pilot-environment-live-smoke-hardening/acceptance.md`
13. `docs/SETUP.md`
14. `docs/PILOT_SMOKE_CHECKLIST.md`
15. `docs/VALIDATION.md`
16. `.env.example`
17. `package.json`
18. `apps/api/src/index.ts`
19. `packages/auth/src/auth.ts`
20. `packages/db/src/seed.ts`
21. `apps/web/vite.config.ts`

## Pre-Edit Plan Required

Before editing any files, summarize:

- current validation/setup/live smoke state;
- exact scripts/files you will add or modify;
- whether you will change root package scripts;
- how the live smoke script will preserve Better Auth cookies;
- what environment variables will be required;
- what commands you will run;
- what docs you will update;
- explicit deferrals.

Wait for Ian approval before editing.

## Approved Scope

You may:

- add small scripts for environment validation and live HTTP smoke;
- update root package scripts if needed;
- update `.env.example` comments if useful;
- update setup/smoke/validation docs;
- update Sprint 009 completion notes and `planning/STATE.md`;
- fix a narrow live-path bug if discovered and test it.

You must not:

- add Pengumuman/broadcast;
- add push delivery;
- add a new product module;
- redesign deployment/CI;
- introduce provider-specific production lock-in;
- add auth bypass/demo login shortcuts;
- weaken tenant isolation or parent visibility;
- change role behavior;
- commit secrets;
- start Sprint 010.

## Validation Required

Before opening a PR, run:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
pnpm validate
pnpm check:env
pnpm smoke:live
```

If `pnpm smoke:live` cannot run because no live API/database is available, report
that clearly and prove everything else possible. The script and docs must still
be executable by Ian.

## Completion Notes

Update:

- `docs/SETUP.md`
- `docs/PILOT_SMOKE_CHECKLIST.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/009-pilot-environment-live-smoke-hardening/completion-notes.md`

Record exact commands and results. Do not merge the PR yourself.
