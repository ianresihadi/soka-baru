# Sprint 006 Requirements: Nilai & Catatan

## Goal

Build the first MVP slice for academic visibility and qualitative student notes:

- teachers can record basic grades against KKM
- parents can see only published grade information for linked children
- teachers can write Catatan Siswa as internal-only or parent-shared
- parents can see only published/shared notes

Sprint 006 completes the first parent trust loop beyond attendance and messages.
It must stay lightweight: useful for SD private-school operations without
turning SOKA into a full SIS, LMS, raport engine, behavior-scoring system, or
counseling case-management product.

## Product Context

Session 4 classified:

- nilai dasar / nilai terhadap KKM as **Now**
- full raport finalization as **Later**
- Catatan Siswa qualitative with publication status as **Now**
- case-management/intervention/BK SLA workflows as **Never for MVP**

Session 2 also confirmed:

- Catatan Siswa is qualitative-only.
- Catatan Siswa needs publication status before parent visibility.
- Student status labels are `aman`, `perhatian`, and `kritis`, based on
  objective data only.
- Qualitative notes must not automatically affect student status.

Sprint 006 should therefore expose grades and notes as trust-building records,
not as a complex academic-administration system.

## Users

Primary school-side users:

- `wali_kelas`
- `guru`

Parent-facing user:

- `orang_tua`

Supporting setup/admin users:

- `admin_sekolah`
- `soka_internal`

`siswa`, `kepala_sekolah`, and full TU workflows remain outside Sprint 006.

## In Scope

### 1. Basic Grade Records

Teachers can create and update basic grade records for students in classes they
are allowed to operate.

Minimum fields:

- student
- class
- subject or assessment area
- assessment name
- assessment date
- score
- max score, default 100
- KKM used for this record
- publication status

The record should be understandable as "nilai dasar terhadap KKM", not full
raport.

### 2. KKM Visibility

Each grade record must show whether the score is below KKM.

Sprint 006 may add a default KKM setting to `school_settings` if needed. The
implementation must not hardcode one global school rule in application logic
when a school-owned setting is more appropriate.

If a per-grade KKM is supplied, it should be stored on the grade record so later
setting changes do not rewrite historical meaning.

### 3. Grade Publication To Parents

Grades start as draft/internal by default.

Only published grades are visible to linked parents. Draft/internal grades must
not appear in parent grade endpoints, parent home, notifications, or UI.

Publishing a grade should create in-app notifications for linked parents. This
stays transactional/in-app only; no browser/native push is required.

### 4. Published Grade Change Audit

Changes to a grade after it has been published are trust-sensitive.

Sprint 006 must record lightweight audit events for updates to already-published
grade records. Draft edits before publication do not require audit.

The audit should capture at least:

- action
- entity type/id
- actor user
- school
- previous relevant values
- next relevant values

### 5. Catatan Siswa

Teachers can create and update qualitative student notes.

Minimum fields:

- student
- class context if available
- author membership
- category or note type
- note body
- visibility status: `internal` or `published`
- published timestamp when shared

Notes are qualitative. They must not include behavior points, score totals,
leaderboards, punishment workflows, or automatic risk/status calculations.

### 6. Note Publication Rules

Notes are internal-only by default.

Only published notes are visible to linked parents. Unpublished/internal notes
must never appear in parent note endpoints, parent home, notifications, or UI.

Publishing a note should create in-app notifications for linked parents.
Unpublishing a note should remove parent visibility going forward; it does not
need to delete historical notifications in Sprint 006.

### 7. Note Publish/Unpublish Audit

Publishing and unpublishing Catatan Siswa are trust-sensitive actions.

Sprint 006 must record lightweight audit events for note publication state
changes.

### 8. Parent Visibility

Parents can view, for their linked children only:

- published grades
- a simple grade summary against KKM
- published student notes

Parent routes must derive access from `parent_student_links` and the caller's
memberships, like Sprint 005. No parent request may trust a client-supplied
`school_id`.

### 9. Minimal UI

Add enough UI in `apps/web` to validate the workflows:

- teacher-side grade entry/list/publish
- teacher-side note entry/list/publish/unpublish
- parent-side grades and published notes for the selected child

The UI may remain a validation UI. It should not become a full navigation
system, complete raport product, principal dashboard, or marketing page.

## Out Of Scope

- Full raport finalization.
- Semester report generation, printing, approval, or locking.
- Curriculum mapping, competency banks, learning outcomes, or rubrics.
- Grade weighting, formulas, averages, ranks, class comparisons, or transcripts.
- Student behavior score, points, leaderboard, or automatic behavior-derived
  status.
- Counseling/BK case management, intervention workflow, escalation, SLA, or
  task assignment.
- Digital assignments, material repository, submissions, or student login.
- Payment, premium parent subscription, forum, feedback/survey, or broadcast
  campaign features.
- Browser/native push delivery.
- Principal/Kepala Sekolah analytics.

## Required Documentation Updates By Builder

Builder must update these after implementation:

- `docs/API.md`
- `docs/DATA_MODEL.md`
- `docs/PERMISSIONS.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/006-nilai-catatan/completion-notes.md`

Builder must update `planning/DECISIONS.md` only if it introduces a durable
product or architecture decision not already captured here.
