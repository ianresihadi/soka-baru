# Sprint 006 Blueprint: Nilai & Catatan

## Builder Summary

Sprint 006 adds the first academic-and-notes layer on top of the existing
teacher/parent trust loop.

Primary implementation shape:

- add `grades` and `student_notes` tables
- optionally extend `school_settings` with a default KKM setting
- add shared validation contracts for grade and note workflows
- add a `packages/db` service module for teacher and parent access
- add teacher/admin/parent API routes
- extend parent home with latest published grade/note if practical
- add minimal validation UI for teacher and parent views
- add focused tests for permissions, visibility, audit, and no scope creep

The sprint must not implement full raport, grade formulas, behavior scoring,
case management, assignments, materials, or student-facing workflows.

## Read First

Builder must read:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `CONTEXT.md`
4. `planning/STATE.md`
5. `planning/DECISIONS.md`
6. `planning/DOMAIN.md`
7. `planning/RISKS.md`
8. `planning/QUESTIONS.md`
9. `planning/ARCHITECT-BUILDER-RUNBOOK.md`
10. `planning/sprints/006-nilai-catatan/requirements.md`
11. `planning/sprints/006-nilai-catatan/acceptance.md`
12. `docs/API.md`
13. `docs/DATA_MODEL.md`
14. `docs/PERMISSIONS.md`
15. `docs/UX_VISUAL_STANDARD.md`
16. `docs/VALIDATION.md`

## Implementation Slices

### Slice 0: Pre-Edit Plan

Before editing files, Builder must summarize:

- proposed schema/migration
- grade workflow
- note workflow
- parent visibility rules
- audit approach
- notification approach
- API route plan
- UI plan
- tests and validation commands
- explicit deferrals

Stop and ask Ian/Architect if the plan adds full raport, scoring formulas,
behavior scoring, intervention workflows, payment/premium, or student-facing
learning workflows.

### Slice 1: Shared Validation Contracts

Update `packages/shared/src/validation.ts`.

Recommended constants/types:

- `GRADE_VISIBILITY_STATUSES = ["draft", "published"]`
- `STUDENT_NOTE_VISIBILITY_STATUSES = ["internal", "published"]`
- `STUDENT_NOTE_CATEGORIES = ["general", "academic", "attendance", "wellbeing"]`

Recommended schemas:

- `createGradeSchema`
  - `studentId: uuid`
  - `subject: string`
  - `assessmentName: string`
  - `assessmentDate: YYYY-MM-DD`
  - `score: integer 0..100`
  - `maxScore: integer 1..100`, optional default 100
  - `kkm: integer 0..100`, optional
- `updateGradeSchema`
  - same editable grade fields optional
  - no `schoolId`
  - no parent visibility override except through explicit publish route
- `gradeListQuerySchema`
  - optional `classId`, `studentId`, `subject`, `visibility`, `limit`
- `parentGradesQuerySchema`
  - optional `studentId`, `limit`
- `createStudentNoteSchema`
  - `studentId: uuid`
  - `category`
  - `body: string`
- `updateStudentNoteSchema`
  - editable category/body optional
  - no direct parent visibility except through explicit publish/unpublish route
- `studentNotesQuerySchema`
  - optional `studentId`, `visibility`, `limit`
- `parentStudentNotesQuerySchema`
  - optional `studentId`, `limit`

Validation must not accept `schoolId` from clients for these workflows.

### Slice 2: Database Schema / Migration

Add a new Drizzle migration.

Recommended `grades` table:

