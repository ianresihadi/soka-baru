# Sprint 005 Builder Handoff Prompt

You are the Builder for SOKA Baru Sprint 005: Parent Trust Loop.

Use the repository as the source of truth. Do not rely on chat history outside
this folder.

## Required Read Order

Read these files before planning implementation:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `CONTEXT.md`
4. `planning/STATE.md`
5. `planning/DECISIONS.md`
6. `planning/DOMAIN.md`
7. `planning/RISKS.md`
8. `planning/QUESTIONS.md`
9. `planning/ARCHITECT-BUILDER-RUNBOOK.md`
10. `planning/sprints/005-parent-trust-loop/requirements.md`
11. `planning/sprints/005-parent-trust-loop/blueprint.md`
12. `planning/sprints/005-parent-trust-loop/acceptance.md`
13. `docs/API.md`
14. `docs/DATA_MODEL.md`
15. `docs/PERMISSIONS.md`
16. `docs/VALIDATION.md`
17. `docs/UX_VISUAL_STANDARD.md`

## Pre-Edit Response Required

Before editing files, respond with an implementation plan covering:

1. Whether a new migration is needed.
2. Parent trust service functions you will add/reuse.
3. API routes you will add or keep.
4. How parent linked-child access will be enforced.
5. How parent home / Beranda Anak will be shaped.
6. How attendance history will be exposed read-only.
7. How notifications will be listed and marked read.
8. How parent message thread list/detail/send will work.
9. What `apps/web` will show for the mobile-first parent validation UI.
10. Exact tests and commands you will run.

Wait for approval before implementation if Ian asks for Architect review.

## Build Scope

Implement Sprint 005 only.

Allowed:

- parent home / Beranda Anak aggregate
- linked child list/switching
- parent attendance visibility/history
- parent notification center and mark-read
- parent message thread list/detail/send
- mobile-first parent validation UI in `apps/web`
- tests and docs

Not allowed:

- grades/raport implementation
- student notes implementation
- payment/SPP
- parent premium subscription
- assignments/tasks
- learning materials
- forum/social feed
- feedback/survey
- native app packaging
- browser/native push delivery
- full chat polish
- message SLA/timer
- principal analytics
- Sprint 006 work

## Product Rules

- Parent home is reassurance-first, not data-dump.
- Parent home should answer:
  - Is my child present / what is today's attendance status?
  - Is there an important notification?
  - Is there a message needing attention?
  - Is there anything I need to do?
- Attendance not recorded yet should be neutral, not treated as `alpa`.
- Parent may read attendance but must not edit/correct attendance.
- Notifications are in-app only.
- Parent messages remain minimal; no full chat system.
- Nilai/Raport and Catatan Siswa are not implemented in Sprint 005.
- Parent premium remains a future hypothesis, not MVP scope.

## Security and Tenancy Rules

- Never trust `school_id` from client input.
- Parent access must be derived from `parent_student_links` and the caller's
  memberships.
- A parent can only access linked children.
- A parent can only see their own notification records.
- A parent can only mark their own notifications read.
- A parent can only see/send messages in threads for linked children.
- `orang_tua` must remain blocked from `/guru/*`.
- Tests must prove cross-school and cross-parent isolation.

## Required Validation

Run:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
```

If a command fails, stop and report the exact failure. Do not claim Sprint 005
is complete until tests and docs match `acceptance.md`.

## Required Documentation

Update:

- `docs/API.md`
- `docs/DATA_MODEL.md` if schema changes
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/005-parent-trust-loop/completion-notes.md`

Update `planning/DECISIONS.md` only if implementation reveals a durable product
or architecture decision that is not already recorded.

## Done Means

Open a PR only after:

- implementation is complete
- tests pass
- typecheck passes
- web build passes
- docs are updated
- completion notes explain deferrals clearly

Do not start Sprint 006.
