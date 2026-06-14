# Sprint 005 Blueprint: Parent Trust Loop

## Builder Summary

Sprint 005 should expose the parent-facing trust loop from the data already
created in Sprints 003/004.

Primary implementation shape:

- parent trust service layer in `packages/db`
- parent-facing API routes in `apps/api`
- focused parent access tests
- mobile-first parent UI in `apps/web`
- docs and completion notes

This sprint should not add grades, notes, payments, assignments, or native push.

## Read First

Builder must read:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `CONTEXT.md`
4. `planning/STATE.md`
5. `planning/DECISIONS.md`
6. `planning/DOMAIN.md`
7. `planning/sprints/005-parent-trust-loop/requirements.md`
8. `planning/sprints/005-parent-trust-loop/acceptance.md`
9. `docs/API.md`
10. `docs/DATA_MODEL.md`
11. `docs/PERMISSIONS.md`
12. `docs/UX_VISUAL_STANDARD.md`

## Implementation Slices

### Slice 0: Pre-Edit Plan

Before editing files, Builder must summarize:

- whether a new migration is needed
- parent service functions
- parent API routes
- data access rules
- mobile UI structure
- tests and validation commands
- explicit deferrals

Stop and ask Ian/Architect if the plan changes product scope.

### Slice 1: Shared Validation Contracts

Update `packages/shared/src/validation.ts` if needed.

Likely schemas:

- parent child selector query:
  - optional `studentId`
- attendance history query:
  - optional `studentId`
  - optional `from`
  - optional `to`
  - optional `limit`
- notification read input:
  - optional `notificationIds[]`
- parent message thread query:
  - optional `studentId`
- parent message send:
  - reuse/extend existing `parentMessageSchema`

Do not add `schoolId` to any parent request schema.

### Slice 2: Database Schema / Migration

Prefer no new tables if existing Sprint 003/004 schema is enough:

- `parent_student_links`
- `students`
- `classes`
- `attendance_records`
- `notifications`
- `message_threads`
- `messages`

Potential schema change:

- If marking notifications read cannot be done cleanly with existing `read_at`,
  add the smallest needed change. Current schema already has `notifications.read_at`,
  so a migration should probably not be needed.

If Builder adds a migration, it must explain why in the pre-edit plan and
completion notes.

### Slice 3: Parent Trust Service Layer

Create a module such as `packages/db/src/parentTrust.ts`, and export it from
`packages/db/src/index.ts`.

Recommended functions:

- `listLinkedChildrenForParent(db, userId)`
- `assertParentCanAccessStudent(db, userId, studentId)`
- `getParentHome(db, userId, input)`
- `getParentAttendanceHistory(db, userId, input)`
- `listParentNotifications(db, userId, input?)`
- `markParentNotificationsRead(db, userId, input)`
- `listParentMessageThreads(db, userId, input?)`
- `getParentMessageThread(db, userId, threadId)`

Existing functions may be reused:

- `listChildrenForParent`
- `createParentMessage`
- `listNotificationsForUser`

Implementation rules:

- Parent access is always derived from `parent_student_links` connected to the
  caller's memberships.
- Parent routes should not require `requireMembership` unless the route is
  intentionally selecting a single active tenant. A parent may have children in
  multiple schools later.
- If a query takes `studentId`, verify it is linked to the caller.
- If no `studentId` is supplied, use the first linked child deterministically or
  return a clear empty/no-child state.
- Do not expose unlinked students, classes, attendance, messages, or
  notifications.
- Do not trust client-supplied school identifiers.

### Slice 4: Parent Home Data Shape

`getParentHome` should return a stable, UI-friendly object:

```ts
{
  selectedChild: {
    studentId,
    fullName,
    schoolId,
    schoolName,
    classId,
    className,
    objectiveStatus,
    relationship
  },
  children: [...],
  today: {
    date,
    attendanceStatus: "hadir" | "sakit" | "izin" | "alpa" | "terlambat" | null,
    attendanceRecordedAt,
    attendanceNote
  },
  reassurance: {
    headline,
    needsAction,
    reasons[]
  },
  latestNotification,
  latestMessageThread,
  recentAttendance: [...]
}
```

Use parent-friendly Indonesian copy in the UI, not necessarily in the API.

Reassurance examples:

- child is `hadir`: calm positive summary
- no attendance yet: neutral "belum tercatat"
- child is `alpa`/`terlambat`: clear attention state
- unread notification/message exists: needs action

Do not invent academic status or notes in this sprint.

### Slice 5: Parent Attendance History

Parent can read attendance history for linked child only.

Rules:

