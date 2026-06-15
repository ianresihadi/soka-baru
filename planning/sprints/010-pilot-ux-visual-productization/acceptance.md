# Sprint 010 Acceptance Criteria

Sprint 010 is complete when all criteria below are met.

## Product Feel

- The logged-in app no longer feels like a raw developer validation UI.
- The visual direction matches "hangat, ramah, tertib, dan operasional."
- The product still feels operational, not like a marketing landing page.
- School, role, account, and current workspace context are clear.
- The app is credible enough for a controlled pilot walkthrough.

## App Shell

- The shared shell is polished on desktop and mobile.
- Workspace/role switching is clear for multi-role accounts.
- Sign-out behavior remains correct: local state is cleared only after server
  sign-out succeeds.
- Loading, empty, and error states are visible and calm.
- Header and nav do not overflow on mobile.

## Teacher Experience

- Papan Pagi keeps the approved order:
  1. Status Absensi Hari Ini;
  2. Pesan Ortu Belum Dibalas;
  3. Siswa Perlu Perhatian;
  4. Jadwal Mengajar Hari Ini.
- Attendance capture is easier to understand and operate than the pre-sprint UI.
- Attendance status, cutoff, and next action are visually clear.
- Teacher UI remains dense-but-calm and task-first.
- Grades/notes are still available without taking over the morning dashboard.
- Teacher mobile fallback remains usable for attendance.

## Parent Experience

- Parent home is mobile-first.
- The first screen gives reassurance before details.
- Child switching is clear and touch-friendly.
- Attendance, notifications, grades, notes, and messages are grouped in simple
  parent-friendly sections.
- Empty states are useful and do not expose internal implementation language.
- Parents still see only published grades and published notes.

## Admin Setup Experience

- Admin setup feels guided and operational.
- Classes, students, teacher assignments, parent link codes, and settings are
  easier to scan and operate.
- Forms, tables, and feedback states are visually consistent.
- Parent link code lifecycle remains understandable.
- No full TU/admin product scope is added.

## Responsive And Visual QA

- Desktop/laptop viewport around 1366x768 is checked.
- Mobile viewport around 390x844 is checked.
- Login, admin, teacher, and parent surfaces are checked.
- No obvious text overflow, overlapping UI, unreadable contrast, broken buttons,
  or dead navigation remains.
- Any remaining visual limitation is documented in completion notes.

## Behavior Preservation

- No new product module is added.
- No new schema/migration is added unless explicitly approved.
- No auth, role, permission, or tenant-isolation behavior is weakened.
- No parent visibility boundary regresses.
- No demo login bypass or runtime mock-data architecture is introduced.
- No Supabase baseline is reintroduced.

## Documentation

- `docs/UX_VISUAL_STANDARD.md` reflects any new concrete UI conventions.
- `docs/PILOT_SMOKE_CHECKLIST.md` includes the improved visual walkthrough if
  the manual flow changes.
- `docs/VALIDATION.md` is updated if validation commands or test counts change.
- `planning/STATE.md` records Sprint 010 build status.
- Sprint 010 completion notes record changes, visual QA, commands, and known
  limitations.

## Required Commands Before PR

Builder must run, or explicitly document why a command could not run:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
pnpm validate
```

If global `pnpm` is unavailable, use the documented Corepack equivalent and
record the exact commands.

## Definition Of Done

Ian can open the seeded local app and walk through:

1. login;
2. admin setup;
3. teacher Papan Pagi and attendance;
4. parent home;
5. notifications/messages/grades/notes surfaces;

and the app feels like a coherent SOKA pilot product rather than a raw technical
demo.