```text
grades
- id uuid primary key
- school_id uuid not null references schools(id)
- class_id uuid references classes(id) on delete set null
- student_id uuid not null references students(id) on delete cascade
- subject text not null
- assessment_name text not null
- assessment_date date not null
- score integer not null
- max_score integer not null default 100
- kkm integer not null
- visibility_status text not null default 'draft'
- published_at timestamp null
- recorded_by_membership_id uuid not null references school_memberships(id)
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

Recommended indexes:

- `(school_id, class_id, assessment_date)`
- `(school_id, student_id, assessment_date)`
- `(school_id, student_id, visibility_status)`

Recommended `student_notes` table:

```text
student_notes
- id uuid primary key
- school_id uuid not null references schools(id)
- class_id uuid references classes(id) on delete set null
- student_id uuid not null references students(id) on delete cascade
- author_membership_id uuid not null references school_memberships(id)
- category text not null
- body text not null
- visibility_status text not null default 'internal'
- published_at timestamp null
- created_at timestamp not null default now()
- updated_at timestamp not null default now()
```

Recommended indexes:

- `(school_id, student_id, created_at)`
- `(school_id, student_id, visibility_status)`
- `(school_id, class_id, created_at)`

Recommended `school_settings` extension:

- `default_kkm integer not null default 75`

Use this only as a default. Store the actual KKM used on each grade record.

Do not add grade averages, ranking tables, report-card tables, note scoring, or
case-management tables.

### Slice 3: Teacher Access Rules

Reuse the existing class-access pattern from Sprint 004:

- `guru` / `wali_kelas` can operate only assigned classes.
- `admin_sekolah` / `soka_internal` can operate school-scoped setup/admin
  workflows.
- Every write must verify the target student belongs to the target class and
  school.
- No school-owned query trusts client `schoolId`.

If a route identifies a class, reject:

- unassigned/forbidden class as `403`
- missing class/student as `404`
- student not in class as `422`

### Slice 4: Grade Service Layer

Create a module such as `packages/db/src/academicRecords.ts`, exported from
`packages/db/src/index.ts`.

Recommended grade functions:

- `createGrade(db, tenant, classId, input)`
- `updateGrade(db, tenant, gradeId, input)`
- `publishGrade(db, tenant, gradeId)`
- `listGradesForTeacher(db, tenant, input)`
- `listPublishedGradesForParent(db, userId, input)`
- `getParentGradeSummary(db, userId, input)`

Rules:

- New grades default to `draft`.
- Parent routes return only `published` grades.
- Draft grades are visible only to teacher/admin roles.
- `isBelowKkm` should be computed in returned DTOs as `score < kkm`.
- If `kkm` is omitted on create, use `school_settings.default_kkm`.
- Updating a published grade must insert an `audit_events` row.
- Publishing a grade should set `published_at` if missing and notify linked
  parents.
- Re-publishing an already published grade should be idempotent and should not
  duplicate notifications.

### Slice 5: Student Note Service Layer

Recommended note functions:

- `createStudentNote(db, tenant, classId, input)`
- `updateStudentNote(db, tenant, noteId, input)`
- `publishStudentNote(db, tenant, noteId)`
- `unpublishStudentNote(db, tenant, noteId)`
- `listStudentNotesForTeacher(db, tenant, input)`
- `listPublishedStudentNotesForParent(db, userId, input)`

Rules:

- New notes default to `internal`.
- Parent routes return only `published` notes.
- Internal notes are visible only to teacher/admin roles.
- Publishing/unpublishing must insert `audit_events`.
- Publishing should notify linked parents.
- Updating a published note may be allowed, but it should remain auditable if
  the content visible to parents changes.
- Notes must never mutate `students.objective_status`.

### Slice 6: Parent Access Rules

Parent grade/note routes must follow Sprint 005:

- `requireAuth` only.
- Access derived from `parent_student_links` plus caller memberships.
- Optional `studentId` must be verified as linked to caller.
- If no `studentId` is supplied, use the deterministic default child from Sprint
  005.
- No parent route accepts or trusts `schoolId`.

Parent output should be simple:

- grade list
- grade summary/count below KKM
- published note list

No class ranking, peer comparison, GPA, raport, or behavior status should appear.

### Slice 7: Notifications

Use the existing `notifications` table.

Create notification records for linked parents when:

- a grade is first published
- a note is published

Do not notify for:

- draft grade creation
- internal note creation
- draft edits
- internal edits
- grade updates after publication unless the implementation explicitly decides
  a parent-facing correction notification is necessary and documents why

Notifications must be in-app only in Sprint 006.

Avoid duplicates:

- grade publish notification should be idempotent per recipient + grade id
- note publish notification should be idempotent per recipient + note id

### Slice 8: Parent Home Integration

Extend `getParentHome` only if it can stay simple and safe.

Recommended additions:

- `latestPublishedGrade`
- `latestPublishedStudentNote`

Rules:

- Parent home must include only published records.
- Draft/internal records must not influence parent home.
- `needsAction` can remain driven by unread notifications and existing
  attendance logic. Do not invent a risk score.

### Slice 9: API Routes

Add routes in `apps/api/src/app.ts`.

Suggested teacher/admin routes:

| Route | Auth | Purpose |
|---|---|---|
| `GET /guru/classes/:classId/grades?studentId&subject&visibility&limit` | teacher/admin | List grades for an allowed class. |
| `POST /guru/classes/:classId/grades` | teacher/admin | Create draft grade for student in class. |
| `PATCH /guru/grades/:gradeId` | teacher/admin | Update grade with tenant/class ownership checks. |
| `POST /guru/grades/:gradeId/publish` | teacher/admin | Publish grade to linked parents. |
| `GET /guru/classes/:classId/student-notes?studentId&visibility&limit` | teacher/admin | List notes for an allowed class. |
| `POST /guru/classes/:classId/student-notes` | teacher/admin | Create internal note for student in class. |
| `PATCH /guru/student-notes/:noteId` | teacher/admin | Update note. |
| `POST /guru/student-notes/:noteId/publish` | teacher/admin | Publish note to linked parents. |
| `POST /guru/student-notes/:noteId/unpublish` | teacher/admin | Remove note from parent visibility. |

Suggested parent routes:

| Route | Auth | Purpose |
|---|---|---|
| `GET /parent/grades?studentId&limit` | session | Published grades for linked child. |
| `GET /parent/grades/summary?studentId` | session | Simple KKM summary for linked child. |
| `GET /parent/student-notes?studentId&limit` | session | Published notes for linked child. |

It is acceptable to combine list and summary if the DTO stays stable and
documented.

### Slice 10: Minimal UI

Extend `apps/web` validation UI.

Teacher side:

- simple class selector or reuse existing selected class flow
- grade form/list/publish action
- note form/list/publish/unpublish action
- clear labels: Draft, Published, Internal, Shared

Parent side:

- show published grades and below-KKM status for the selected child
- show published notes
- keep mobile-first card summaries

UI must follow `docs/UX_VISUAL_STANDARD.md`:

- teacher side is dense-but-calm
- parent side is reassurance-first
- no dashboard-heavy ranking or marketing composition

### Slice 11: Tests

Add focused API/service tests, for example
`apps/api/src/__tests__/academic-records.test.ts`.

Required coverage:

- teacher can create draft grade for an assigned class/student
- teacher cannot create/update grade for unassigned class
- grade create rejects student outside the class/school
- grade list is tenant-scoped
- parent sees only published grades for linked child
- parent cannot see draft grades
- parent cannot see another child's grades by guessing `studentId`
- grade summary computes below-KKM using stored grade KKM
- publishing a grade notifies linked parents and is idempotent
- updating a published grade writes audit event
- teacher can create internal note
- parent cannot see internal note
- parent sees published note for linked child
- parent cannot see another child's notes
- note publish/unpublish writes audit events
- note publish notifies linked parents and is idempotent
- notes never mutate `students.objective_status`
- Sprint 002-005 tests remain green

### Slice 12: Documentation

Update docs after implementation:

- `docs/API.md`
- `docs/DATA_MODEL.md`
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/006-nilai-catatan/completion-notes.md`

Document deferrals clearly:

- full raport/finalization
- formulas/averages/ranking
- behavior scoring
- intervention/case-management workflows
- assignments/materials/student login
- payments/premium

## Suggested File Changes

Expected files to change or be added:

- `packages/db/src/schema.ts`
- `packages/db/migrations/*`
- `packages/db/src/academicRecords.ts`
- `packages/db/src/index.ts`
- `packages/shared/src/validation.ts`
- `apps/api/src/app.ts`
- `apps/api/src/__tests__/academic-records.test.ts`
- `apps/web/src/*`
- `docs/API.md`
- `docs/DATA_MODEL.md`
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/006-nilai-catatan/completion-notes.md`

## Non-Negotiables

- Do not trust client-supplied `school_id`.
- Do not expose draft grades to parents.
- Do not expose internal notes to parents.
- Do not let parents create/update grades or notes.
- Do not let qualitative notes affect objective status.
- Do not create behavior scores, points, leaderboards, rankings, or class
  comparisons.
- Do not build full raport, semester finalization, print/export, or approval
  workflows.
- Do not build assignments/materials/student-login workflows.
- Do not build payments, premium parent subscription, forum, or broadcast
  campaigns.
- Do not start Sprint 007 or Phase 2 work.
