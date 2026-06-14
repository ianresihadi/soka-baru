# Sprint 005 Completion Notes (Builder)

## Migration

None. Sprint 005 reuses the Sprint 003/004 schema only
(`parent_student_links`, `students`, `classes`, `attendance_records`,
`notifications` incl. `read_at`, `message_threads`, `messages`).

## Service layer

`packages/db/src/parentTrust.ts`: `listLinkedChildrenForParent`,
`assertParentCanAccessStudent`, `getParentHome`, `getParentAttendanceHistory`,
`listParentNotifications`, `markParentNotificationsRead`,
`listParentMessageThreads`, `getParentMessageThread`. Reuses
`createParentMessage` and `listNotificationsForUser`.

## API routes

`GET /parent/children`, `GET /parent/home`, `GET /parent/attendance`,
`GET /parent/notifications`, `POST /parent/notifications/read`,
`GET /parent/messages/threads`, `GET /parent/messages/threads/:threadId`,
plus the existing `POST /parent/messages`. See `docs/API.md`.

## How the Architect guardrails were met

1. Parent routes use `requireAuth` only; **all** access is proven through
   `parent_student_links` + the caller's memberships (never a single active
   tenant, never a client `school_id`).
2. Default child selection is deterministic: `parent_student_links.created_at`
   ascending, then `students.full_name` ascending. No reliance on implicit DB
   order.
3. `markParentNotificationsRead` returns the true updated count (via
   `.returning()`), scoped to the caller's memberships; a test proves a foreign
   notification id is not modified.
4. List limits are bounded: attendance default 30 / max 100; notifications and
   threads default 50 / max 100 (`PARENT_LIMITS` + `clampLimit` in shared).
5. `reassurance.needsAction` is a simple boolean derived from today's attendance
   and unread notifications — no scoring/risk engine, no grades, no notes.

## UI

`apps/web` gains a Teacher | Parent tab and `ParentHome.tsx`: mobile-first,
reassurance-first cards — child switcher, Beranda Anak summary, notification
center with mark-read, attendance history, and message thread/detail/send. No
promoted menu entries for payment/premium/tasks/materials/grades/notes.

## Architect review fixes (PR #4)

- `getParentHome.needsAction` now detects ANY unread notification for the
  selected child (separate `read_at is null` existence query scoped to the
  parent membership + student), so a newer read notification can no longer hide
  an older unread one. `latestNotification` still returns the latest. Test added
  proving latest-read + older-unread still yields `needsAction: true` with
  `unread_notification`.

## Validation

- `pnpm test` → 79 tests pass (17 `tenant` + 25 `onboarding` + 20 `daily-loop`
  + 17 `parent-trust`), in-process PGlite + real migrations.
- `pnpm typecheck` → clean.
- `pnpm --filter @soka/web build` → builds.

## Deferred (per scope)

- Grades/raport, student notes (Sprint 006).
- Payment/SPP, parent premium, tasks/materials/forum/feedback.
- Native packaging, browser/native push delivery, full chat polish, message SLA.
- Principal/leadership dashboards.

## Notes

- The full Better Auth HTTP sign-in/session flow is still not exercised against a
  live Postgres here (no `DATABASE_URL`); business logic is covered by in-process
  tests, and the live path is documented for verification.
