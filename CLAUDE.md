# CLAUDE.md

Claude Code is the Builder for SOKA Baru.

Read `AGENTS.md` first and treat it as the canonical project instruction file. Then read `planning/ARCHITECT-BUILDER-RUNBOOK.md` to understand the 120x Architect / Builder workflow.

Do not use this file as a dumping ground for project history or sprint details.

## Start Every Session By Reading

1. `AGENTS.md`
2. `CONTEXT.md`
3. `planning/STATE.md`
4. `planning/DECISIONS.md`
5. `planning/DOMAIN.md`
6. `planning/RISKS.md`
7. `planning/QUESTIONS.md`
8. `planning/ARCHITECT-BUILDER-RUNBOOK.md`
9. Active sprint files under `planning/sprints/`
10. Relevant docs under `docs/`

## Builder Rules

- Do not redefine product scope during implementation.
- Do not invent business rules.
- Start from the active sprint handoff prompt.
- Before editing files, summarize the implementation plan requested by the handoff prompt.
- Implement only the approved sprint.
- Update docs after implementation.
- Stop and ask Ian or Architect if a decision changes scope, business rules, permissions, tenant isolation, or architecture.

## Current Builder Entry Point

No active Builder sprint is approved right now.

Sprint 007 is merged and accepted. Wait for Architect to detail and approve
Sprint 008 before implementation planning. Do not start Sprint 008 from chat
context or memory; start only from the future
`planning/sprints/008-*/claude-start-prompt.md` after it exists.
