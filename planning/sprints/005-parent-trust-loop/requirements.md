# Sprint 005 Requirements: Parent Trust Loop

## Goal

Build the first mobile-first parent experience: a reassurance-first Beranda Anak
that lets an `orang_tua` see linked children, today's attendance, recent
attendance history, notifications, and teacher messages.

Sprint 005 turns the data produced by Sprint 003/004 into visible parent trust.

## Product Context

The approved parent MVP areas are:

1. Beranda Anak.
2. Absensi.
3. Nilai/Raport.
4. Pesan Guru.
5. Notifikasi.

Sprint 005 implements the parent trust loop around existing Sprint 003/004 data:

- linked children
- attendance
- in-app notifications
- parent-teacher messages

Nilai/Raport and Catatan Siswa are deferred to Sprint 006. Sprint 005 may show
empty/coming-later placeholders only where needed to preserve navigation shape,
but must not implement grades or notes.

## Users

Primary user:

- `orang_tua`

Supporting users/data:

- `guru` / `wali_kelas` only as existing message responders and attendance data
  producers.
- `admin_sekolah` / `soka_internal` only for setup/test data.

## In Scope

### 1. Parent Child Access

- Parent can list linked children.
- Parent can switch between linked children.
- Parent can only access children linked through `parent_student_links`.
- Parent cannot access another child by guessing `studentId`.
- If a parent has no linked children, show a calm empty state that points back
  to school-issued link code flow.

### 2. Beranda Anak

For the selected child, parent home should answer:

- Is my child present / what is today's attendance status?
- Is there an important notification?
- Is there an unread or waiting teacher message?
- Is there anything I need to do?

Minimum data:

- child identity: name, class, school
- today's attendance status if recorded
- latest notification
- latest message thread status
- objective child status (`aman`, `perhatian`, `kritis`) if available
- recent attendance summary for the last school days available

This should be reassurance-first, not a dense admin dashboard.

### 3. Attendance Visibility

- Parent can view today's attendance for a linked child.
- Parent can view recent attendance history for a linked child.
- Parent sees the five MVP attendance statuses in parent-friendly labels:
  - Hadir
  - Sakit
  - Izin
  - Alpa
  - Terlambat
- Parent must not be able to edit attendance.
- If attendance has not been recorded yet, show a neutral "belum tercatat"
  state rather than implying absence.

### 4. Notifications

- Parent can list their notification records.
- Parent can see notifications related to a selected child.
- Parent can mark notification(s) as read.
- Sprint 005 remains in-app only; no browser/native push delivery.

### 5. Parent Messages

Build a minimal parent-facing message view on top of Sprint 004's message
scaffold.

Required capability:

- Parent can list message threads for linked children.
- Parent can view messages in a thread.
- Parent can send a message about a linked child.
- Parent cannot view or send messages for unlinked children.

This is still not a full chat product. No attachments, typing indicators,
read receipts, SLA timer, broadcast announcements, or templates.

### 6. Parent Mobile-First UI

Add a mobile-first parent experience in `apps/web`.

Minimum UI:

- Parent shell / view switch suitable for mobile width.
- Child switcher.
- Beranda Anak summary.
- Attendance history section.
- Notification center section.
- Message thread/message section.

The UI should follow `docs/UX_VISUAL_STANDARD.md`:

- reassurance-first
- simple-card summaries
- calm and clear
- details behind summaries

It should not become a landing page, marketing page, or teacher/admin dashboard.

### 7. API / Service Layer

Create parent-facing service/API functions that aggregate existing data safely.

Expected capabilities:

- parent child summary/home
- parent attendance history
- parent notification list/read state
- parent message thread list/detail/send

Use existing tables where possible. Add new columns only if required for
correctness, for example notification read state already exists as `read_at`.

## Out of Scope

- Native app packaging.
- Browser/native push delivery.
- Payment / SPP.
- Parent premium subscription.
- Tugas Digital.
- Materi / repository.
- Forum / social feed.
- Feedback/survey.
- Full chat polish.
- Message SLA.
- Grades/Raport implementation.
- Student notes implementation.
- Principal or school leadership dashboard.
- Full navigation system for every future parent module.

## Required Documentation Updates By Builder

Builder must update these after implementation:

- `docs/API.md`
- `docs/DATA_MODEL.md` if schema changes
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/005-parent-trust-loop/completion-notes.md`

Builder must update `planning/DECISIONS.md` only if a durable product or
architecture decision changes.
