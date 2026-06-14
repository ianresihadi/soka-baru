# Sprint 006 Builder Handoff Prompt

You are Claude acting as Builder for SOKA Baru.

Codex/Architect has prepared Sprint 006: Nilai & Catatan. Your job is to read
the repo, produce a pre-edit implementation plan, wait for approval, then
implement only the approved Sprint 006 scope.

## Start By Reading

Read these files before planning:

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
11. `planning/sprints/006-nilai-catatan/blueprint.md`
12. `planning/sprints/006-nilai-catatan/acceptance.md`
13. `docs/API.md`
14. `docs/DATA_MODEL.md`
15. `docs/PERMISSIONS.md`
16. `docs/UX_VISUAL_STANDARD.md`
17. `docs/VALIDATION.md`

## Before Editing Files

Stop after reading and summarize your implementation plan.

Your pre-edit plan must include:

1. Whether a migration is needed and the exact proposed table/column changes.
2. The grade workflow, including draft/published state, KKM, parent visibility,
   notification, and audit behavior.
3. The Catatan Siswa workflow, including internal/published state, parent
   visibility, notification, and audit behavior.
4. Parent access rules and how you will derive access from
   `parent_student_links` and memberships.
5. Teacher/admin access rules and how you will reuse existing class access
   patterns.
6. API routes to add or change.
7. UI files/components to add or change.
8. Tests to add, including cross-school/cross-parent isolation.
9. Documentation updates.
10. Explicit deferrals.

Do not edit files until Ian approves the plan or asks for Architect review.

## Sprint 006 Scope

Build:

- basic grade records against KKM
- teacher grade create/list/update/publish flow
- parent published-grade visibility for linked children
- simple parent grade summary against KKM
- qualitative Catatan Siswa
- internal-only vs published/shared note visibility
- teacher note create/list/update/publish/unpublish flow
- parent published-note visibility for linked children
- in-app notifications when grades/notes are published
- lightweight audit for published-grade changes and note publish/unpublish
- minimal validation UI for teacher and parent workflows
- documentation and completion notes

## Non-Negotiables

Do not:

- trust client-supplied `school_id`
- expose draft grades to parents
- expose internal notes to parents
- let parents create/update/publish grades or notes
- let qualitative notes mutate `students.objective_status`
- introduce behavior score, points, leaderboard, ranking, class comparison, or
  hidden risk score
- implement full raport/finalization, print/export, approval workflow, or
  semester locking
- implement grade formulas, weighting, averages, transcript, or GPA
- implement assignments, materials, student login, or Phase 2 learning workflows
- implement payment, parent premium, forum, survey, broadcast campaign, or
  browser/native push
- start Sprint 007

## Validation Required Before PR

Run:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
```

If root `pnpm` scripts fail because of local PATH issues, run the equivalent
workspace commands and document the exact issue and substitutes.

## Completion Response

When done, report:

- migration summary
- routes added
- service functions added
- UI added
- tests added and final test count
- validation command results
- docs updated
- explicit deferrals

Do not merge the PR. Leave it ready for Architect review.
