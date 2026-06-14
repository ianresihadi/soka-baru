# Project State

**Project:** SOKA Baru
**Last updated:** 2026-06-14

## Current Status

Sprint 001: Discovery & Architecture is complete. Sprint 002: Foundation Data/Auth is merged and accepted. Sprint 003: Admin Onboarding Minimal is merged and accepted. Sprint 004: Guru Daily Loop is merged and accepted. Sprint 005: Parent Trust Loop is merged and accepted. Sprint 006: Nilai & Catatan is implemented and validated; it awaits Architect review against `acceptance.md`.

The user approved using `C:\Users\USER\Documents\SOKA` as the new project operating folder, treating SOKA Lama's `docs/SOKA-MAP` as migration material, retiring `docs/SOKA-MAP/` as an active documentation format, and keeping the relic catalog as guardrails only.

## Active Phase

Builder Layer: Sprint 006 Nilai & Catatan implemented and validated. Pending Architect acceptance review. Sprint 006 is the last sprint in the initial 001–006 roadmap.

## Recently Completed

- Reviewed existing SOKA app structure in `C:\Users\USER\Desktop\Cowork Station\Projects\SOKA`.
- Reviewed existing `docs/SOKA-MAP` product map from SOKA Lama.
- Reviewed 120x Operators Kit structure and methodology.
- Extracted text summary from `super_apps_sekolah.pptx`.
- Created initial project operating structure in this folder.
- Recorded the decision to migrate `docs/SOKA-MAP` into the 120x planning structure instead of copying it raw.
- Recorded the decision to keep SOKA-MAP history in `references/SOKA-MAP-MIGRATION.md` instead of recreating `docs/SOKA-MAP/`.
- Recorded the first SOKA-MAP migration order: `30-core-loop.md`, then `00-overview.md`, then `90-relic-catalog.md`.
- Migrated the key working baseline from `30-core-loop.md` into `CONTEXT.md`, `planning/DOMAIN.md`, `planning/DECISIONS.md`, `planning/QUESTIONS.md`, and `planning/RISKS.md`.
- Migrated the key working context from `00-overview.md`: B2B Sekolah, SD swasta menengah, product boundaries, and layered delivery workflow.
- Migrated `90-relic-catalog.md` as guardrails against role sprawl, ghost routes, demo auth, mock data, premature payments, and heavy teacher tools.
- Locked the relic catalog as product guardrails only, not an implementation backlog.
- Completed Session 0: Project Operating System.
- Started Session 1 and confirmed the primary buyer as school owner, foundation, or school leadership.
- Recorded parent premium subscription as a future hypothesis to challenge, not MVP scope.
- Locked the Product North Star: transparent, responsive, orderly school experience for parents without adding teacher admin burden.
- Confirmed wali kelas / guru as the primary daily operator.
- Confirmed morning attendance as the first adoption wedge.
- Confirmed early success metrics around teacher attendance habit and parent engagement.
- Confirmed the MVP boundary: SOKA is not an LMS and not an enterprise SIS.
- Completed Session 1: Product North Star.
- Confirmed MVP role staging: Guru/Wali Kelas and Orang Tua active in MVP; Siswa prepared architecturally for Phase 2.
- Confirmed Kepala Sekolah as post-MVP/backlog, not an active MVP role.
- Confirmed TU/Admin Sekolah is not an active MVP role, while minimal admin capability is required for onboarding.
- Confirmed the seven Guru/Wali Kelas MVP menus.
- Confirmed the five Orang Tua MVP areas.
- Confirmed Catatan Siswa needs publication status before parent visibility.
- Confirmed Catatan Siswa remains qualitative-only with no behavior scoring.
- Confirmed student status labels: Aman, Perhatian, and Kritis, based on objective data only.
- Completed Session 2: Roles and MVP Scope.
- Confirmed the MVP daily loop: Absensi Pagi plus Pesan Ortu, guided by Papan Pagi.
- Confirmed the Papan Pagi order.
- Confirmed attendance push notifications only for Sakit, Izin, Alpa, and Terlambat; Hadir is visible without mandatory push.
- Confirmed morning attendance cutoff is configurable per school.
- Confirmed five MVP attendance statuses: Hadir, Sakit, Izin, Alpa, and Terlambat.
- Confirmed attendance correction flow: same-day edits allowed; post-day corrections require a reason and audit trail.
- Confirmed parent messages should not have a formal SLA in MVP.
- Confirmed Siswa Perlu Perhatian triggers: Alpa today, Terlambat today, or status Perhatian/Kritis.
- Completed Session 3: Core Daily Loop.
- Confirmed Session 4 module classification labels: Now, Later, Never, and Rebuild Fresh.
- Classified Absensi as Now.
- Classified Pesan Ortu as Now and Pengumuman kelas/sekolah as Later.
- Classified nilai dasar / nilai terhadap KKM as Now and full raport finalization as Later.
- Classified core transactional notifications as Now and complex broadcast/campaign notifications as Later.
- Classified Catatan Siswa kualitatif with publish status as Now, and case-management/intervention/BK SLA workflows as Never for MVP.
- Classified Pembayaran / SPP online as Later.
- Classified admin onboarding minimal as Now and full TU module as Later.
- Classified leadership sales/reporting and principal analytics as Later, and teacher KPI/evaluation as Never for MVP.
- Classified Tugas Digital and Repositori Materi as Rebuild Fresh / Later.
- Classified Ekskul as Later, Bank Soal as Later/Never for MVP, and Forum Diskusi plus Laporan Instansi as Never for MVP.
- Completed Session 4: Module Classification.
- Confirmed multi-tenant baseline: shared database with per-school data ownership/isolation using `school_id` and RLS.
- Confirmed auth baseline: email/password with unique school code for initial `school_id` binding.
- Confirmed multi-role user model through school memberships and role assignments.
- Confirmed parent-student linking through school-created invitations/link codes, not free self-claim.
- Confirmed MVP core data entities.
- Confirmed `school_settings` owns per-school configurable rules with SOKA defaults.
- Confirmed lightweight audit/history scope for trust-sensitive records.
- Completed Session 5: Data, Auth, and Multi-Tenant Architecture.
- Confirmed platform baseline: Guru/Wali Kelas web dashboard first, Orang Tua mobile-first, Siswa Phase 2.
- Confirmed parent experience starts as PWA/mobile web, designed for later Capacitor wrapping.
- Confirmed Guru/Wali Kelas dashboard is desktop/tablet-first with responsive mobile fallback.
- Confirmed staged notification delivery: in-app required, browser push best-effort, native push later with Capacitor/Play Store.
- Completed Session 6: Web and Mobile Strategy.
- Confirmed SOKA Lama will not be migrated wholesale; old code must be classified before salvage.
- Confirmed first salvage classification area: Wali Kelas/Guru MVP screens.
- Confirmed default Wali Kelas/Guru salvage stance: Keep Concept / Rebuild Fresh, not Migrate Code.
- Completed Session 7: Existing Code Salvage Plan.
- Confirmed SOKA Baru UX/visual principle: hangat, ramah, tertib, dan operasional.
- Confirmed Guru/Wali Kelas dashboard should be task-first, not KPI-first.
- Confirmed parent experience should be reassurance-first, not data-dump.
- Confirmed role density rule: dense-but-calm for Guru/Wali Kelas, simple-card summaries for Orang Tua.
- Completed Session 8: UX and Visual Standard.
- Confirmed initial sprint order from 001 through 006.
- Confirmed Sprint 001 is nearly complete after documentation cleanup.
- Created Sprint 002 starter artifacts for Foundation Data/Auth.
- Created skeleton sprint artifacts for Sprints 003-006.
- Completed Session 9: Sprint Roadmap.
- Completed final Sprint 001 documentation sanity pass.
- Confirmed remaining open question is intentional: future parent premium hypothesis.
- Confirmed the Sprint 002 stack baseline: React/Vite/TypeScript/Tailwind frontend, Hono custom API, Drizzle ORM, Better Auth, and Neon Postgres.
- Detailed the Sprint 002 blueprint with implementation slices for scaffold, database/migrations, auth, school binding, tenant enforcement, seed data, validation, API surface, and documentation duties.
- Detailed the Sprint 002 Builder handoff prompt with the required read order, approved stack, pre-edit summary, build scope, data rules, validation scenario, out-of-scope boundaries, and definition of done.
- Created `planning/ARCHITECT-BUILDER-RUNBOOK.md` to define the 120x execution flow between Codex as Architect and Claude as Builder.
- Created `planning/sprints/002-foundation-data-auth/claude-start-prompt.md` as the ready-to-paste Claude entry prompt for Sprint 002.
- Updated `CLAUDE.md` so Claude starts from the runbook and active sprint handoff.

