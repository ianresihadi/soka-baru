# Sprint 006 Acceptance Criteria

Sprint 006 is complete when all criteria below are met.

## Grade Records

- Guru/Wali Kelas can create a basic grade record for a student in an allowed
  class.
- Grade records include subject/area, assessment name, date, score, max score,
  KKM, publication status, and school/class/student ownership.
- New grades default to draft/internal visibility.
- Grade records can be compared against KKM with a clear below-KKM boolean or
  equivalent summary.
- If a school default KKM exists, omitted grade KKM uses the school default and
  stores the KKM on the grade record.

## Grade Permissions And Visibility

- Guru/Wali Kelas cannot create, update, list, or publish grades for unassigned
  classes unless they have an approved admin/platform role.
- Grade writes reject students outside the class or school.
- Parent can view published grades for linked children only.
- Parent cannot view draft grades.
- Parent cannot view another student's grades by guessing `studentId`.
- Parent cannot create, update, or publish grades.

## Grade Publication, Notifications, And Audit

- Teacher/admin can publish a grade.
- Publishing a grade makes it visible to linked parents.
- Publishing a grade creates in-app notification records for linked parents.
- Publishing the same grade twice is idempotent and does not create duplicate
  notifications.
- Updating a grade after it has been published creates a lightweight
  `audit_events` record with useful before/after metadata.
- Draft grade edits before publication do not need audit.

## Catatan Siswa

- Guru/Wali Kelas can create qualitative student notes for students in allowed
  classes.
- Notes include student, school/class context, author membership, category/body,
  visibility status, and timestamps.
- New notes default to internal-only visibility.
- Notes can be published/shared to parents.
- Notes can be unpublished/returned to internal-only visibility.

## Catatan Siswa Permissions And Visibility

- Guru/Wali Kelas cannot create, update, publish, unpublish, or list notes for
  unassigned classes unless they have an approved admin/platform role.
- Note writes reject students outside the class or school.
- Parent can view published notes for linked children only.
- Parent cannot view internal-only notes.
- Parent cannot view another student's notes by guessing `studentId`.
- Parent cannot create, update, publish, or unpublish notes.

## Catatan Siswa Audit And Notifications

- Publishing a note creates in-app notification records for linked parents.
- Publishing the same note twice is idempotent and does not create duplicate
  notifications.
- Publishing and unpublishing a note create lightweight `audit_events` records.
- Updating a published note records audit if parent-visible content changes.

## Student Status Guardrail

- Catatan Siswa never mutates `students.objective_status`.
- Sprint 006 does not introduce behavior score, points, ranking, leaderboard, or
  hidden risk score.
- Any academic summary is based on grade facts against KKM, not subjective note
  content.

## Parent Experience

- Parent-facing grade and note endpoints derive access from
  `parent_student_links` and caller memberships.
- Parent routes do not accept or trust `school_id`.
- Parent UI shows published grades and published notes for the selected linked
  child.
- Parent UI remains reassurance-first and does not become a dense admin or full
  raport screen.

## Teacher UI

- `apps/web` includes a usable validation surface for teacher grade entry/list
  and publish flow.
- `apps/web` includes a usable validation surface for teacher note entry/list
  and publish/unpublish flow.
- UI labels make draft/published and internal/shared states clear.
- UI remains operational and scoped; no marketing/landing page or unrelated app
  shell expansion.

## Permissions And Tenant Isolation

- School A teacher/admin cannot access School B grades or notes.
- Parent A cannot access Parent B child's grades or notes.
- Existing Sprint 002-005 permissions remain intact.
- Existing attendance, parent trust, and message tests remain green.

## Documentation

- `docs/API.md` documents Sprint 006 routes.
- `docs/DATA_MODEL.md` documents new tables/settings and audit behavior.
- `docs/PERMISSIONS.md` documents grade/note access rules.
- `docs/VALIDATION.md` documents test coverage and validation commands.
- `planning/STATE.md` is updated with Sprint 006 build status.
- `planning/sprints/006-nilai-catatan/completion-notes.md` records what was
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

Sprint 006 should not be accepted until Sprint 002-005 tests remain green.
