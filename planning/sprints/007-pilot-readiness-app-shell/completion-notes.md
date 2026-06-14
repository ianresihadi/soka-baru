# Sprint 007 Completion Notes: Pilot Readiness & App Shell

Status: Merged and accepted via PR #6.

## App shell changes

- Replaced the Sprint 002 "Foundation Validation" console (`apps/web/src/App.tsx`)
  with a session-aware root. `App.tsx` now resolves the session first
  (`GET /me`): unauthenticated users see `LoginPanel`; authenticated users get
  `AppShell`. Raw API request logs and the tenant-check diagnostic buttons are no
  longer part of the UI.
- New components: `AppShell.tsx` (header with school/role context + sign-out,
  workspace routing, empty state), `LoginPanel.tsx` (sign-in surface + clear
  errors), `RoleSwitcher.tsx` (Guru/Orang Tua context toggle), `TeacherWorkspace.tsx`,
  `ParentWorkspace.tsx`, and `api.ts` (typed session/membership/sign-in/sign-out
  client + role→workspace derivation).
- Loading state ("Memuat…"), unauthenticated state (sign-in), and a clear empty
  state ("Belum ada akses ruang kerja") for users with no supported role.

## Role/session handling behavior

- Workspaces derived from `GET /me/memberships`: teacher workspace for
  `guru | wali_kelas | admin_sekolah | soka_internal`; parent workspace for
  `orang_tua`. Users with both get the `RoleSwitcher`; single-role users go
  straight to their workspace.
- Sign-in via `POST /api/auth/sign-in/email`; errors shown plainly (e.g. wrong
  credentials). Unauthenticated API responses (401) resolve to the sign-in
  surface rather than raw output.
- **Sign-out is real**: `POST /api/auth/sign-out` (Better Auth's supported route),
  which clears the server session. No client-only fake sign-out.
- Header shows school name + roles (membership context) and the signed-in email
  when known from this session's login.

## Teacher workspace changes

- `TeacherWorkspace` wraps the existing `PapanPagi` (Papan Pagi 4 sections +
  attendance capture + embedded `TeacherGradesNotes`). Added a section nav whose
  anchors point only to real sections: Papan Pagi (`#papan-pagi`), Absensi
  (`#absensi`), Nilai & Catatan (`#nilai-catatan`), Pesan Ortu (`#pesan-ortu`).
- "Pesan Ortu" anchors to the existing **Pesan Ortu Belum Dibalas** status section
  (no full teacher reply UI was built; the reply API at
  `POST /guru/messages/:threadId/reply` already exists). No dead routes.
- Anchor `id`s added to `PapanPagi.tsx`; no behavior changes.

## Parent workspace changes

- `ParentWorkspace` wraps the existing mobile-first `ParentHome`. Added a compact
  chip nav (only shown when a child is selected) anchoring to real sections:
  Beranda, Absensi, Nilai, Catatan, Pesan, Notifikasi.
- Parent visibility rules unchanged: parent surfaces still call the published-only
  `/parent/*` endpoints. Draft grades and internal notes never appear. No change
  to any parent endpoint or query.

## Setup/smoke docs added

- `docs/SETUP.md` — local/live runbook: prerequisites, `.env` values, install,
  offline checks, live DB migrate/seed, dev servers, seeded demo accounts table,
  and limitations (in-app notifications only, no admin UI).
- `docs/PILOT_SMOKE_CHECKLIST.md` — 21-step teacher+parent happy path naming exact
  routes/components/anchors and expected outcomes; explicitly states no
  browser/native push.

## Script changes

- Added root `package.json` script: `validate` =
  `pnpm test && pnpm typecheck && pnpm --filter @soka/web build` (no `install`
  inside). No Turborepo/Nx or new test runner.

## Seed change (deterministic, idempotent, local-dev only)

- Extended `packages/db/src/seed.ts` so School A has a teacher and parent happy
  path: class **Kelas 1A**, students **Adinda Putri / Bagas Pratama / Citra
  Lestari**, `guru.a` assigned as `wali_kelas`, and `multi@example.com` linked as
  `orang_tua` of **Adinda Putri**. All inserts use existence checks /
  `onConflictDoNothing`, so re-running is safe. The parent link is created on the
  server side (reusing the tested link path), not via client self-claim. No new
  credentials beyond the existing local-dev accounts. **No schema/migration.**

## Validation run / final test count

```bash
pnpm install                   # ok
pnpm validate                  # ok
#  → pnpm test:      100/100 passing
#  → pnpm typecheck: clean (all packages, incl. apps/web shell)
#  → web build:      succeeds
```

Backend test count unchanged at **100** (no backend behavior changed). The seed
extension reuses already-tested repository functions and is exercised manually via
`pnpm db:seed` + the smoke checklist (live DB not available in this environment;
in-process PGlite tests cover the underlying logic).

## Documentation updated

- Added `docs/SETUP.md`, `docs/PILOT_SMOKE_CHECKLIST.md`.
- Updated `docs/VALIDATION.md` (Sprint 007 quality gate + results), `README.md`
  (app-shell description, `pnpm validate`, links to setup/smoke docs),
  `planning/STATE.md` (Sprint 007 build notes).
- `docs/API.md`, `docs/PERMISSIONS.md`, `docs/UX_VISUAL_STANDARD.md` unchanged —
  no behavior they describe changed.
- `planning/DECISIONS.md` unchanged — no new durable product/architecture decision
  beyond what the sprint plan already captured.

## Architect review fixes (PR #6)

- P2 (sign-out): `App.tsx` now only clears local authenticated state when
  `signOut()` returns `true` (server session actually cleared). On failure it
  keeps the user in the authenticated shell and shows a clear error
  ("Gagal keluar. Sesi masih aktif — coba lagi.") with a retry, and the Keluar
  button shows an in-progress/disabled state. No client-only fake sign-out.
- Re-ran `pnpm test` (100/100), `pnpm typecheck` (clean), `pnpm --filter
  @soka/web build` (ok), `pnpm validate` (ok).

## Explicit deferrals

No new modules. Not built: Pengumuman/broadcast, full admin/TU UI, full
raport/finalization, payments/parent premium/finance, student login/assignments/
materials/LMS, principal analytics, browser/native push or Capacitor, provider
replacement, wholesale SOKA Lama migration, Sprint 008. A full teacher reply UI
for Pesan Ortu was intentionally not built (status section + existing reply API
only). Live Neon/Better Auth HTTP verification remains a documented manual step.
