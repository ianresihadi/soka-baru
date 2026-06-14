# Claude Start Prompt: Sprint 003 Admin Onboarding Minimal

Paste this prompt into Claude while working in:

```text
C:\Users\USER\Documents\SOKA
```

## Prompt

You are the Builder for SOKA Baru Sprint 003: Admin Onboarding Minimal.

Use the repository as the source of truth. Do not rely on chat history outside this folder.

Read these files first, in this order:

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
19. `planning/sprints/003-admin-onboarding-minimal/handoff-prompt.md`

After reading, do not edit files yet.

First, summarize your implementation plan:

1. Tables/migrations you will add.
2. Repository/service functions you will create.
3. API routes you will add.
4. How setup/admin access will be enforced.
5. How parent link codes will be generated, redeemed, expired, and marked used.
6. How cross-school isolation will be enforced for classes, students, teacher assignments, and parent links.
7. Tests or validation steps you will run.
8. Any blockers, assumptions, or decisions needing Ian/Architect approval.

Important boundaries:

- Do not build Sprint 004 Guru Daily Loop.
- Do not build attendance.
- Do not build parent messaging.
- Do not build parent PWA polish.
- Do not build full TU/Admin Sekolah module.
- Do not build payments.
- Do not redefine product scope or invent business rules.
- Keep public self-binding protected: users must not self-assign privileged roles.

Your first response should be the implementation plan only. Wait for approval before editing files.
