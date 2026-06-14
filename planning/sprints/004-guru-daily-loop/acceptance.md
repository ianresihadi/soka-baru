# Sprint 004 Acceptance Criteria

Sprint 004 is complete when all criteria below are met.

## Data Model

- `school_settings` exists and stores per-school `attendance_cutoff_time`.
- `attendance_records` exists and is tenant-scoped by `school_id`.
- `attendance_records` enforces one row per student per date.
- Student objective status for Papan Pagi supports `aman`, `perhatian`, and
  `kritis` without overloading a lifecycle-only `active` status.
- Minimal message thread/message tables exist for parent-to-teacher messages.
- `notifications` exists for in-app notification records.
- All new school-owned tables include `school_id`.
- Migration files are generated and used by the test setup.

## Attendance

- A teacher/admin can submit attendance for a class/date.
- Supported statuses are exactly:
  - `hadir`
  - `sakit`
  - `izin`
  - `alpa`
  - `terlambat`
- Saving attendance twice for the same student/date updates the existing record
  and does not create duplicates.
- Same-day edits work without correction reason.
- Post-day corrections are rejected without a correction reason.
- Post-day corrections with a correction reason succeed and create an audit
  event.
- Students from another school/class cannot be included in a class attendance
  submission.

## Notifications

- Attendance statuses `sakit`, `izin`, `alpa`, and `terlambat` create in-app
  notification records for linked parents.
- `hadir` does not create attendance notification records.
- Re-saving the same non-present/late status does not spam duplicate
  notifications for the same student/date/status.
- Notification access is limited to the user's own memberships.

## Papan Pagi

- A teacher/admin can fetch Papan Pagi for a class/date.
- Papan Pagi returns sections in this product order:
  1. Status Absensi Hari Ini
  2. Pesan Ortu Belum Dibalas
  3. Siswa Perlu Perhatian
  4. Jadwal Mengajar Hari Ini
- Attendance summary includes:
  - total students
  - recorded count
  - missing count
  - per-status counts
  - completion status
  - attendance cutoff time
- Completion status can represent:
  - `not_started`
  - `in_progress`
  - `completed_on_time`
  - `completed_late`
- Siswa Perlu Perhatian includes:
  - students with `alpa` today
  - students with `terlambat` today
  - students whose objective status is `perhatian` or `kritis`
- Qualitative notes do not trigger Siswa Perlu Perhatian.

## Parent Message Scaffold

- A linked parent can create/send a message about their linked child.
- A parent cannot send a message for an unlinked child or another school's child.
- A teacher/admin can list unreplied parent message threads for an assigned
  class.
- A teacher/admin can reply to a thread.
- After teacher reply, the thread no longer counts as unreplied.
- No SLA timer, attachment flow, broadcast tool, campaign tool, or full chat
  polish is introduced.

## Permissions and Tenant Isolation

- `guru`/`wali_kelas` can operate only assigned classes.
- `admin_sekolah`/`soka_internal` remain tenant-scoped and may support setup.
- `orang_tua` cannot access `/guru/*` routes.
- School A users cannot read or mutate School B attendance, messages,
  notifications, or settings.
- API handlers do not accept `school_id` as an authority source.

## Teacher UI

- `apps/web` includes a minimal usable Papan Pagi / attendance validation UI.
- The UI follows the approved section order.
- The attendance workflow is usable on desktop/tablet and does not break on
  mobile.
- The UI is task-first and does not become a marketing page or KPI-heavy
  analytics dashboard.

## Documentation

- `docs/API.md` documents Sprint 004 routes.
- `docs/DATA_MODEL.md` documents Sprint 004 tables.
- `docs/PERMISSIONS.md` documents teacher, admin, parent, and notification
  access rules.
- `docs/VALIDATION.md` documents new test coverage and commands.
- `planning/STATE.md` is updated with Sprint 004 build status.
- `planning/sprints/004-guru-daily-loop/completion-notes.md` records what was
  built, what was deferred, validation results, and any Architect-review notes.

## Validation Commands

Before opening the PR, Builder must run:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
```

If a command cannot run, Builder must document the exact failure and reason in
the completion notes.
