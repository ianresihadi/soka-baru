# Sprint 004 Completion Notes (Builder)

## Tables / migrations

Migration `packages/db/migrations/0002_*.sql` adds (all school-owned):

- `school_settings` — `attendance_cutoff_time` (default `07:30`),
  `school_timezone` (default `Asia/Jakarta`).
- `attendance_records` — unique `(school_id, student_id, attendance_date)`,
  statuses `hadir`/`sakit`/`izin`/`alpa`/`terlambat`.
- `message_threads`, `messages` — minimal parent↔teacher messaging.
- `notifications` — in-app records (no push).

Change to `students`: added `objective_status` (`aman`/`perhatian`/`kritis`,
default `aman`), separate from the lifecycle `status` field.

## Service layer

`packages/db/src/dailyLoop.ts`: `getOrCreateSchoolSettings`,
`updateSchoolSettings`, `listTeacherClasses`, `assertCanOperateClass`,
`submitClassAttendance`, `getPapanPagi`, `createParentMessage`,
`listUnrepliedParentThreads`, `replyToParentThread`, `listNotificationsForUser`,
plus timezone helpers (`localDateString`, `cutoffInstant`).

## API routes

`GET /guru/classes`, `GET /guru/settings`, `GET /guru/papan-pagi`,
`PUT /guru/classes/:classId/attendance/:date`, `GET /guru/messages/unreplied`,
`POST /guru/messages/:threadId/reply`, `PATCH /admin/school-settings`,
`POST /parent/messages`, `GET /me/notifications`. See `docs/API.md`.

## Key rules implemented

- Papan Pagi fixed order: Status Absensi → Pesan Ortu Belum Dibalas → Siswa
  Perlu Perhatian → Jadwal Mengajar.
- Teacher class access via `teacher_assignments`; admins school-wide;
  `orang_tua` blocked from `/guru/*`. Tenant isolation throughout; no client
  `school_id` trusted.
- Attendance upsert (one row per student/date); same-day edits free; post-day
  changes require `correctionReason` and write `attendance_record.corrected`
  audit events.
- Notifications only for `sakit`/`izin`/`alpa`/`terlambat`, deduped per
  student/date/status; never for `hadir`; no push delivery.
- Siswa Perlu Perhatian = `alpa` today, `terlambat` today, or objective status
  `perhatian`/`kritis`. Qualitative notes never trigger it.

## Timezone (Architect correction)

The attendance cutoff is treated as **school-local wall-clock time**, not raw
server/UTC. `school_settings.school_timezone` (default `Asia/Jakarta`) drives a
timezone-aware cutoff helper (`cutoffInstant`) built on `Intl`. The comparison
instant (`now`) is injectable, and tests prove `completed_on_time` (07:00 WIB)
vs `completed_late` (08:00 WIB) deterministically. No UTC is hardcoded as a
business rule. A full timezone-management UI is intentionally deferred.

## Validation

- `pnpm test` → 61 tests pass (17 `tenant` + 25 `onboarding` + 19 `daily-loop`),
  in-process PGlite + real migrations.
- `pnpm typecheck` → clean.
- `pnpm --filter @soka/web build` → builds.

## Deferred (per scope)

- Full parent PWA polish, full chat, broadcast announcements, message SLA,
  grades/raport, student notes, principal analytics/KPI, browser/native push,
  payments, LMS, full schedule management.
- Completion uses `max(created_at)` of the day's records vs the cutoff (no
  separate `completed_at` column) — documented as conservative.
- Teacher account/membership creation remains an internal/seed binding concern;
  Sprint 004 only assigns existing teacher memberships to classes.

## Remaining for later sprints

- Sprint 005 Parent Trust Loop (parent-facing app polish).
- Sprint 006 can compute `objective_status` from attendance/KKM.
