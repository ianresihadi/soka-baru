# Sprint 004 Requirements: Guru Daily Loop

## Goal

Build the first real daily teacher workflow: Papan Pagi Wali Kelas, morning
attendance capture, lightweight parent-message visibility, and objective
"Siswa Perlu Perhatian" signals.

This sprint should make SOKA Baru useful to a wali kelas/guru at the start of a
school day without adding heavy administration.

## Product Context

Sprint 004 is the adoption wedge sprint.

The approved daily loop is:

1. Absensi Pagi.
2. Pesan Ortu that still need teacher response.
3. Siswa Perlu Perhatian.
4. Jadwal Mengajar Hari Ini.

The teacher should be able to open SOKA, see what matters this morning, complete
attendance quickly, and avoid missing parent communication.

## Users

Primary user:

- `wali_kelas` / `guru`

Supporting users/data:

- `admin_sekolah` / `soka_internal` only for setup and verification.
- `orang_tua` only as the source/recipient of message and notification records;
  the polished parent app remains Sprint 005.

## In Scope

### 1. School Settings Needed For Attendance

- Add `school_settings` if it does not exist yet.
- Store at least:
  - `school_id`
  - `attendance_cutoff_time` with a SOKA default such as `07:30`
  - timestamps
- The cutoff is per-school. Do not hardcode it in attendance logic.

### 2. Attendance Records

- Add `attendance_records`.
- Attendance is school-owned and tenant-scoped.
- Minimum fields:
  - `school_id`
  - `class_id`
  - `student_id`
  - `attendance_date`
  - `status`
  - `recorded_by_membership_id`
  - optional `note`
  - timestamps
- MVP statuses are exactly:
  - `hadir`
  - `sakit`
  - `izin`
  - `alpa`
  - `terlambat`
- One attendance record per student per date.
- Attendance submission for a class should be idempotent/upsert-like: re-saving
  the same day's class attendance updates the rows rather than creating
  duplicates.

### 2a. Student Objective Status For Papan Pagi

- Papan Pagi needs to identify students whose objective status is `perhatian`
  or `kritis`.
- If the current `students.status` field is being used as a lifecycle flag such
  as `active`, do not overload it.
- Add or expose a separate objective status field such as `student_status` /
  `objective_status` with values:
  - `aman`
  - `perhatian`
  - `kritis`
- Sprint 004 may seed/default this to `aman`; full academic/attendance-derived
  computation can be refined in Sprint 006.

### 3. Attendance Corrections

- Same-day edits are allowed directly.
- Post-day changes require a short correction reason.
- Post-day corrections must create lightweight audit events.
- Do not build an approval workflow.

### 4. Attendance Notifications

- Create in-app notification records for linked parents when a student is:
  - `sakit`
  - `izin`
  - `alpa`
  - `terlambat`
- `hadir` should be visible as data but should not create a required daily push
  notification record.
- Browser push/native push delivery is out of scope. Sprint 004 creates durable
  notification rows only.

### 5. Papan Pagi API

Expose a teacher-facing Papan Pagi summary for a class/date:

1. Status Absensi Hari Ini
   - total students
   - recorded count
   - missing count
   - per-status counts
   - completion status: `not_started`, `in_progress`, `completed_on_time`, or
     `completed_late`
   - cutoff time used
2. Pesan Ortu Belum Dibalas
   - count of unreplied parent message threads
   - oldest waiting message timestamp if any
   - a small list of recent waiting threads
3. Siswa Perlu Perhatian
   - students marked `alpa` today
   - students marked `terlambat` today
   - students with objective status `perhatian` or `kritis`
4. Jadwal Mengajar Hari Ini
   - minimal placeholder derived from teacher class assignments is acceptable
     if a real schedule table is deferred.

### 6. Parent Message Scaffold

Create the minimum message model/API needed for Papan Pagi to surface unreplied
parent messages.

Required capability:

- A parent linked to a student can create a message thread or message to the
  student's school/class teacher context.
- A teacher can list unreplied parent threads for their assigned class.
- A teacher can reply, after which the thread is no longer counted as unreplied.

This is not a full chat product. No attachments, broadcast, SLA timer, typing
status, read receipts, templates, or campaign tools.

### 7. Teacher Access Scope

- `guru` and `wali_kelas` can operate only on classes assigned to their
  membership.
- `admin_sekolah` and `soka_internal` may be allowed for setup/validation, but
  all data remains tenant-scoped.
- `orang_tua` must not access teacher daily loop routes.
- No API should trust `school_id` from the client.

### 8. Minimal Teacher UI

Add enough UI in `apps/web` to validate the daily loop:

- Papan Pagi page/section.
- Attendance capture for one class/date.
- Status controls for the five attendance statuses.
- Basic unreplied-message and attention-student panels.

This UI should follow `docs/UX_VISUAL_STANDARD.md`: dense-but-calm,
task-first, operational, and not a marketing landing page.

## Out of Scope

- Full parent PWA polish.
- Full chat/messaging product.
- Broadcast announcements.
- Principal analytics or teacher KPI.
- Grades and raport.
- Student notes.
- Browser/native push delivery.
- Payment or finance.
- LMS, assignments, materials, forums, or student-facing workflows.
- Full schedule management. A minimal schedule placeholder is allowed only to
  satisfy the Papan Pagi order without expanding scope.

## Required Documentation Updates By Builder

Builder must update these after implementation:

- `docs/API.md`
- `docs/DATA_MODEL.md`
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/004-guru-daily-loop/completion-notes.md`

Builder must update `planning/DECISIONS.md` only if a durable product or
architecture decision changes.
