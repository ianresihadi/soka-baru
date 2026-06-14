# Claude Start Prompt: Sprint 005 Parent Trust Loop

Paste this prompt into Claude while working in:

```text
C:\Users\USER\Documents\SOKA
```

## Prompt

You are the Builder for SOKA Baru Sprint 005: Parent Trust Loop.

Use this repository as the source of truth. Do not rely on any previous chat
history.

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
10. `planning/sprints/005-parent-trust-loop/requirements.md`
11. `planning/sprints/005-parent-trust-loop/blueprint.md`
12. `planning/sprints/005-parent-trust-loop/acceptance.md`
13. `planning/sprints/005-parent-trust-loop/handoff-prompt.md`
14. `docs/API.md`
15. `docs/DATA_MODEL.md`
16. `docs/PERMISSIONS.md`
17. `docs/VALIDATION.md`
18. `docs/UX_VISUAL_STANDARD.md`

Then produce the pre-edit implementation plan required by:

```text
planning/sprints/005-parent-trust-loop/handoff-prompt.md
```

Do not edit files until the plan is approved.

Important boundaries:

- Implement Sprint 005 only.
- Do not start Sprint 006 Nilai & Catatan.
- Do not build grades/raport, student notes, payments, parent premium,
  assignments, materials, forums, native push, or full chat polish.
- Preserve tenant isolation: never trust client-supplied `school_id`.
- Parent access must come only from `parent_student_links`.
- Keep the parent UI mobile-first and reassurance-first.
