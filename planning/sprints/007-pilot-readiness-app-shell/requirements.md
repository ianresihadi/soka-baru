# Sprint 007 Requirements: Pilot Readiness & App Shell

## Goal

Turn the completed 001-006 MVP backbone into a coherent, demoable, and pilot-ready
application surface without adding a new product module.

Sprint 007 should make SOKA Baru easier to run, verify, and show to a first
controlled school pilot:

- a role-aware app shell replaces the raw validation UI as the first experience
- Guru/Wali Kelas and Orang Tua workflows are easier to navigate
- login/session behavior is clearer for local/live database testing
- demo/seed and environment setup are documented and repeatable
- validation can be run with a single documented quality gate
- a manual smoke checklist exists for the teacher and parent happy paths

This sprint is about readiness and coherence. It must not expand the product
into new modules such as announcements, payments, full admin/TU, full raport,
student login, assignments, materials, principal analytics, or push delivery.

## Product Context

The initial 001-006 roadmap is complete:

- foundation data/auth
- minimal onboarding
- teacher daily loop
- parent trust loop
- basic grades and qualitative notes

The code now has working vertical slices, but the web UI is still mostly a
validation surface. A first pilot school should not be introduced to raw
diagnostic panels, unclear role switching, or undocumented environment setup.

Sprint 007 prepares the product for controlled internal demos and first-school
pilot rehearsal before adding module breadth.

## Users

Primary users in scope:

- `wali_kelas`
- `guru`
- `orang_tua`

Supporting roles in scope only where already supported:

- `admin_sekolah`
- `soka_internal`

Roles still out of active product scope:

- `siswa`
- `kepala_sekolah`
- full TU/operator workflows

## In Scope

### 1. Role-Aware App Shell

Create a real application shell for `apps/web`:

- authenticated session state
- clear sign-in state
- membership/role loading
- role switcher if the signed-in user has more than one usable role
- top-level navigation for existing MVP surfaces only
- loading, empty, and error states that are understandable to a school user

The shell should make the app feel like SOKA, not like a test console.

Allowed top-level surfaces:

- Guru/Wali Kelas: Papan Pagi, Absensi, Nilai & Catatan, Pesan Ortu if already
  supported by existing endpoints/UI
- Orang Tua: Beranda Anak, Absensi, Nilai, Catatan, Pesan Guru, Notifikasi if
  already supported by existing endpoints/UI

It is acceptable to keep some surfaces as sections inside existing components if
that is the smallest safe change. Do not invent unavailable backend workflows.

### 2. Login And Session Clarity

Improve the local/live auth flow enough for pilot rehearsal:

- sign-in form is clearly separated from the logged-in app
- signed-in user and school membership are visible in the shell
- sign-out is available if Better Auth route support is already practical
- unauthenticated API states are handled gracefully
- raw API request logs are not the main experience

If sign-out cannot be implemented cleanly with the existing Better Auth wiring,
document the limitation and do not invent a custom auth bypass.

### 3. Pilot Demo Data Path

Make the demo/seed path repeatable and documented.

Builder should inspect existing seed behavior and then improve only what is
needed for a first pilot rehearsal:

- document exact local setup commands
- document required `.env` values
- document which seeded users/roles exist and what they can test
- ensure the seed path supports at least one teacher and one parent happy path
  across the existing 001-006 workflows

If code changes to seed data are needed, keep them small and deterministic.

### 4. One Quality Gate

Add or document one command path that represents the current quality gate.

Minimum gate:

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm --filter @soka/web build
```

It is acceptable to add a root script such as `pnpm validate` if it cleanly
wraps existing commands. Do not add a heavy build system such as Turborepo/Nx.

### 5. Pilot Smoke Checklist

Create a manual smoke checklist for local or live pilot rehearsal.

The checklist should cover:

- teacher sign-in
- teacher sees assigned class
- teacher records attendance
- parent sign-in
- parent sees linked child
- parent sees attendance result
- teacher creates/publishes a grade
- parent sees published grade
- teacher creates/publishes a note
- parent sees published note
- parent sends a message
- teacher sees/replies to parent message if existing UI/API supports it

The checklist should name exact routes/pages/components and expected outcomes.

### 6. Documentation Cleanup

Update durable docs so a future Builder does not treat Sprint 007 as a new
feature module.

Required docs:

- `docs/SETUP.md` or equivalent local setup/pilot runbook
- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/007-pilot-readiness-app-shell/completion-notes.md`

Update `docs/API.md`, `docs/PERMISSIONS.md`, or `docs/UX_VISUAL_STANDARD.md`
only if Sprint 007 changes behavior that those docs describe.

## Out Of Scope

- New product modules.
- Pengumuman / broadcast announcements.
- Full admin/TU onboarding UI.
- Full raport finalization, semester locking, print/export, approvals, averages,
  rankings, or formulas.
- Student login, assignments, materials, submissions, LMS workflows, or Phase 2
  learning ecosystem.
- Payments, parent premium subscription, finance, invoices, or receipts.
- Kepala Sekolah/principal analytics.
- Browser push, native push, Capacitor wrapping, Play Store packaging.
- Real production deployment automation beyond documentation and smoke checks.
- Replacing Better Auth or changing the auth provider.
- Replacing Neon/Postgres baseline or reintroducing Supabase.

## Required Documentation Updates By Builder

Builder must update these after implementation:

- `docs/VALIDATION.md`
- `planning/STATE.md`
- `planning/sprints/007-pilot-readiness-app-shell/completion-notes.md`

Builder should add:

- `docs/SETUP.md` if no equivalent setup/pilot runbook exists
- `docs/PILOT_SMOKE_CHECKLIST.md` if the checklist is clearer as a separate file

Builder must update `planning/DECISIONS.md` only if it introduces a durable
product or architecture decision not already captured here.
