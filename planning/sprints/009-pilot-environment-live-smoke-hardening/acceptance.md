# Sprint 009 Acceptance Criteria

Sprint 009 is complete when all criteria below are met.

## Environment Validation

- A documented command exists to validate live-path environment variables.
- Missing required variables fail clearly.
- Placeholder or insecure values produce clear warnings or failures where
  appropriate.
- Secrets are not printed.
- `.env.example` remains safe to commit and explains required values.

## Live Smoke Script

- A documented command exists to run a live HTTP smoke check.
- The smoke check verifies `GET /health`.
- The smoke check signs in through Better Auth's real HTTP email/password route.
- The smoke check preserves cookies/session across requests.
- The smoke check verifies `GET /me`.
- The smoke check verifies at least one admin-only seeded route.
- The smoke check signs out through Better Auth's real sign-out route.
- The smoke check verifies the session is no longer active after sign-out.
- If included, teacher and parent seeded account checks verify `/guru/*` and
  `/parent/*` reads without changing product data.

## Validation Gate

- Existing API tests remain green.
- Typecheck is clean.
- Web build succeeds.
- The root validation story is fixed or documented so Ian knows exactly how to
  run it on Windows/Corepack.
- No existing Sprint 002-008 behavior regresses.

## Documentation

- `docs/SETUP.md` clearly separates:
  - offline validation;
  - live database migrate/seed;
  - dev server startup;
  - scripted live smoke;
  - manual smoke.
- `docs/PILOT_SMOKE_CHECKLIST.md` includes the scripted smoke step and keeps the
  manual role checklist.
- `docs/VALIDATION.md` records Sprint 009 validation, including any environment
  limitations.
- Sprint 009 completion notes record exact commands run and outcomes.
- `planning/STATE.md` is updated after implementation.

## Scope Guardrails

Sprint 009 must not include:

- Pengumuman / broadcast;
- push notification delivery;
- new product modules;
- full deployment automation or CI/CD redesign;
- provider-specific production lock-in;
- auth bypass or demo-login shortcuts;
- new role behavior;
- weakened tenant isolation;
- payments, documents, principal analytics, student login, LMS, or full TU.

## Required Commands Before PR

Builder must run, or explicitly document why an environment-dependent command
cannot run:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
pnpm validate
pnpm check:env
pnpm smoke:live
```

If a live API/database is unavailable, `pnpm smoke:live` may be reported as
blocked only with clear setup instructions for Ian.

## Definition Of Done

Ian can prepare a pilot rehearsal by following repo docs, not chat history:

1. configure `.env`;
2. validate env;
3. migrate and seed a live Postgres database;
4. start API and web;
5. run scripted smoke;
6. walk the manual admin/teacher/parent smoke checklist.
