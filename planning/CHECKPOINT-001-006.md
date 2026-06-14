# Architect Checkpoint 001-006

**Date:** 2026-06-14
**Status:** Initial roadmap complete

## Summary

SOKA Baru has completed the initial 001-006 roadmap:

- 001 Discovery & Architecture
- 002 Foundation Data/Auth
- 003 Admin Onboarding Minimal
- 004 Guru Daily Loop
- 005 Parent Trust Loop
- 006 Nilai & Catatan

The product now has a working MVP backbone: school-owned tenant data, explicit memberships and roles, minimal onboarding, teacher daily loop, parent trust loop, and basic academic/note visibility.

## Proven So Far

- Backend service/query layer enforces tenant isolation from server-resolved membership context.
- Parent access is derived from `parent_student_links`, not client-supplied `school_id`.
- Public binding cannot self-assign privileged roles.
- Parent link redemption is atomically single-use.
- Attendance correction, grade publication, and note publication have lightweight audit behavior where required.
- Published-only boundaries are in place for parent grade/note visibility.
- Concurrency-sensitive publish flows are conditionally claimed so notifications/audits are not duplicated.
- Current validation spine: 100 API tests, clean typecheck, and successful web build as of Sprint 006 PR #5.

## Not Yet Pilot-Ready

The app should not yet be treated as ready for a real school pilot without another hardening sprint.

Remaining gaps:

- Live Neon `DATABASE_URL` migration/seed verification.
- Full Better Auth HTTP sign-in/session flow against a live Postgres database.
- Production-like environment variables and deployment checklist.
- CI/smoke checks around install, typecheck, tests, migration generation, and web build.
- Coherent role-aware app shell/navigation beyond validation panels.
- Practical admin setup UI for school/class/student/teacher/parent-link onboarding.
- Real browser/native push delivery remains deferred; in-app notifications are the current MVP baseline.

## Recommended Sprint 007

Recommended next sprint: **Pilot Readiness & App Shell**.

Purpose:

- Turn the already-built 001-006 slices into a coherent product surface.
- Verify the live technical path before more modules are added.
- Prepare the app for an internal demo or first controlled school pilot.

Likely scope:

- Role-aware app shell for Guru/Wali Kelas and Orang Tua.
- Basic login/session verification in a deployed-like local/live database path.
- Demo/seed flow that supports repeatable pilot testing.
- Environment and deployment documentation.
- CI or one-command validation script for the current quality gate.
- Smoke-test checklist for teacher and parent happy paths.

Out of scope for Sprint 007 unless explicitly reversed:

- Full raport/finalization.
- Payments or parent premium.
- Student login, assignments, or materials.
- Full TU/admin module.
- Principal analytics.
- Broadcast/campaign notification platform.
- Native/mobile push delivery.

## Alternative Next Tracks

If Ian wants a different immediate outcome, the next sprint can instead focus on:

- **Admin Setup UI Hardening** if the first pilot needs school setup by a non-technical operator.
- **UX Consolidation** if the immediate goal is a polished demoable interface.
- **Pengumuman** if parent broadcast communication becomes a sales requirement.

Architect recommendation remains: harden pilot readiness before expanding module breadth.
