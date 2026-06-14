# SOKA 120x Architect / Builder Runbook

This runbook explains how Ian should execute SOKA Baru using this repository as the handoff folder.

## Role Split

## Architect

Architect owns clarity before implementation.

Primary responsibilities:

- Clarify product direction, business rules, scope, risks, and acceptance criteria.
- Convert messy inputs into durable docs under `planning/` and `docs/`.
- Prepare sprint folders before Builder starts.
- Review Builder output against the sprint requirements and acceptance criteria.
- Decide whether a Builder question is a product decision, architecture decision, or implementation detail.

In this workflow, Codex is the Architect.

## Builder

Builder owns implementation inside the approved sprint boundary.

Primary responsibilities:

- Read the repo docs before coding.
- Summarize implementation plan before editing files.
- Implement the approved sprint only.
- Run tests or exact validation steps.
- Update docs after implementation.
- Stop and ask if product scope, business rules, or architecture decisions are ambiguous.

In this workflow, Claude is the Builder.

## Core 120x Rule

The handoff is the folder, not the chat.

Claude should not depend on hidden conversation context. If a decision matters, it must be in this repo.

Durable truth lives in:

- `AGENTS.md`
- `CONTEXT.md`
- `planning/STATE.md`
- `planning/DECISIONS.md`
- `planning/DOMAIN.md`
- `planning/RISKS.md`
- `planning/QUESTIONS.md`
- active sprint folder under `planning/sprints/`
- relevant docs under `docs/`

## When To Move To Claude

Move to Claude when all of these are true:

- The active sprint has `requirements.md`, `blueprint.md`, `acceptance.md`, and `handoff-prompt.md`.
- `planning/STATE.md` says the sprint is ready for Builder implementation planning.
- The stack and core business rules needed by the sprint are no longer open questions.
- The Builder can implement without inventing product scope.

For the current project state, Ian can move to Claude now for Sprint 006.

Sprint 006 is ready for Builder implementation planning. The Builder must still summarize its plan before coding.

## When To Stay With Architect

Stay with Architect if:

- The next sprint does not yet have detailed sprint artifacts.
- A product/module/role decision is still ambiguous.
- A business rule would be invented by implementation.
- There is a conflict between old SOKA code, deck material, and current docs.
- The Builder asks a question that changes scope, permissions, data ownership, pricing, or role behavior.

## When To Return From Claude To Architect

Return to Architect after Claude:

- Produces its pre-edit implementation plan and Ian wants it reviewed before coding.
- Finds a blocker or ambiguous decision.
- Completes a sprint and needs acceptance review.
- Changes architecture in a way that should be recorded in `planning/DECISIONS.md`.
- Needs the next sprint refined before continuing.

## Sprint Execution Loop

Use this loop for every sprint.

### 1. Architect Prepares Sprint

Architect creates or updates:

- `planning/sprints/###-{name}/requirements.md`
- `planning/sprints/###-{name}/blueprint.md`
- `planning/sprints/###-{name}/acceptance.md`
- `planning/sprints/###-{name}/handoff-prompt.md`
- relevant `docs/`
- `planning/STATE.md`

### 2. Ian Approves Sprint Handoff

Ian reviews the sprint handoff. Once approved, Builder may start planning.

### 3. Builder Reads First

Builder reads:

- `AGENTS.md`
- `CONTEXT.md`
- `planning/STATE.md`
- `planning/DECISIONS.md`
- `planning/DOMAIN.md`
- active sprint files
- relevant `docs/`

Builder should not start from memory or chat history.

### 4. Builder Summarizes Plan Before Editing

Builder must summarize:

- package/workspace structure
- files to create/modify
- data model/migrations
- auth or API wiring
- validation/test plan
- blockers or assumptions

Ian can approve directly or bring the plan back to Architect for review.

### 5. Builder Implements

Builder implements only the approved sprint.

Builder must not:

- redefine product scope
- add unapproved modules
- invent business rules
- silently copy bulky/private reference files
- migrate SOKA Lama wholesale

### 6. Builder Validates

Builder runs tests or documented validation.

If tests cannot run, Builder records:

- what was attempted
- what failed
- why it failed
- what must be done next

### 7. Builder Updates Docs

Builder updates:

- `planning/STATE.md`
- relevant `docs/`
- `planning/DECISIONS.md` if a durable decision changed
- active sprint notes if useful

### 8. Architect Reviews

Architect checks:

- implementation matches requirements
- acceptance criteria are satisfied
- no scope creep entered
- docs reflect reality
- next sprint can safely begin

## Current Sprint: 006 Nilai & Catatan

Current status:

- Sprint 001 Discovery & Architecture is complete.
- Sprint 002 Foundation Data/Auth is merged and accepted.
- Sprint 003 Admin Onboarding Minimal is merged and accepted.
- Sprint 004 Guru Daily Loop is merged and accepted.
- Sprint 005 Parent Trust Loop is merged and accepted.
- Sprint 006 Nilai & Catatan is ready for Builder implementation planning.
- Claude can begin from `planning/sprints/006-nilai-catatan/claude-start-prompt.md`.

Claude must implement Sprint 006 only. Claude must not build full raport/finalization, behavior scoring, intervention/case-management workflows, assignments, materials, student login, payment, parent premium, forum, broadcast campaigns, browser/native push delivery, or Sprint 007 work.

## Recommended Ian Workflow Right Now

1. Open Claude in `C:\Users\USER\Documents\SOKA`.
2. Paste the Sprint 006 Claude start prompt from `planning/sprints/006-nilai-catatan/claude-start-prompt.md`.
3. Ask Claude to read files and produce the pre-edit implementation plan only.
4. Review Claude's plan.
5. If the plan is clear and stays inside Sprint 006, approve implementation.
6. If the plan changes scope or raises architecture questions, bring it back to Architect before coding.

## Architect Review Checklist For Claude's Plan

Claude's plan is acceptable if it:

- Uses React/Vite/TypeScript/Tailwind, Hono, Drizzle, Better Auth, and Neon Postgres.
- Does not reintroduce Supabase as the baseline backend.
- Adds only the approved Sprint 006 workflows: basic grades against KKM, draft/published grade visibility, parent published-grade visibility, qualitative student notes, internal/published note visibility, publish notifications, and lightweight audit.
- Enforces tenant isolation from server-side membership context, not client `school_id`.
- Derives parent grade/note access only from `parent_student_links` and the caller's memberships.
- Keeps parent access read-only for grades and notes.
- Keeps Catatan Siswa qualitative-only.
- Keeps notifications in-app only.
- Includes validation proving School A cannot access School B.
- Stays out of full raport/finalization, formulas/averages/ranking, behavior scoring, case management, assignments/materials/student login, payments/premium, forum, broadcast campaigns, push delivery, and Sprint 007.

## Completion Gate For Sprint 006

Sprint 006 should not be considered complete until:

- Builder has implemented the approved Nilai & Catatan scope.
- Validation proves teacher grade/note workflows, parent published-only visibility, notification/audit behavior, and cross-school/cross-parent isolation.
- Docs are updated.
- Architect reviews the output against `acceptance.md`.

Only after that should Architect prepare the next sprint in detail.