- Default to recent rows, for example latest 14 or 30 records.
- Include date, status, note, recorded time.
- If no rows exist, return an empty array and let UI show empty state.
- Parent cannot mutate attendance.

### Slice 6: Notifications

Use `notifications` from Sprint 004.

Capabilities:

- list notifications for caller's memberships
- filter by linked `studentId` if provided
- mark one or more notifications as read

Rules:

- Parent can only mark notifications that belong to their memberships.
- Do not implement push delivery.
- Do not implement preferences/campaigns.

### Slice 7: Parent Messages

Use Sprint 004 `message_threads` and `messages`.

Capabilities:

- list threads for linked children
- view messages in a thread
- send message about linked child

Rules:

- Parent can only see/send for linked children.
- Parent cannot access teacher-only `/guru/*`.
- Message view is minimal: chronological messages, sender role, timestamp, body.
- No attachments, read receipts, typing state, templates, broadcast, or SLA.

### Slice 8: API Routes

Add routes in `apps/api/src/app.ts`.

Suggested routes:

| Route | Auth | Purpose |
|---|---|---|
| `GET /parent/home?studentId=` | session | Beranda Anak aggregate. |
| `GET /parent/children` | session | Linked children with class/school context. |
| `GET /parent/attendance?studentId=&from=&to=&limit=` | session | Attendance history for linked child. |
| `GET /parent/notifications?studentId=` | session | Notifications for caller, optionally child-filtered. |
| `POST /parent/notifications/read` | session | Mark caller-owned notifications read. |
| `GET /parent/messages/threads?studentId=` | session | Parent-visible message threads. |
| `GET /parent/messages/threads/:threadId` | session | Thread detail + messages. |
| `POST /parent/messages` | session + linked parent | Existing route; keep or move carefully. |

It is acceptable to keep existing `GET /me/children`, `GET /me/notifications`,
and `POST /parent/messages` for backward compatibility. New routes should be
clearer for the parent app.

### Slice 9: Mobile-First Parent UI

Add parent UI in `apps/web`.

Recommended component:

- `ParentTrustApp` or `ParentHome`

Minimum views/sections:

- child switcher
- Beranda Anak summary
- today's attendance
- recent attendance history
- notifications
- message threads/detail/send message

UI rules:

- Mobile-first width should look intentional.
- Parent home is reassurance-first, not a raw table dump.
- Use simple summaries and clear states.
- Details can be below summaries.
- Do not make a marketing/landing page.
- Do not add payments/tasks/materials/premium menu entries.

Developer ergonomics:

- The current `apps/web` is still a validation UI. Builder may add a simple role
  switch/tabs for Teacher vs Parent validation, but should not build a complex
  app shell.

### Slice 10: Tests

Add focused API/service tests, for example
`apps/api/src/__tests__/parent-trust.test.ts`.

Required coverage:

- parent lists linked children only
- parent home returns selected child, today's attendance, latest notification,
  latest message, and recent attendance
- parent with no children gets a clear no-child/empty response
- parent cannot access another parent's child by `studentId`
- parent attendance history only returns linked child records
- parent cannot mutate attendance
- parent notifications only include caller-owned notifications
- parent can mark own notifications read
- parent cannot mark another user's notification read
- parent lists message threads only for linked children
- parent can view messages in own thread
- parent cannot view another parent's thread
- parent can send message for linked child
- parent cannot send message for unlinked child
- `orang_tua` still cannot access `/guru/*`
- Sprint 002-004 tests remain green

### Slice 11: Documentation

Update docs after implementation:

- `docs/API.md`
- `docs/DATA_MODEL.md` if schema changes
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/005-parent-trust-loop/completion-notes.md`

Document deferrals clearly:

- no grades/raport yet
- no notes yet
- no payment/premium
- no push delivery
- no full chat polish

## Suggested File Changes

Expected files to change or be added:

- `packages/db/src/parentTrust.ts`
- `packages/db/src/index.ts`
- `packages/shared/src/validation.ts`
- `apps/api/src/app.ts`
- `apps/api/src/__tests__/parent-trust.test.ts`
- `apps/web/src/*`
- `docs/*`
- `planning/STATE.md`
- `planning/sprints/005-parent-trust-loop/completion-notes.md`

Possible but not expected:

- `packages/db/src/schema.ts`
- `packages/db/migrations/*`

## Non-Negotiables

- Do not trust client-supplied `school_id`.
- Do not expose unlinked child data.
- Do not let parent mutate attendance.
- Do not let parent access `/guru/*`.
- Do not implement grades/raport or student notes in Sprint 005.
- Do not add payment, tasks, materials, forum, or premium subscription.
- Do not build native push/browser push delivery.
- Do not start Sprint 006.
