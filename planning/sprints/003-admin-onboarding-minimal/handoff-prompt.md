# Sprint 003 Builder Handoff Prompt

You are the Builder for SOKA Baru Sprint 003: Admin Onboarding Minimal.

Your job is to build the minimum onboarding layer needed for real MVP data: classes, students, teacher assignments, parent link codes, and parent-student links.

Do not build full TU workflows or product dashboards.

## Read First

Read these files in order before making changes:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `CONTEXT.md`
4. `planning/STATE.md`
5. `planning/DECISIONS.md`
6. `planning/DOMAIN.md`
7. `planning/RISKS.md`
8. `planning/QUESTIONS.md`
9. `planning/ARCHITECT-BUILDER-RUNBOOK.md`
10. `docs/ARCHITECTURE.md`
11. `docs/API.md`
12. `docs/DATA_MODEL.md`
13. `docs/PERMISSIONS.md`
14. `docs/VALIDATION.md`
15. `planning/sprints/002-foundation-data-auth/completion-notes.md`
16. `planning/sprints/003-admin-onboarding-minimal/requirements.md`
17. `planning/sprints/003-admin-onboarding-minimal/blueprint.md`
18. `planning/sprints/003-admin-onboarding-minimal/acceptance.md`

## Before Editing

Before making code changes, summarize your implementation plan:

1. Tables/migrations you will add.
2. Repository/service functions you will create.
3. API routes you will add.
4. How setup/admin access will be enforced.
5. How parent link codes will be generated, redeemed, expired, and marked used.
6. How cross-school isolation will be enforced for classes, students, teacher assignments, and parent links.
7. Tests or validation steps you will run.
8. Any blockers or decisions needing Ian/Architect approval.

Wait for approval before editing files.

## Build Scope

Implement the smallest reliable onboarding foundation that satisfies Sprint 003 acceptance.

Required areas:

- Classes.
- Students.
- Student-class assignment.
- Teacher-class assignment.
- Parent link codes.
- Parent-student links.
- Admin/setup API routes.
- Parent link redemption route.
- Tests for cross-school isolation and link safety.
- Documentation updates.

## Security And Tenancy Rules

- Do not trust client-supplied `school_id`.
- Use server-resolved tenant/membership context.
- Setup routes require `admin_sekolah` or `soka_internal`.
- Parent link redemption requires `orang_tua`.
- Teacher assignments must use same-school teacher memberships.
- Student-class assignments must use same-school student and class.
- Parent-student links must use same-school parent membership and student.
- Invalid, used, expired, or cross-school link codes must be rejected.
- Public self-binding must remain limited to non-privileged roles from Sprint 002.

## Out Of Scope

Do not build:

- Full TU/Admin Sekolah module.
- Attendance workflow.
- Guru daily dashboard.
- Parent mobile app polish.
- Parent messaging.
- Payments.
- Principal dashboard.
- Student learning workflows.
- Complex Excel import.
- Government reporting.

Minimal validation UI or scripts are allowed only if they support onboarding validation.

## Definition Of Done

Sprint 003 is done when:

- Schema/migrations exist for onboarding tables.
- Admin/setup routes or equivalent validated setup path exists.
- Parent link codes and parent-student links work safely.
- Cross-school isolation is covered by automated tests.
- Sprint 002 tests still pass.
- Typecheck and build pass.
- Docs and completion notes are updated.

Stay inside Sprint 003. Sprint 004 Guru Daily Loop will be detailed by Architect after Sprint 003 is reviewed and accepted.
