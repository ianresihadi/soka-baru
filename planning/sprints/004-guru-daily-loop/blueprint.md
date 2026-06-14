# Sprint 004 Blueprint: Guru Daily Loop

## Builder Summary

Sprint 004 should add the daily operating layer on top of Sprint 002/003:

- `school_settings`
- `attendance_records`
- message thread/message scaffold
- `notifications`
- teacher daily-loop service functions
- teacher-facing API routes
- tests proving tenant isolation and business rules
- a minimal teacher UI for Papan Pagi and attendance capture

The goal is correctness and workflow clarity, not broad UI polish.

## Read First

Builder must read:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `CONTEXT.md`
4. `planning/STATE.md`
5. `planning/DECISIONS.md`
6. `planning/DOMAIN.md`
7. `planning/sprints/004-guru-daily-loop/requirements.md`
8. `planning/sprints/004-guru-daily-loop/acceptance.md`
9. `docs/API.md`
10. `docs/DATA_MODEL.md`
11. `docs/PERMISSIONS.md`
12. `docs/UX_VISUAL_STANDARD.md`

## Implementation Slices

### Slice 0: Pre-Edit Plan

Before editing files, Builder must summarize:

- proposed tables and important fields
- route list
- service/repository functions
- test plan
- what is intentionally deferred

Stop and ask Ian/Architect if the plan changes product scope.

### Slice 1: Shared Validation Contracts

Update `packages/shared/src/validation.ts`.

Add zod schemas/types for:

- attendance status enum: `hadir`, `sakit`, `izin`, `alpa`, `terlambat`
- attendance date input: ISO date string `YYYY-MM-DD`
- class attendance submission:
  - `date`
  - `records[]` with `studentId`, `status`, optional `note`
  - optional `correctionReason`
- Papan Pagi query:
  - optional `date`
  - optional `classId`
- school settings update:
  - `attendanceCutoffTime` as `HH:mm`
- parent message creation:
  - `studentId`
  - `body`
- teacher reply:
  - `body`

Do not add free-form `schoolId` to request schemas.

### Slice 2: Database Schema and Migration

Update `packages/db/src/schema.ts` and generate a migration.

Recommended tables:

#### `school_settings`

Purpose: per-school configurable rules.

Fields:

- `id`
- `school_id` unique FK to `schools.id`
- `attendance_cutoff_time` text, default `07:30`
- `created_at`
- `updated_at`

Keep room for future settings, but do not add grades/status-threshold logic
unless needed by Sprint 004.

#### `attendance_records`

Purpose: daily attendance fact per student.

Fields:

- `id`
- `school_id`
- `class_id`
- `student_id`
- `attendance_date`
- `status`
- `recorded_by_membership_id`
- `note`
- `created_at`
- `updated_at`

Constraint:

- unique `(school_id, student_id, attendance_date)`

Recommended date storage:

- Use a real Postgres `date` column if Drizzle/PGlite support is clean.
- Otherwise use text with strict `YYYY-MM-DD` validation in shared schemas and
  service code. Prefer the cleaner typed option if practical.

#### Student objective status

Papan Pagi needs `aman` / `perhatian` / `kritis`.

The current `students.status` field may already mean lifecycle status
(`active`). Do not overload lifecycle status if that is how the code is using
it. Add a separate field such as `student_status` or `objective_status` with a
default of `aman` if needed.

Sprint 004 does not need to compute this status from grades yet. It only needs
to store/read the value so Papan Pagi can include `perhatian` and `kritis`
students. Sprint 006 can refine objective status calculation from attendance
and KKM.

#### `message_threads`

Purpose: minimal parent-teacher communication thread used by Papan Pagi.

Fields:

- `id`
- `school_id`
- `student_id`
- `parent_membership_id`
- `class_id`
- `status` (`open` is enough for MVP)
- `last_message_at`
- `last_parent_message_at`
- `last_teacher_reply_at`
- `created_at`
- `updated_at`

Constraint:

- Avoid duplicate active threads where practical, but do not over-engineer
  thread lifecycle.

#### `messages`

Purpose: individual message entries.

Fields:

- `id`
- `school_id`
- `thread_id`
- `student_id`
- `sender_membership_id`
- `sender_role` (`orang_tua`, `guru`, `wali_kelas`, etc. as text)
- `body`
- `created_at`

#### `notifications`

Purpose: in-app notification records.

Fields:

- `id`
- `school_id`
- `recipient_membership_id`
- `student_id`
- `type`
- `title`
- `body`
- `payload` JSON
- `read_at`
- `created_at`

Only create durable rows. Do not attempt push delivery in this sprint.

### Slice 3: Daily Loop Service Layer

Create a new service module such as `packages/db/src/dailyLoop.ts` and export it
from `packages/db/src/index.ts`.

Recommended functions:

- `getOrCreateSchoolSettings(db, tenant)`
- `updateSchoolSettings(db, tenant, input)`
- `listTeacherClasses(db, tenant)`
- `assertCanOperateClass(db, tenant, classId)`
- `submitClassAttendance(db, tenant, classId, input, now?)`
- `getPapanPagi(db, tenant, input, now?)`
- `createParentMessage(db, userId, input)`
- `listUnrepliedParentThreads(db, tenant, classId?)`
- `replyToParentThread(db, tenant, threadId, input)`
- `listNotificationsForUser(db, userId)`

Implementation rules:

- All school-owned reads/writes must scope by `tenant.schoolId`.
- Foreign keys supplied by clients must be verified against the caller's tenant.
- Teacher class access should be based on `teacher_assignments.membership_id`.
- `admin_sekolah`/`soka_internal` may operate school-wide for setup and tests.
- Parent message creation must verify:
  - the parent has a membership in the school
  - `parent_student_links` connects that membership to the student
  - the student belongs to the same school
