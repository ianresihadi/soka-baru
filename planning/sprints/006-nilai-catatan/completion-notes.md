# Sprint 006 Completion Notes (Builder)

## Migration / schema

Migration `packages/db/migrations/0003_*.sql`:

- New `grades` (draft default; per-record `kkm`, `score`, `max_score`).
- New `student_notes` (internal default; `category`, `body`, visibility).
- Extended `school_settings` with `default_kkm` (int, default 75).

No raport/averages/ranking/behavior-scoring/case-management tables.

## Service layer

`packages/db/src/academicRecords.ts`: `createGrade`, `updateGrade`,
`publishGrade`, `listGradesForTeacher`, `listPublishedGradesForParent`,
`getParentGradeSummary`, `createStudentNote`, `updateStudentNote`,
`publishStudentNote`, `unpublishStudentNote`, `listStudentNotesForTeacher`,
`listPublishedStudentNotesForParent`.

## KKM (Architect correction applied)

KKM is a 0–100 threshold; comparison is percentage-based:
`isBelowKkm = (score / maxScore) * 100 < kkm`. This is correct when `maxScore`
differs from 100 (e.g., 16/20 vs KKM 75 → not below; 14/20 → below). KKM is
stored per grade; `school_settings.default_kkm` supplies it only when omitted.

## Workflow rules

- Grades default `draft`; notes default `internal`. Parent endpoints/home/UI
  return published-only — no draft-grade or internal-note leak.
- Publish notifies linked parents once (idempotent per recipient + entity id),
  in-app only (no push).
- Audit (`audit_events`): `grade.updated` (update after publish, with
  before/after), `student_note.published`, `student_note.unpublished`,
  `student_note.updated` (published-content change).
- Post-publish grade updates are audited but do NOT emit a new notification.
- Unpublish keeps historical notifications.
- Notes never mutate `students.objective_status`; no behavior score/points/
  ranking/leaderboard/hidden risk.

## Access

- Teacher/admin: session + membership + teacher/admin role + class access
  (`assertCanOperateClass`); writes verify student in class/school (403/404/422).
- Parent: session-only; access via `parent_student_links` + caller memberships;
  no client `school_id`. Cross-child/cross-school rejected; parents cannot
  create/update/publish.

## UI

- Teacher: `TeacherGradesNotes` panel in Papan Pagi — grade entry/list/publish,
  note entry/list/publish/unpublish, clear Draft/Published/Internal/Shared labels.
- Parent: published grades (with below-KKM indicator) and published notes cards
  in `ParentHome`, reassurance-first.

## Validation

- `pnpm test` → 96 tests pass (17 `tenant` + 25 `onboarding` + 20 `daily-loop`
  + 17 `parent-trust` + 17 `academic-records`), in-process PGlite + real
  migrations.
- `pnpm typecheck` → clean.
- `pnpm --filter @soka/web build` → builds.

## Deferred (per scope)

Full raport/finalization/print/export/approval/locking; formulas/averages/
ranking/GPA/transcripts/peer comparison; curriculum/competency/rubrics; behavior
scoring; BK/case-management/intervention/SLA; assignments/materials/student
login; payments/premium/forum/survey/broadcast; browser/native push; principal
analytics; Sprint 007 / Phase 2.

## Notes

- The full Better Auth HTTP sign-in/session flow is still not exercised against a
  live Postgres here (no `DATABASE_URL`); business logic is covered by in-process
  tests, and the live path is documented for verification.