## Sprint 002 Build Notes (Builder)

- Scaffolded a pnpm monorepo: `apps/api` (Hono), `apps/web` (React/Vite/Tailwind validation UI), `packages/db` (Drizzle), `packages/auth` (Better Auth), `packages/shared` (roles/types/zod).
- Drizzle schema + generated migration for Better Auth tables (`user`, `session`, `account`, `verification`) and SOKA foundation tables (`schools`, `school_memberships`, `membership_roles`).
- Better Auth email/password wired via the Drizzle adapter against the shared Neon database.
- `school_code` binding implemented (`POST /school-bindings/by-code` + `bindUserToSchoolByCode`); `school_id` derived server-side from the school lookup, not client input. The public endpoint only allows self-assigning non-privileged roles (`orang_tua`); privileged roles stay in seed/internal code.
- Tenant isolation enforced in the service/query layer via `getActiveTenantContext`, tenant-aware repositories, `assertSameTenant`, and `requireAuth`/`requireMembership`/`requireRole` middleware.
- Postgres RLS deferred with documented reason (see `docs/PERMISSIONS.md` and `planning/DECISIONS.md`).
- Validation: 17 automated tests pass (in-process PGlite + real migrations), including proof that a client cannot self-assign privileged roles via the public binding endpoint; `pnpm typecheck` clean across all packages; `apps/web` builds.
- Seed script for School A, School B, and a multi-role user (local-dev credentials only).
- Architect accepted Sprint 002 after PR #1 merge. Re-review verified `pnpm@10.33.0 install --frozen-lockfile`, API tests passing 17/17, typecheck clean, and web build successful.
- Detailed Sprint 003 requirements, blueprint, acceptance criteria, handoff prompt, and Claude start prompt.

