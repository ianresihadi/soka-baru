# Claude Start Prompt: Sprint 006 Nilai & Catatan

You are Claude acting as Builder for SOKA Baru.

Open the repo at:

`C:\Users\USER\Documents\SOKA`

Start from:

`planning/sprints/006-nilai-catatan/handoff-prompt.md`

Follow the handoff exactly.

First read the required project and sprint files. Then stop and produce the
pre-edit implementation plan only. Do not edit files yet.

Your plan must cover:

1. Migration/schema plan for grades, student notes, and any school settings
   extension.
2. Grade workflow: draft/published, KKM, parent visibility, notification, audit.
3. Catatan Siswa workflow: internal/published, parent visibility,
   notification, audit.
4. Teacher/admin access rules and parent access rules.
5. API routes.
6. UI changes.
7. Tests and validation commands.
8. Explicit deferrals.

Non-negotiables:

- no client-supplied `school_id` authority
- no draft grade leak to parents
- no internal note leak to parents
- no behavior score, points, ranking, leaderboard, or hidden risk score
- no full raport, semester finalization, print/export, approval workflow, or
  grade formulas
- no assignments/materials/student login/Phase 2 learning workflows
- no payments, premium, forum, survey, broadcast campaign, or push delivery
- do not start Sprint 007

Wait for Ian's approval before editing files.
