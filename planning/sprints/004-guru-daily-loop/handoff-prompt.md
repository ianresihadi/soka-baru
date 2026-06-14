# Sprint 004 Builder Handoff Prompt

You are the Builder for SOKA Baru Sprint 004: Guru Daily Loop.

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
10. `planning/sprints/004-guru-daily-loop/requirements.md`
11. `planning/sprints/004-guru-daily-loop/blueprint.md`
12. `planning/sprints/004-guru-daily-loop/acceptance.md`
13. `docs/API.md`
14. `docs/DATA_MODEL.md`
15. `docs/PERMISSIONS.md`
16. `docs/VALIDATION.md`
17. `docs/UX_VISUAL_STANDARD.md`

## Pre-Edit Response Required

Before editing files, respond with an implementation plan covering:

1. Tables/migrations you will add.
2. Shared validation schemas you will add.
3. Service/repository functions you will add.
4. API routes you will add.
5. How teacher class access will be enforced.
6. How attendance correction and audit will work.
7. How notification records will be created without push delivery.
8. How the minimal parent-message scaffold will work.
9. What `apps/web` will show for Papan Pagi and attendance validation.
10. Exact tests and commands you will run.

Wait for approval before implementation if Ian asks for Architect review.

## Build Scope

Implement Sprint 004 only.

Allowed:

- `school_settings`
- `attendance_records`
- minimal `message_threads` / `messages`
- `notifications`
- Papan Pagi API
- attendance submit/upsert API
- parent-message scaffold API
- notification list API
- minimal teacher validation UI in `apps/web`
- tests and docs

Not allowed:

- full parent PWA polish
- full chat app
- broadcast announcements
- formal message SLA
- principal analytics
- teacher KPI
- grades/raport
- student notes
- browser/native push delivery
- payments
- LMS/student assignment/material workflows
- full schedule management
- Sprint 005 or Sprint 006 work

## Product Rules

- Papan Pagi order is fixed:
  1. Status Absensi Hari Ini
  2. Pesan Ortu Belum Dibalas
  3. Siswa Perlu Perhatian
  4. Jadwal Mengajar Hari Ini
- Attendance statuses are exactly:
  - `hadir`
  - `sakit`
  - `izin`
  - `alpa`
  - `terlambat`
- Send/create notification records only for:
  - `sakit`
  - `izin`
  - `alpa`
  - `terlambat`
- Do not create notification records for `hadir`.
- Same-day attendance edits do not require correction reason.
- Post-day attendance corrections require a reason and audit event.
- No qualitative behavior scoring.
- Qualitative notes must not trigger Siswa Perlu Perhatian.
- Do not overload a lifecycle-only student status field. If `students.status`
  means `active`, use/add a separate objective status field for
  `aman`/`perhatian`/`kritis`.
- Siswa Perlu Perhatian is only:
  - `alpa` today
  - `terlambat` today
  - objective student status `perhatian` or `kritis`
- Parent messages have no formal SLA in MVP.

## Security and Tenancy Rules

- Never trust `school_id` from client input.
- Every new school-owned table must include `school_id`.
- Every school-owned query must scope by server-resolved tenant context.
- `guru`/`wali_kelas` can operate only assigned classes.
- `admin_sekolah`/`soka_internal` may support setup/validation but remain
  tenant-scoped.
- `orang_tua` cannot access teacher routes.
- Parent message creation must verify the parent-student link.
- Tests must prove cross-school isolation.

## Required Validation

Run:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
```

If any command fails, stop and report the exact failure. Do not claim Sprint 004
is complete until tests and docs match `acceptance.md`.

## Required Documentation

Update:

- `docs/API.md`
- `docs/DATA_MODEL.md`
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/004-guru-daily-loop/completion-notes.md`

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

Do not start Sprint 005.