## Sprint 003 Build Notes (Builder)

- Added onboarding tables (migration `0001_*`): `classes`, `students`, `teacher_assignments`, `parent_link_codes`, `parent_student_links`, `audit_events` — all carry `school_id`.
- Added onboarding service layer `packages/db/src/onboarding.ts` with tenant-ownership checks before trusting any client-supplied foreign key.
- Added admin onboarding API routes (`/admin/*`) and parent routes (`/parent-links/redeem`, `/me/children`).
- School creation restricted to `soka_internal`; other onboarding requires `admin_sekolah`/`soka_internal`, scoped to the caller's school.
- Parent link codes: single-use, default 14-day expiry, Crockford Base32, lazy expiry check; redemption is a server-controlled path that grants `orang_tua` and creates the parent-student link. Redemption is atomically single-use (transaction + conditional `active -> used` claim) so concurrent redeems cannot double-link.
- School creation + admin binding run in one transaction; an invalid `adminUserId` aborts before any school is created (`404 admin_user_not_found`).
- Lightweight audit via `audit_events` for parent-link-code and parent-link create events.
- Validation: 42 tests pass (17 tenant + 25 onboarding); `pnpm typecheck` clean; `apps/web` builds.
- Architect review fixes applied: branch rebased on latest main preserving Architect Sprint 003 handoff docs; atomic single-use redemption; transactional safe school creation.
- Architect accepted Sprint 003 after PR #2 merge. Re-review verified branch ancestry, preserved handoff docs, transactional school creation, atomic parent-code redemption, 42 API tests, typecheck, and web build.

