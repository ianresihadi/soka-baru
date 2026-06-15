# Sprint 010 Blueprint: Pilot UX & Visual Productization

## Builder Summary

Sprint 010 is a frontend-first productization sprint.

Primary implementation shape:

- audit the current running UI and frontend file structure;
- define a small SOKA visual system inside `apps/web`;
- polish the shared app shell;
- polish the existing admin, teacher, and parent workspaces;
- optionally improve seed/demo presentation in a narrow, safe way;
- verify visually on desktop and mobile;
- keep backend behavior and permissions unchanged.

Do not add product breadth. Make the existing MVP feel credible.

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
10. `docs/UX_VISUAL_STANDARD.md`
11. `docs/PILOT_SMOKE_CHECKLIST.md`
12. `docs/SETUP.md`
13. `planning/sprints/010-pilot-ux-visual-productization/requirements.md`
14. `planning/sprints/010-pilot-ux-visual-productization/acceptance.md`
15. `apps/web/src/App.tsx`
16. `apps/web/src/AppShell.tsx`
17. `apps/web/src/LoginPanel.tsx`
18. `apps/web/src/RoleSwitcher.tsx`
19. `apps/web/src/TeacherWorkspace.tsx`
20. `apps/web/src/PapanPagi.tsx`
21. `apps/web/src/TeacherGradesNotes.tsx`
22. `apps/web/src/ParentWorkspace.tsx`
23. `apps/web/src/ParentHome.tsx`
24. `apps/web/src/AdminSetupWorkspace.tsx`
25. `apps/web/src/index.css`
26. `apps/web/src/api.ts`
27. `apps/web/src/adminSetupApi.ts`
28. `packages/db/src/seed.ts`

## Implementation Slices

### Slice 0: Pre-Edit UI Audit And Plan

Before editing files, Builder must summarize:

- current app shell structure;
- current teacher/admin/parent visual problems;
- proposed visual system primitives or CSS structure;
- exact files to edit;
- responsive validation plan;
- whether any seed/demo data change is proposed;
- validation commands;
- explicit deferrals.

Wait for Ian approval before editing.

If the plan adds a new product module, backend route, database migration, auth
change, role change, or payment/premium work, stop and ask Architect.

### Slice 1: Lightweight Visual System

Create or consolidate a small visual foundation.

Acceptable approaches:

- update `apps/web/src/index.css` with CSS variables, base styles, responsive
  rules, and reusable utility classes;
- add lightweight components under `apps/web/src/components/` or a small
  `ui.tsx` file if it reduces duplication;
- keep styles Tailwind/CSS-based and local to the app.

Recommended conventions:

- warm neutral surface, but not a beige-only UI;
- one trustworthy primary color;
- role/status accents for admin, teacher, parent, attendance, warnings, and
  success states;
- 8px or smaller card radius unless existing style strongly says otherwise;
- consistent button, input, select, badge, card, table, and notice states;
- stable dimensions for role switchers, nav chips, attendance buttons, and
  compact controls to avoid layout shift;
- no visible explanatory marketing copy.

Avoid:

- heavy UI frameworks;
- decorative orbs/blobs/gradients;
- huge hero sections;
- nested cards inside cards;
- text that describes keyboard shortcuts or design features to users;
- placeholder navigation to modules that do not exist.

### Slice 2: App Shell

Improve `AppShell` and related shell components.

Expected result:

- top shell clearly shows SOKA, school name, active role/workspace, and account;
- role/workspace switcher is clear and polished for users with multiple
  workspaces;
- sign-out state remains correct from Sprint 007 review: only clear local state
  when server sign-out succeeds;
- mobile header does not overflow;
- errors and loading states are calm and useful;
- no client-side tenant shortcuts or fake auth.

### Slice 3: Teacher Workspace And Papan Pagi

Polish `TeacherWorkspace`, `PapanPagi`, and `TeacherGradesNotes`.

Expected result:

- Papan Pagi order remains unchanged and obvious;
- top summary makes attendance status and next action clear;
- attendance capture uses clear segmented/status controls;
- saved/unsaved/failed states are visible;
- "Siswa Perlu Perhatian" is scannable without feeling punitive;
- grades/notes panel is usable and visually subordinate to the daily loop;
- teacher desktop/tablet layout uses space efficiently;
- mobile fallback remains usable for attendance.

No new teacher module should be introduced.

### Slice 4: Parent Workspace

Polish `ParentWorkspace` and `ParentHome`.

