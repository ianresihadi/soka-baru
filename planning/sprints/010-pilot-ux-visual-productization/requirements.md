# Sprint 010 Requirements: Pilot UX & Visual Productization

## Purpose

Sprint 010 turns the working SOKA MVP from a functional skeleton into a credible
pilot product experience.

After Sprint 009, SOKA can run locally against Neon and the core admin, teacher,
and parent workflows exist. The app is technically alive, but the current UI
still feels like a developer validation surface. A pilot school should see a
calm, warm, orderly, school-ready product, not only raw forms and API-backed
panels.

This sprint is about productizing the existing workflows. It should not add a
new product module.

## Why This Sprint Now

Ian has now seen the running app at `localhost:5173` and correctly challenged
that the result looks too basic compared with the intended SOKA Baru quality.

The core foundation is in place:

- role-aware app shell;
- admin setup workspace;
- teacher Papan Pagi, attendance, messages, grades, and notes;
- parent home, attendance, notifications, grades, notes, and messages;
- live Neon migrate/seed path;
- scripted live smoke tooling.

The next risk is not technical feasibility; it is product confidence. If the
first pilot impression feels rough, users may assume the underlying system is
also immature even when the backend is solid.

## Product Principle

Sprint 010 must apply the existing SOKA UX standard:

**Hangat, ramah, tertib, dan operasional.**

Meaning:

- warm and school-friendly;
- easy for teachers and parents to understand;
- organized and trustworthy;
- built for repeated daily work, not decorative demo spectacle.

## Goals

1. Make the first logged-in screen feel like a real SOKA product.
2. Improve visual hierarchy, spacing, typography, color, and interaction states
   across the existing app shell.
3. Make the teacher experience dense-but-calm and task-first.
4. Make the parent experience mobile-first and reassurance-first.
5. Make the admin setup experience feel operational and guided, not like raw
   forms.
6. Improve demo/seed presentation enough that a pilot walkthrough feels credible.
7. Preserve all existing backend behavior, permissions, and tests.

## Target Users

### Primary

- Wali kelas / guru using SOKA during the school day.
- Orang tua checking the child status from a phone.
- Admin sekolah or SOKA internal operator preparing pilot setup.

### Secondary

- Ian / Architect reviewing whether SOKA is ready to show to a pilot school.
- A school owner/foundation/leader seeing the product for the first time.

## In Scope

### App Shell Productization

Improve the shared logged-in shell:

- clearer school and role context;
- more polished role/workspace switching;
- visible but unobtrusive sign-out;
- responsive layout that works on desktop and mobile;
- consistent page width, spacing, cards, controls, and status badges;
- better empty/loading/error states.

This should stay an app shell, not a marketing landing page.

### Teacher Experience Polish

Improve the existing teacher workspace and `PapanPagi` experience:

- preserve the approved Papan Pagi order:
  1. Status Absensi Hari Ini;
  2. Pesan Ortu Belum Dibalas;
  3. Siswa Perlu Perhatian;
  4. Jadwal Mengajar Hari Ini.
- make the morning board visually scannable;
- make attendance entry feel like a clear workflow, not a row of raw buttons;
- improve status language, badges, section headings, and saved states;
- keep the teacher UI dense-but-calm, not decorative;
- make desktop/tablet strong and mobile fallback usable.

### Parent Experience Polish

Improve the existing parent workspace and `ParentHome` experience:

- mobile-first layout;
- clear child switcher;
- top reassurance summary that answers:
  - is my child okay today?
  - is there anything I need to notice?
  - are there new grades, notes, messages, or notifications?
- calmer information grouping for attendance, notifications, grades, notes, and
  messages;
- useful empty states;
- no dense tables on the parent home first screen.

### Admin Setup Polish

Improve the existing admin setup workspace:

- make sections easier to scan;
- show setup progress or checklist context if possible from existing data;
- clarify class/student/teacher/parent-code workflows;
- improve forms, tables, buttons, and feedback states;
- keep it a constrained setup surface, not a full TU/admin product.

### Visual System Consolidation

Create or consolidate lightweight frontend primitives if useful, such as:

- `Badge`;
- `Button`;
- `Card`;
- `SectionHeader`;
- `Notice`;
- `Field`;
- `EmptyState`;
- role/status color tokens.

These can live inside `apps/web/src/` and should remain simple. Do not introduce
a heavy design system or UI framework.

### Demo Data Presentation

If small and safe, improve local-dev seed data labels or docs so the demo feels
less empty. This may include:

- clearer class/student names already in seed;
- a documented recommended walkthrough order;
- small seeded examples only if they do not distort production logic.

Do not add fake production data paths, demo auth bypasses, or mock data in the
runtime app.

### Docs

Update docs that help Ian evaluate and demo the product:

- `docs/PILOT_SMOKE_CHECKLIST.md`;
- `docs/SETUP.md` if local walkthrough commands change;
- `docs/UX_VISUAL_STANDARD.md` if Sprint 010 crystallizes concrete frontend
  conventions;
- `planning/STATE.md`;
- Sprint 010 completion notes.

## Out Of Scope

Sprint 010 must not add:

- Pengumuman / broadcast announcements;
- push delivery;
- payments;
- full raport finalization;
- student login or learning workflows;
- principal analytics;
- full TU/admin module;
- new backend modules;
- new database tables or migrations unless a tiny frontend-supporting change is
  explicitly justified and approved;
- new auth or role behavior;
- changes to parent visibility rules;
- changes to tenant isolation;
- provider-specific deployment automation.

## Non-Negotiables

- Do not weaken auth, permissions, tenant isolation, or parent visibility.
- Do not trust client-supplied `school_id`.
- Do not expose draft grades or internal notes to parents.
- Do not add demo bypass login.
- Do not add broad module navigation for features that do not exist.
- Do not make a landing page instead of the app experience.
- Do not make the UI decorative at the expense of daily workflows.
- Do not let text overflow or overlap on desktop or mobile.
- Do not use a one-note visual palette; SOKA should feel warm and orderly, not
  monochrome.

## Expected Outputs

- Polished app shell.
- Polished teacher Papan Pagi / daily loop surface.
- Polished parent home / trust loop surface.
- Polished admin setup surface.
- Shared lightweight UI conventions/components where useful.
- Updated UX/pilot docs.
- Completion notes with before/after summary and validation commands.
- Existing tests/typecheck/build green.

## Success Definition

By the end of Sprint 010, Ian should be able to open the local SOKA app and say:

"This is still an MVP, but it now feels like a real school product I can show in
a controlled pilot."

The app should not only work; it should communicate trust, calm, and operational
clarity.
