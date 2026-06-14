# Sprint 007 Acceptance Criteria

Sprint 007 is complete when all criteria below are met.

## App Shell

- `apps/web` no longer presents the raw "Foundation Validation" console as the
  primary first screen.
- Unauthenticated users see a clear sign-in surface.
- Authenticated users can load their membership context.
- Supported roles are detected from memberships and links:
  - teacher workspace for `guru`, `wali_kelas`, `admin_sekolah`, or
    `soka_internal` where applicable
  - parent workspace for `orang_tua`
- Users with more than one supported role can switch context clearly.
- Users with no supported membership or no linked child see a useful empty
  state, not raw JSON/log output.

## Teacher Workspace

- Teacher workspace exposes the existing Papan Pagi / attendance workflow.
- Teacher workspace exposes existing Nilai & Catatan validation workflow.
- Teacher navigation does not include dead menu items for unavailable modules.
- Teacher UI remains task-first and dense-but-calm.

## Parent Workspace

- Parent workspace exposes existing Beranda Anak, attendance, notifications,
  grades, notes, and messages where already supported.
- Parent navigation or section layout is mobile-first and reassurance-first.
- Parent UI does not expose internal teacher/admin information.
- Parent UI does not show draft grades or internal notes.

## Login And Session Handling

- Sign-in errors are shown clearly.
- Unauthenticated API responses are handled gracefully.
- Signed-in state and membership context are visible enough for pilot rehearsal.
- If sign-out is implemented, it uses the real auth route and clears server
  session state. If not implemented, the limitation is documented.

## Setup And Demo Path

- `docs/SETUP.md` or equivalent documents:
  - Node/pnpm expectation
  - `.env` setup
  - database migration
  - seed command
  - API dev server
  - web dev server
  - known local URLs
- Seed/demo documentation identifies available local-dev users and what each can
  test, if seed users exist.
- No production credentials are added.
- Local demo credentials are clearly marked local-dev/pilot rehearsal only.

## Pilot Smoke Checklist

- `docs/PILOT_SMOKE_CHECKLIST.md` exists.
- It covers teacher sign-in, class loading, attendance, parent sign-in, linked
  child visibility, parent attendance visibility, grade publish/parent view,
  note publish/parent view, and parent message flow where supported.
- It does not claim browser/native push is available.

## Validation

Before opening the PR, Builder must run:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
```

If a `pnpm validate` script is added, Builder must run it too or document why it
duplicates the commands above.

Expected baseline:

- Existing 100 API tests remain green unless Builder adds focused tests.
- Typecheck is clean.
- Web build succeeds.

## Documentation

- `docs/VALIDATION.md` documents the Sprint 007 quality gate and smoke checklist.
- `planning/STATE.md` records Sprint 007 build status.
- `planning/sprints/007-pilot-readiness-app-shell/completion-notes.md` records
  what changed, what was validated, and what remains deferred.
- `docs/API.md`, `docs/PERMISSIONS.md`, and `docs/UX_VISUAL_STANDARD.md` are
  updated only if Sprint 007 changes relevant behavior.

## Scope Guardrails

Sprint 007 must not include:

- new modules
- Pengumuman/broadcast
- full admin/TU UI
- full raport
- payments or parent premium
- student login or learning workflows
- principal analytics
- push delivery
- provider replacement
- SOKA Lama wholesale code migration

## Architect Acceptance Gate

Sprint 007 should not be accepted until Architect verifies:

- the app shell is coherent and not just renamed validation UI
- parent visibility boundaries from Sprints 005-006 remain intact
- all required validation commands pass
- setup/smoke docs are actionable
- no new module scope entered
