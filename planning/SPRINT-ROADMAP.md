# Sprint Roadmap

Session 9 turns product decisions into buildable sprint order.

## Initial Sprint Order

| Sprint | Name | Purpose |
|---|---|---|
| 001 | Discovery & Architecture | Finalize planning docs, data model, permissions, UX standard, and module classification. |
| 002 | Foundation Data/Auth | Build Neon Postgres baseline, `school_id`, tenant enforcement, Better Auth email/password, school code, memberships, and roles. |
| 003 | Admin Onboarding Minimal | Create school, import students, assign classes/teachers, and invite/link parents. |
| 004 | Guru Daily Loop | Build Papan Pagi, morning attendance, parent messages, and students needing attention. |
| 005 | Parent Trust Loop | Build parent PWA: child home, attendance visibility, notifications, and messages. |
| 006 | Nilai & Catatan | Build basic grades/KKM, qualitative student notes with publication status, and parent visibility. |
| 007 | Pilot Readiness & App Shell | Consolidate the existing MVP slices into a coherent role-aware app shell, setup path, validation gate, and pilot smoke checklist. |
| 008 | Admin Setup UI Hardening | Make existing onboarding APIs usable through a constrained setup surface for first-pilot operations. |
| 009 | TBD | Choose next between live pilot/environment hardening and narrow Pengumuman. |

## Roadmap Principle

Build foundation first, then the adoption wedge, then parent value, then academic/notes expansion.

Do not start implementation from Phase 2 modules, full TU/admin, payments, principal analytics, or old-code migration.

## Artifact Status

| Sprint | Artifact Status |
|---|---|
| 001 | Complete and accepted. |
| 002 | Merged and accepted via PR #1. |
| 003 | Merged and accepted via PR #2. |
| 004 | Merged and accepted via PR #3. |
| 005 | Merged and accepted via PR #4. |
| 006 | Merged and accepted via PR #5. |
| 007 | Merged and accepted via PR #6. |
| 008 | Merged and accepted via PR #7. |
| 009 | Not yet selected or detailed. |

## Initial Roadmap Completion

The initial 001-006 roadmap is complete as of 2026-06-14.

What now exists:

- Foundation data/auth with explicit school membership and role model.
- Minimal school onboarding, classes, students, teacher assignments, and parent link codes.
- Guru daily loop: Papan Pagi, attendance, parent-message scaffold, and notifications.
- Parent trust loop: child home, attendance visibility, notifications, and messages.
- Basic Nilai & Catatan: grades against KKM, draft/published visibility, qualitative notes, and parent-published visibility.

What is still not proven:

- Live Neon + Better Auth HTTP sign-in/session flow in a deployed-like environment.
- Production environment setup, deployment, and CI smoke checks.
- Browser/native push delivery.

## Candidate Next Tracks

| Candidate Sprint | Recommendation | Why |
|---|---|---|
| 007 Pilot Readiness & App Shell | Selected | The core slices exist, but the app still needs to become usable, demoable, and deployable before adding more modules. |
| 008 Admin Setup UI Hardening | Selected | Real schools need easier setup for students, classes, teachers, and parent links. Best after the shell/setup path is stable. |
| 009 Pilot Environment / Live Smoke Hardening | Recommended default | Sprint 008 made setup usable; before adding product breadth, prove live Neon + Better Auth + seed + admin/teacher/parent smoke paths in a deployed-like environment. |
| 009 Pengumuman | Alternative | Useful parent trust feature, but should wait unless the pilot school explicitly needs announcements before environment hardening. |
| 009 Raport / Semester Finalization | Defer | Valuable, but would pull SOKA into heavier academic workflow before the MVP is pilot-hardened. |