## Sprint 004 Handoff Notes (Architect)

- Detailed Sprint 004 requirements, blueprint, acceptance criteria, handoff prompt, and Claude start prompt.
- Sprint 004 scope is backend-first plus minimal teacher validation UI: `school_settings`, `attendance_records`, minimal parent-message scaffold, `notifications`, Papan Pagi API, attendance submit/upsert API, teacher access checks, and focused tests.
- Papan Pagi order remains fixed: Status Absensi Hari Ini, Pesan Ortu Belum Dibalas, Siswa Perlu Perhatian, Jadwal Mengajar Hari Ini.
- Attendance statuses remain exactly: `hadir`, `sakit`, `izin`, `alpa`, `terlambat`.
- Notification records are required for `sakit`, `izin`, `alpa`, and `terlambat`; `hadir` must not create required daily notification records.
- Sprint 004 explicitly defers full parent PWA polish, full chat, broadcast announcements, formal message SLA, grades/raport, student notes, principal analytics, payments, LMS, and push delivery.

## Sprint 004 Build Notes (Builder)

- Added daily-loop tables (migration `0002_*`): `school_settings` (with `school_timezone`), `attendance_records`, `message_threads`, `messages`, `notifications`; added `students.objective_status`.
- Added service layer `packages/db/src/dailyLoop.ts`: settings, teacher class access, attendance upsert + corrections + audit, notifications, Papan Pagi, parent messages, notification listing.
- Attendance cutoff treated as school-local wall-clock (Architect correction): `school_timezone` default `Asia/Jakarta`; completion on-time/late computed via a timezone-aware cutoff helper with injectable `now`. No UTC hardcoded as business rule.
- Added teacher/admin/parent API routes (`/guru/*`, `/admin/school-settings`, `/parent/messages`, `/me/notifications`); `orang_tua` blocked from `/guru/*`.
- Notifications: created only for `sakit`/`izin`/`alpa`/`terlambat` (never `hadir`), deduped per student/date/status; in-app rows only (no push).
- Parent-message scaffold (thread + messages), unreplied = parent message newer than last teacher reply; reply clears it. Not a chat product.
- Minimal teacher UI in `apps/web` (Papan Pagi panel: 4 sections in order + attendance capture using the class roster returned by Papan Pagi).
- Validation: 62 tests pass (17 tenant + 25 onboarding + 20 daily-loop); `pnpm typecheck` clean; `apps/web` builds. (Includes Architect PR #3 fix: `schoolTimezone` validated before save.)
- Architect accepted Sprint 004 after PR #3 merge. Re-review verified branch ancestry, timezone validation fix, 62 API tests, typecheck, and web build.

## Sprint 005 Handoff Notes (Architect)

- Detailed Sprint 005 requirements, blueprint, acceptance criteria, handoff prompt, and Claude start prompt.
- Sprint 005 scope is the parent trust loop: linked child list/switching, Beranda Anak aggregate, attendance visibility/history, in-app notification center/read state, parent message thread list/detail/send, and mobile-first parent validation UI.
- Parent access must come only from `parent_student_links` and the caller's memberships. No route may trust client-supplied `school_id`.
- Sprint 005 explicitly defers grades/raport, student notes, payments, parent premium, assignments, materials, forum/social features, native/browser push delivery, full chat polish, and Sprint 006 work.

## Sprint 005 Build Notes (Builder)

- No new migration: reused Sprint 003/004 schema (`parent_student_links`, `students`, `classes`, `attendance_records`, `notifications.read_at`, `message_threads`, `messages`).
- Added `packages/db/src/parentTrust.ts`: linked children (deterministic order), `assertParentCanAccessStudent`, Beranda Anak aggregate, read-only attendance history, notifications list + mark-read (returns true updated count), message thread list/detail. Reused `createParentMessage`/`listNotificationsForUser`.
- Added parent API routes (`/parent/children|home|attendance|notifications|notifications/read|messages/threads|messages/threads/:id`); `requireAuth` only, access via `parent_student_links` + memberships; default + max list limits.
- Beranda Anak `reassurance` is a simple non-scoring summary (`headline`, `needsAction`, `reasons`); unrecorded attendance is neutral, never treated as alpa.
- Added mobile-first parent UI (`apps/web` Teacher|Parent tab + `ParentHome.tsx`): child switcher, Beranda summary, notifications + mark-read, attendance history, message thread/detail/send.
- Validation: 79 tests pass (17 tenant + 25 onboarding + 20 daily-loop + 17 parent-trust); `pnpm typecheck` clean; `apps/web` builds. (Includes Architect PR #4 fix: `needsAction` detects any unread notification, not just the latest.)
- Architect accepted Sprint 005 after PR #4 merge. Re-review verified the unread-notification fix, 79 API tests, typecheck, and web build.

## Sprint 006 Handoff Notes (Architect)

- Detailed Sprint 006 requirements, blueprint, acceptance criteria, handoff prompt, and Claude start prompt.
- Sprint 006 scope is basic Nilai & Catatan: grade records against KKM, draft/published grade visibility, parent published-grade visibility, qualitative student notes, internal/published note visibility, publish notifications, and lightweight audit for trust-sensitive changes.
- Sprint 006 should add `grades` and `student_notes` tables, and may extend `school_settings` with `default_kkm`.
- Grade records are basic academic records, not full raport. They should support KKM comparison and parent visibility only after publication.
- Catatan Siswa remains qualitative-only. Internal notes must never be visible to parents; only published/shared notes appear in parent surfaces.
- Qualitative notes must never mutate `students.objective_status` or create behavior points, ranking, leaderboard, or hidden risk scoring.
- Sprint 006 explicitly defers full raport finalization, semester locking, print/export, approvals, formulas/averages/ranking, intervention/BK workflows, assignments/materials/student login, payments, premium, forum, broadcast campaigns, push delivery, and Sprint 007 work.

## Sprint 006 Build Notes (Builder)

- Added `grades` and `student_notes` tables (migration `0003_*`) and extended `school_settings` with `default_kkm` (default 75). No raport/averages/ranking/scoring tables.
- Added `packages/db/src/academicRecords.ts`: grade create/update/publish + teacher/parent lists + KKM summary; note create/update/publish/unpublish + teacher/parent lists.
- KKM is percentage-based per Architect correction: `isBelowKkm = (score/maxScore)*100 < kkm`; KKM stored per grade (default from settings when omitted).
- Grades default `draft`, notes default `internal`; parent endpoints return published-only. Publish notifies linked parents once (idempotent); post-publish grade edits audited (`grade.updated`) without re-notifying; note publish/unpublish/published-update audited. Notes never touch `objective_status`.
- Teacher/admin routes class-scoped (reuse `assertCanOperateClass`); parent routes session-only via `parent_student_links`. No client `school_id` trusted.
- Minimal UI: teacher `TeacherGradesNotes` panel in Papan Pagi (grade/note entry + publish/unpublish); parent grades + published notes cards in `ParentHome`.
- Validation: 96 tests pass (17 tenant + 25 onboarding + 20 daily-loop + 17 parent-trust + 17 academic-records); `pnpm typecheck` clean; `apps/web` builds.

## Next Actions

- Architect reviews Sprint 006 output against `planning/sprints/006-nilai-catatan/acceptance.md`.
- Sprint 006 completes the initial 001–006 roadmap; next sprint scope (007+) is an Architect decision.
- Optional follow-up: run `pnpm db:migrate` + `pnpm db:seed` against a live Neon `DATABASE_URL` to exercise the full Better Auth HTTP flow end-to-end.

## Blockers

- None blocking. Note: the full Better Auth HTTP sign-in/session flow was not exercised against a live Postgres in this environment (no `DATABASE_URL`); business logic is covered by in-process tests, and the live path is documented for verification. School-timezone handling is limited to cutoff comparison; a full timezone UI is intentionally deferred. Teacher account/membership creation still has no admin UI (internal/seed binding); Sprint 004 assigns existing teacher memberships to classes only.