Expected result:

- mobile-first first viewport;
- child switcher is clear and touch-friendly;
- reassurance summary appears before details;
- action-needed state is clear but not alarming;
- attendance, notifications, grades, notes, and messages are grouped in simple
  parent-friendly cards;
- empty states explain what parents can expect without exposing internal system
  language;
- no draft/internal teacher data leaks.

### Slice 5: Admin Setup Workspace

Polish `AdminSetupWorkspace`.

Expected result:

- admin sees a guided setup surface, not raw API panels;
- classes, students, teacher assignment, parent codes, and settings are easier
  to scan;
- forms have clear labels, help text only where needed, and good validation
  feedback;
- lists/tables do not overflow on typical laptop widths;
- parent link code lifecycle is understandable;
- still no full TU/admin scope.

### Slice 6: Seed / Demo Walkthrough Polish

Optional and small.

Builder may improve local-dev demo confidence by:

- adding a few safe seeded records that make parent/teacher pages less empty;
- improving labels/names that appear in the UI;
- updating docs with a recommended walkthrough script.

Rules:

- no fake runtime mock layer;
- no demo auth bypass;
- no production-looking hardcoded secrets beyond existing local-dev seed
  credentials;
- no broad seed explosion.

If Builder changes seed data, keep it idempotent and update docs.

### Slice 7: Docs

Update:

- `docs/UX_VISUAL_STANDARD.md` with any concrete UI conventions created;
- `docs/PILOT_SMOKE_CHECKLIST.md` with a more useful visual walkthrough;
- `docs/VALIDATION.md` if validation instructions or test counts change;
- `planning/STATE.md`;
- Sprint 010 completion notes.

Update `planning/DECISIONS.md` only if a durable product/design decision is made,
not for ordinary implementation details.

### Slice 8: Visual Verification

Builder must verify the UI, not only compile it.

Required viewport checks:

- desktop/laptop around 1366x768;
- mobile around 390x844;
- at least one authenticated admin/teacher view;
- at least one authenticated parent view;
- login screen.

Preferred tools:

- browser screenshot/manual inspection if available;
- otherwise document why visual verification could not be run and provide exact
  manual steps for Ian.

Visual checks must look for:

- text overflow;
- overlapping elements;
- unusable buttons;
- broken mobile layout;
- unreadable contrast;
- dead navigation;
- empty states that feel broken.

### Slice 9: Validation

Required before PR:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
pnpm validate
```

Because Ian's Windows environment may not have global `pnpm`, Builder may use
the documented Corepack form where needed:

```bash
corepack pnpm@10.33.0 --filter @soka/web build
```

If `pnpm validate` fails only because nested global `pnpm` is missing, document
the exact result and run the constituent commands successfully.

## Suggested File Changes

Likely frontend files:

- `apps/web/src/index.css`
- `apps/web/src/App.tsx`
- `apps/web/src/AppShell.tsx`
- `apps/web/src/LoginPanel.tsx`
- `apps/web/src/RoleSwitcher.tsx`
- `apps/web/src/TeacherWorkspace.tsx`
- `apps/web/src/PapanPagi.tsx`
- `apps/web/src/TeacherGradesNotes.tsx`
- `apps/web/src/ParentWorkspace.tsx`
- `apps/web/src/ParentHome.tsx`
- `apps/web/src/AdminSetupWorkspace.tsx`
- optional `apps/web/src/components/*`

Possible docs:

- `docs/UX_VISUAL_STANDARD.md`
- `docs/PILOT_SMOKE_CHECKLIST.md`
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/010-pilot-ux-visual-productization/completion-notes.md`

Possible seed file only if justified:

- `packages/db/src/seed.ts`

Avoid backend route/schema/auth changes unless a clear bug blocks the UI.

## Non-Negotiables

- No new product module.
- No new database migration unless explicitly approved.
- No auth bypass or role/permission change.
- No parent visibility regression.
- No Supabase reintroduction.
- No full UI framework.
- No decorative landing page.
- No nested card-heavy marketing layout.
- No text overlap on desktop or mobile.
- No hidden or fake route links.

## Architect Review Focus

Architect will check:

- whether the app now feels like a credible pilot product;
- whether the teacher flow remains fast and task-first;
- whether the parent flow is reassurance-first and mobile-friendly;
- whether admin setup is clearer without becoming full TU;
- whether all old permissions/visibility rules remain intact;
- whether validation and visual verification are documented.
