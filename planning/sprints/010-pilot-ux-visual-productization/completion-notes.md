# Sprint 010 Completion Notes: Pilot UX & Visual Productization

Status: Implemented by Builder on branch `claude/sprint-010-pilot-ux`. PR #9 is
open and ready for Architect review (accepted in principle; docs-only cleanup
applied). Not yet merged.

## Builder Summary

Frontend-first productization. No backend route, schema, migration, auth, role,
tenant, or parent-visibility change.

### Visual system (new)

- `apps/web/tailwind.config.js` — `brand` indigo scale, `shadow-card`, `rounded-xl2`.
- `apps/web/src/index.css` — warm-neutral base (`bg-stone-50`), font stack, global
  `:focus-visible` ring.
- `apps/web/src/components/ui.tsx` — primitives: `Button` (primary/secondary/
  ghost/danger × sm/md), `Card`, `SectionHeader` (numbered `step`), `Badge`,
  `Notice`, `Input`, `Select`, `Field`, `EmptyState`, `Loading`, `NavChips`, `cx`.
- `apps/web/src/components/status.ts` — maps raw enums to Indonesian label + tone
  for attendance, completion, grade/note visibility, KKM, link-code status, and
  workspace labels. No raw enum/log text reaches users.

### Surfaces refactored

- `App.tsx` — branded loading state (logic/sign-out unchanged).
- `AppShell.tsx` — polished sticky header (SOKA + school + active-workspace
  badge), mobile second line so nothing overflows, role switcher when >1
  workspace, sign-out error/retry; **Sprint 007 sign-out behavior preserved**.
- `LoginPanel.tsx` — branded, centered card using `Field`/`Input`/`Notice`.
- `RoleSwitcher.tsx` — segmented, renders only available workspaces.
- `TeacherWorkspace.tsx` + `PapanPagi.tsx` — sticky chip nav; **Papan Pagi order
  preserved** (1 Status Absensi → 2 Pesan Ortu → 3 Siswa Perlu Perhatian → 4
  Jadwal) with numbered headers; attendance progress bar; tone-coloured segmented
  status buttons with a "Tersimpan" badge per student; friendly save states
  (success/warning/danger Notice) instead of a raw status code.
- `TeacherGradesNotes.tsx` — KKM + visibility badges, publish/share buttons,
  subordinate to the morning loop.
- `ParentWorkspace.tsx` + `ParentHome.tsx` — mobile-first; reassurance summary
  card first (green calm / amber needs-action), then calm cards for notifications,
  attendance, nilai, catatan, pesan; chat-style messages; **published-only
  grades/notes preserved**.
- `AdminSetupWorkspace.tsx` — overview with count tiles + a setup checklist
  derived from existing data; guided Card sections; `Field`-based forms with
  hints/validation; link-code lifecycle with status badge + copy/revoke; editable
  cutoff/timezone/KKM. Still admin-only; no full-TU scope.

### Seed enrichment (idempotent, local-dev only)

`packages/db/src/seed.ts` adds `ensureDemoContent` for the existing School A child
**Adinda Putri**: one attendance record (today, Hadir), one published grade
(Matematika — Ulangan Harian 1, 85/100), one published note, and one
parent→teacher message. Each is existence-checked (re-running does not
duplicate). Uses the existing tested service functions (`submitClassAttendance`,
`createGrade`/`publishGrade`, `createStudentNote`/`publishStudentNote`,
`createParentMessage`) — no mock layer, no schema change, no auth bypass.

## Visual QA

Verified with `vite preview` (production build) + Playwright screenshots, mocking
API responses for authenticated views (no live DB needed), at desktop 1366×768
and mobile 390×844:

- Login (desktop + mobile) — centered, warm, branded; no overflow.
- Teacher Papan Pagi (desktop + mobile) — numbered order intact; progress bar;
  attendance status buttons fit 5-per-row on mobile; "Tersimpan" badges.
- Parent home (mobile) — reassurance summary first; calm published-only cards.
- Admin / Setup (desktop) — overview counts + checklist; all six sections; the
  Guru/Admin role switcher renders correctly (an `admin_sekolah` account also has
  the teacher workspace, which is existing behavior — both appear in the switcher).

No text overflow, overlap, broken buttons, unreadable contrast, or dead
navigation observed.

## Validation

- `pnpm install` — ok.
- `pnpm test` — **110/110 passing** (unchanged).
- `pnpm typecheck` — clean across all packages.
- `pnpm --filter @soka/web build` — succeeds (CSS ~18 kB, JS ~185 kB).
- `pnpm validate` — succeeds (exit 0).

## Known Limitations

- Full live end-to-end visual walkthrough (real Better Auth + Neon) was not run in
  the Builder environment; QA used the production build with mocked API responses.
  Ian can run the live walkthrough via `docs/PILOT_SMOKE_CHECKLIST.md`
  (Setup → Scripted smoke → manual paths → Visual walkthrough).
- Admin mobile view was captured but the dense forms are best used on
  desktop/tablet (consistent with the teacher density decision); they remain
  usable and non-overflowing on mobile.

## Explicit Deferrals

No Pengumuman, push, payments, full raport, student login/learning, principal
analytics, full TU/admin module, new backend module, schema/migration, auth/role
change, parent-visibility change, provider deployment automation, UI framework,
or Sprint 011.
