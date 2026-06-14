# Sprint 005 Acceptance Criteria

Sprint 005 is complete when all criteria below are met.

## Parent Access

- Parent can list linked child/children only.
- Parent can switch/select among linked children.
- Parent with no linked children receives a clear empty/no-child response.
- Parent cannot access another student's home, attendance, notifications, or
  messages by guessing IDs.
- Parent access is derived only from `parent_student_links` and the caller's
  memberships.

## Beranda Anak

- Parent can fetch a Beranda Anak aggregate for a linked child.
- Beranda Anak includes:
  - selected child identity
  - school and class context
  - today's attendance status or neutral "not recorded" state
  - child objective status if available
  - latest notification if any
  - latest message thread state if any
  - recent attendance summary/history
- Beranda Anak is reassurance-first; it does not expose raw admin dashboards or
  teacher-only data.

## Attendance Visibility

- Parent can view today's attendance for a linked child.
- Parent can view recent attendance history for a linked child.
- Attendance statuses use the five MVP statuses only:
  - `hadir`
  - `sakit`
  - `izin`
  - `alpa`
  - `terlambat`
- Parent cannot create, edit, or correct attendance.
- If attendance is not recorded, the response/UI shows a neutral empty state.

## Notifications

- Parent can list notification records that belong to their memberships.
- Parent can filter notifications by linked child.
- Parent can mark their own notification(s) as read.
- Parent cannot mark another user's notification as read.
- Sprint 005 does not implement browser/native push delivery.

## Parent Messages

- Parent can list message threads for linked children.
- Parent can view messages in their own thread.
- Parent can send a message about a linked child.
- Parent cannot view another parent's thread.
- Parent cannot send a message about an unlinked child.
- Teacher-only reply routes remain unavailable to parent users.
- No full chat features are introduced: no attachments, read receipts, typing
  state, SLA timer, broadcast, campaign, or templates.

## Mobile-First Parent UI

- `apps/web` includes a usable parent validation experience.
- Parent UI includes:
  - child switcher
  - Beranda Anak summary
  - attendance history
  - notifications
  - message thread/detail/send-message surface
- Layout is usable at mobile width and follows `docs/UX_VISUAL_STANDARD.md`.
- UI is reassurance-first with simple summaries, not a dense teacher/admin
  dashboard.
- No promoted menu entries for payment, premium, tasks, materials, forum, or
  grades/notes implementation.

## Permissions and Tenant Isolation

- API handlers do not accept `school_id` as authority.
- School A parent cannot read or mutate School B data.
- Parent A cannot access Parent B's linked child or thread.
- `orang_tua` cannot access `/guru/*`.
- Existing teacher/admin permissions from Sprint 002-004 remain intact.

## Documentation

- `docs/API.md` documents Sprint 005 parent routes.
- `docs/DATA_MODEL.md` is updated if schema changes.
- `docs/PERMISSIONS.md` documents parent trust-loop access rules.
- `docs/VALIDATION.md` documents new test coverage and commands.
- `planning/STATE.md` is updated with Sprint 005 build status.
- `planning/sprints/005-parent-trust-loop/completion-notes.md` records what was
  built, what was deferred, validation results, and any Architect-review notes.

## Validation Commands

Before opening the PR, Builder must run:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
```

If root `pnpm test` / `pnpm typecheck` hit a local PATH issue, Builder must run
the equivalent workspace commands and document the environment issue precisely.

Sprint 005 should not be accepted until Sprint 002-004 tests remain green.