- Teacher reply must verify the thread belongs to the tenant and the teacher can
  operate the thread's class.

### Slice 4: Attendance Business Rules

Attendance submit behavior:

- Reject students outside the class/school.
- Reject duplicate student rows in one submission.
- Missing students are allowed if the teacher is saving a partial/in-progress
  state.
- Upsert one row per student/date.
- Same-day update:
  - no correction reason required.
- Post-day update:
  - `correctionReason` required if changing an existing row after the date has
    passed.
  - create `audit_events` with action such as
    `attendance_record.corrected`.

Completion status for Papan Pagi:

- `not_started`: no records for the class/date.
- `in_progress`: some but not all students have records.
- `completed_on_time`: all active class students have records and completion
  happened before/at the school's cutoff.
- `completed_late`: all active class students have records but completion was
  after cutoff.

If exact completion timestamp is not stored separately, use a conservative
implementation and document it. A `completed_at` field is acceptable if Builder
decides it simplifies correctness.

### Slice 5: Notification Rules

For attendance submissions:

- Generate in-app notification rows for linked parent memberships when status is
  `sakit`, `izin`, `alpa`, or `terlambat`.
- Do not generate notification rows for `hadir`.
- Avoid duplicate notification spam when the same status is saved repeatedly for
  the same student/date.
- If a status changes from `hadir` to non-present/late, create the relevant
  notification.

Notification copy can be simple and Indonesian-facing, for example:

- `Absensi diperbarui`
- `{studentName} tercatat {statusLabel} hari ini.`

Do not build browser push/native push.

### Slice 6: API Routes

Add routes in `apps/api/src/app.ts`.

Suggested teacher/admin routes:

| Route | Auth | Purpose |
|---|---|---|
| `GET /guru/classes` | `guru`/`wali_kelas`/admin/internal | Classes the caller can operate. |
| `GET /guru/papan-pagi` | teacher/admin | Papan Pagi summary for date/class. |
| `PUT /guru/classes/:classId/attendance/:date` | teacher/admin | Submit/upsert attendance records. |
| `GET /guru/messages/unreplied` | teacher/admin | List unreplied parent threads. |
| `POST /guru/messages/:threadId/reply` | teacher/admin | Reply to parent thread. |
| `GET /guru/settings` | teacher/admin | Read school settings relevant to daily loop. |
| `PATCH /admin/school-settings` | admin/internal | Update attendance cutoff. |

Suggested parent-support routes:

| Route | Auth | Purpose |
|---|---|---|
| `POST /parent/messages` | session + linked parent | Create/send a parent message about a linked student. |
| `GET /me/notifications` | session | List notification records for the user's memberships. |

Route naming can change if Builder finds a better local pattern, but the
capability and permission boundaries must remain.

### Slice 7: Web UI Validation

Update `apps/web` enough to validate the loop.

Minimum UI:

- Papan Pagi sections in the approved order.
- Class selector if more than one class is available.
- Attendance table/list with stable controls for five statuses.
- Save attendance action.
- Visible attendance completion status and cutoff time.
- Unreplied parent message summary.
- Students needing attention summary.

UI rules:

- Build the usable experience, not a landing page.
- Use dense-but-calm teacher layout.
- Do not create decorative cards inside cards.
- Keep mobile fallback usable for attendance.
- Avoid analytics/KPI dominance.

It is acceptable if auth/session is still development-oriented in the UI, as
long as the API and tests enforce permissions.

### Slice 8: Tests

Add a focused test file such as `apps/api/src/__tests__/daily-loop.test.ts`.

Required coverage:

- school settings default and update
- teacher can list/operate assigned class
- teacher cannot operate unassigned class, unless admin/internal
- School A teacher cannot operate School B class/student/message
- attendance supports all five statuses
- attendance upsert does not create duplicates
- same-day edit works without correction reason
- post-day correction without reason is rejected
- post-day correction with reason creates audit event
- non-present/late attendance creates notification records for linked parents
- `hadir` does not create notification records
- Papan Pagi returns correct section order/data:
  - attendance status
  - unreplied message count/oldest
  - attention students
  - schedule placeholder/assignments
- parent can create a message only for linked child
- teacher reply removes the thread from unreplied count
- `orang_tua` cannot access `/guru/*`

Existing tests from Sprint 002/003 must remain green.

### Slice 9: Documentation

Update docs after implementation:

- `docs/API.md`
- `docs/DATA_MODEL.md`
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/004-guru-daily-loop/completion-notes.md`

Document any explicit deferrals, especially:

- no browser/native push
- no full chat
- no full schedule management
- no parent PWA polish

## Suggested File Changes

Expected files to change or be added:

- `packages/db/src/schema.ts`
- `packages/db/src/dailyLoop.ts`
- `packages/db/src/index.ts`
- `packages/db/migrations/*`
- `packages/shared/src/validation.ts`
- `apps/api/src/app.ts`
- `apps/api/src/__tests__/daily-loop.test.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/index.css` if needed
- `docs/*`
- `planning/STATE.md`
- `planning/sprints/004-guru-daily-loop/completion-notes.md`

## Non-Negotiables

- Do not trust client-supplied `school_id`.
- Do not add extra attendance statuses.
- Do not send notifications for `hadir`.
- Do not turn messages into an SLA system.
- Do not use qualitative notes as attention triggers.
- Do not add principal analytics, payments, LMS, or full TU workflows.
- Do not start Sprint 005/006 work.
