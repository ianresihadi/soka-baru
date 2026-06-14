# Sprint 008 Builder Handoff Prompt

You are Claude acting as Builder for SOKA Baru.

Codex/Architect has prepared Sprint 008: Admin Setup UI Hardening. Your job is
to read the repo, produce a pre-edit implementation plan, wait for approval,
then implement only the approved Sprint 008 scope.

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
10. `planning/sprints/008-admin-setup-ui-hardening/requirements.md`
11. `planning/sprints/008-admin-setup-ui-hardening/blueprint.md`
12. `planning/sprints/008-admin-setup-ui-hardening/acceptance.md`
13. `planning/sprints/003-admin-onboarding-minimal/requirements.md`
14. `planning/sprints/003-admin-onboarding-minimal/acceptance.md`
15. `docs/API.md`
16. `docs/DATA_MODEL.md`
17. `docs/PERMISSIONS.md`
18. `docs/UX_VISUAL_STANDARD.md`
19. `docs/VALIDATION.md`
20. `docs/SETUP.md`
21. `docs/PILOT_SMOKE_CHECKLIST.md`
22. existing `apps/web/src/*`
23. `apps/api/src/app.ts`
24. `packages/db/src/onboarding.ts`

## Before Editing Files

Stop after reading and summarize your implementation plan.

Your pre-edit plan must include:

1. Current shell/workspace structure.
2. How you will expose Admin/Setup only to `admin_sekolah`/`soka_internal`.
3. Admin workspace components/sections.
4. Exact APIs used for classes, students, teacher assignment, parent link codes,
   and settings.
5. Whether a new narrow backend endpoint is needed for listing teacher
   memberships, and how it will be guarded/tested.
6. UI state and error handling plan.
7. Tests to add or why no backend tests are needed.
8. Documentation updates.
9. Validation commands.
10. Explicit deferrals.

Do not edit files until Ian approves the plan or asks for Architect review.

## Sprint 008 Scope

Build:

- Admin/Setup workspace in the existing app shell
- class list/create
- student list/create/bulk simple input/assign class
- teacher assignment to class using existing membership model
- parent link code generate/list/revoke
- school settings edit for existing settings fields
- narrow backend helper only if required for same-tenant teacher membership
  selection
- docs and smoke checklist updates

## Non-Negotiables

Do not:

- expose admin workspace to non-admin roles
- trust client-supplied `school_id`
- create full TU/admin product
- create general user management
- allow public self-assignment of privileged roles
- create payment, finance, document, letter, government reporting, staff
  attendance, principal analytics, student login, assignment/material, broadcast,
  push, or parent premium workflows
- build a complex Excel importer
- create dead navigation
- replace the chosen stack
- start Sprint 009

## Validation Required Before PR

Run:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
pnpm validate
```

If `pnpm validate` cannot run due to the nested `pnpm` PATH issue seen in
Codex, run and report its three constituent commands.

## Completion Response

When done, report:

- admin workspace changes
- backend changes, if any
- API routes used/added
- tests added and final test count
- validation command results
- docs updated
- explicit deferrals

Do not merge the PR. Leave it ready for Architect review.
