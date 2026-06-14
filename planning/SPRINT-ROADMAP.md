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
- A polished role-aware app shell/navigation for teacher and parent workflows.
- Practical admin setup UI for a real school operator.
- Browser/native push delivery.

## Candidate Next Tracks

| Candidate Sprint | Recommendation | Why |
|---|---|---|
| 007 Pilot Readiness & App Shell | Recommended next | The core slices exist, but the app still needs to become usable, demoable, and deployable before adding more modules. |
| 007 Admin Setup UI Hardening | Good alternative | Real schools need easier setup for students, classes, teachers, and parent links. Best if the immediate goal is onboarding a pilot school. |
| 007 UX Consolidation | Good alternative | The validation UI can become a coherent teacher/parent MVP shell with role-aware navigation and mobile polish. |
| 007 Pengumuman | Later | Useful parent trust feature, but less urgent than making the existing trust loop production-ready. |
| 007 Raport / Semester Finalization | Defer | Valuable, but would pull SOKA into heavier academic workflow before the MVP is pilot-hardened. |
