# Project State

**Project:** SOKA Baru
**Last updated:** 2026-06-15

## Current Status

Sprint 001: Discovery & Architecture is complete. Sprint 002: Foundation Data/Auth is merged and accepted. Sprint 003: Admin Onboarding Minimal is merged and accepted. Sprint 004: Guru Daily Loop is merged and accepted. Sprint 005: Parent Trust Loop is merged and accepted. Sprint 006: Nilai & Catatan is merged and accepted. The initial 001-006 roadmap is complete. Sprint 007: Pilot Readiness & App Shell is merged and accepted. Sprint 008: Admin Setup UI Hardening is merged and accepted via PR #7. Sprint 009: Pilot Environment / Live Smoke Hardening is implemented by Builder on branch `claude/sprint-009-live-smoke` and ready for Architect review (PR not yet opened).

The user approved using `C:\Users\USER\Documents\SOKA` as the new project operating folder, treating SOKA Lama's `docs/SOKA-MAP` as migration material, retiring `docs/SOKA-MAP/` as an active documentation format, and keeping the relic catalog as guardrails only.

## Active Phase

Builder Layer: Sprint 009 Pilot Environment / Live Smoke Hardening is implemented on branch `claude/sprint-009-live-smoke` and awaiting Architect review. Ian approved the pre-edit plan with guardrails (guarded non-overwrite `.env` autoload; `check:env` fails on missing/placeholder; `smoke:live` manual cookie jar with `getSetCookie` fallback and classified failures; `validate` story documented for Windows/Corepack; no schema/module/auth changes). No PR opened yet.

## Sprint 009 Build Notes (Builder)

- Added a dependency-free `.env` autoload (`packages/db/src/loadEnv.ts`, exported from `@soka/db`) wired into the live entrypoints: `apps/api/src/index.ts` (loads env, then dynamically imports `@soka/auth`/`@soka/db`/`./app` so env is set before the eager `getDb()` in auth), `packages/db/src/migrate.ts`, and `packages/db/src/seed.ts` (loads env before dynamically importing `@soka/auth`). Never overwrites already-set real env vars; no-op when no `.env`. This fixes the previously broken documented live path (nothing loaded `.env`).
- Added `scripts/load-env.mjs` (shared loader for the Node scripts), `scripts/check-env.mjs` (`pnpm check:env`), and `scripts/live-smoke.mjs` (`pnpm smoke:live`); refreshed `scripts/README.md`. Added `check:env` and `smoke:live` package scripts. No new dependency (Node built-in `fetch`/`fs`).
- `check:env`: validates `DATABASE_URL`/`BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`/`WEB_ORIGIN` (FAIL on missing or `.env.example` placeholder, or short secret), warns on optional `PORT`/`SOKA_API_URL`/`SOKA_WEB_URL`, never prints secret values, exits non-zero on failure.
- `smoke:live`: health → admin Better Auth sign-in (manual cookie jar via `headers.getSetCookie()` + raw-header fallback) → `/me` → `/me/memberships` (admin_sekolah) → `/admin/memberships` → sign-out → `/me` 401, then optional `guru.a` `/guru/classes` and `multi@` `/parent/children`. Read-only apart from auth session rows; classified failures (API down / seed missing / wrong creds / auth-cookie / permission).
- `pnpm validate` left unchanged; Windows/Corepack fix (`corepack enable` + `corepack prepare pnpm@10.33.0 --activate`) documented in `docs/SETUP.md`, `scripts/README.md`, and `docs/VALIDATION.md`.
- No schema/migration, no new module, no auth bypass, no role/permission change, no provider lock-in. `.env` stays gitignored; no secrets committed.
- Validation in this environment: `pnpm install` ok; `pnpm test` 110/110; `pnpm typecheck` clean; `pnpm --filter @soka/web build` ok; `pnpm validate` exit 0; `pnpm check:env` verified across missing/placeholder/real `.env` states; `pnpm smoke:live` blocked (no live Postgres/API here) but `node --check` passes and it fails gracefully with exit 2 and the "API not running" classification. Live smoke is documented for Ian to run against a real DB.

## Next Actions (Sprint 009)

- Open the Sprint 009 PR to `main` and request Architect review (scripts small/safe, live smoke really verifies Better Auth cookies, docs executable, `pnpm validate` story clearer, 110 tests/typecheck/build green, no scope creep).
- Optional live verification by Ian: set real `.env`, `pnpm check:env`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev:api`, `pnpm smoke:live`, then walk `docs/PILOT_SMOKE_CHECKLIST.md`.
- Do not start Sprint 010.

## Sprint 009 Handoff Notes (Architect)

- Detailed Sprint 009 requirements, blueprint, acceptance criteria, handoff prompt, Claude start prompt, and placeholder completion notes.
- Sprint 009 scope is pilot live-path proof: environment validation, live HTTP smoke script, Better Auth cookie/session verification, live migrate/seed runbook hardening, validation command hardening, and setup/smoke docs.
- Sprint 009 should not add product breadth. It explicitly defers Pengumuman, browser/native push delivery, provider-specific deployment automation, CI/CD redesign, new modules, auth bypasses, role behavior changes, and Sprint 010.
- Builder may add small scripts under `scripts/` and package scripts such as `check:env` and `smoke:live`, but should keep them dependency-light and safe for local/live rehearsal.

## Sprint 008 Build Notes (Builder)

- Added a third app-shell workspace, **Admin / Setup**, visible only to `admin_sekolah`/`soka_internal`: `apps/web/src/AdminSetupWorkspace.tsx` (six sections — overview, classes, students, teacher assignment, parent link codes, settings — with chip nav, per-action notices, loading/empty states) and `apps/web/src/adminSetupApi.ts` (typed client over existing `/admin/*` routes + the new membership listing). Updated `api.ts` (admin in `WorkspaceAccess` + `availableWorkspaces`), `RoleSwitcher.tsx` (renders available workspaces), `AppShell.tsx` (admin workspace + 2–3-way switcher). Never sends `school_id`.
- Backend additions: read-only `GET /admin/memberships?role=guru|wali_kelas` (admin-only, same-tenant, ignores client `schoolId`, minimal fields), backed by `listTeacherMembershipsForTenant` in `packages/db/src/onboarding.ts`; and (per Architect review) `defaultKkm` added to `schoolSettingsUpdateSchema` + `updateSchoolSettings`, carried by the existing `PATCH /admin/school-settings` (no new settings route). No schema/migration. No user/role creation. No change to parent visibility, teacher class access, or onboarding behavior.
- Seed: added `admin.a@example.com` (`admin_sekolah`, School A) via the internal binding path (idempotent, local-dev only) so the admin workspace is demoable.
- Settings UI edits attendance cutoff, timezone, and **default KKM** (0–100 integer; invalid values rejected with clear errors and not persisted).
- Tests: +7 for `GET /admin/memberships` (auth, admin guard, same-tenant isolation, role filtering, reject bad role, ignore client `schoolId`) and +3 for `defaultKkm` settings update (admin updates/persists; invalid rejected; non-admin forbidden). Total **110 passing** (onboarding 32, daily-loop 23; others unchanged).
- Architect review fixes applied before merge: `defaultKkm` is editable through the existing `PATCH /admin/school-settings`; `GET /admin/memberships` defaults to teacher-eligible memberships only (`guru`/`wali_kelas`) and does not expose parent-only or admin-only memberships.
- Validation: Builder reported `pnpm install` ok; `pnpm test` 110/110; `pnpm typecheck` clean; `pnpm --filter @soka/web build` ok; `pnpm validate` ok. Architect re-review verified 110/110 API tests, typecheck, and web build using `corepack pnpm@10.33.0`; `pnpm validate` still fails in the Codex environment because nested `pnpm` is not on PATH, but its constituent commands pass. Live DB/admin HTTP flow not exercised here (no `DATABASE_URL`); documented in SETUP + smoke checklist.
- Docs updated: `docs/API.md`, `docs/PERMISSIONS.md`, `docs/VALIDATION.md`, `docs/SETUP.md`, `docs/PILOT_SMOKE_CHECKLIST.md`, and Sprint 008 completion notes. `planning/DECISIONS.md` unchanged.

## Architect Checkpoint After Sprint 008

- Architect accepted Sprint 008 after PR #7 merge. Re-review verified the default KKM edit flow, teacher-eligible-only membership selector endpoint, tenant isolation tests, 110 API tests, typecheck, and web build.
- SOKA now has a usable MVP operations shell for three practical pilot roles: Admin/Setup, Guru/Wali Kelas, and Orang Tua.
- The biggest remaining pilot gap is live environment proof: Neon database configuration, Better Auth HTTP session flow, migrate/seed rehearsal, and an end-to-end pilot smoke walk using the documented demo accounts.
- Recommended next direction: choose between a **Sprint 009 Pilot Environment / Live Smoke Hardening** sprint before adding product breadth, or a narrow **Sprint 009 Pengumuman** sprint if the pilot school needs announcements for trust/adoption.

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
- Validation: 100 tests pass (17 tenant + 25 onboarding + 20 daily-loop + 17 parent-trust + 21 academic-records); `pnpm typecheck` clean; `apps/web` builds. (Includes Architect PR #5 fixes: score≤maxScore validation, concurrency-safe publish.)
- Architect accepted Sprint 006 after PR #5 merge. Re-review verified score/maxScore validation, concurrency-safe grade/note publish, 100 API tests, typecheck, and web build.

## Architect Checkpoint 001-006

- The core MVP foundation now exists in code: tenant-aware auth/membership, minimal onboarding, teacher daily loop, parent trust loop, and basic grades/qualitative notes.
- The system has a useful test spine: 100 API tests cover tenant isolation, role guards, parent visibility boundaries, attendance correction, notification behavior, parent trust reads, grade publication, note publication, and concurrency-sensitive writes.
- The product is not yet pilot-ready for a real school without another hardening sprint. Remaining gaps include live Neon/Better Auth HTTP verification, production environment setup, demo/seed flows, polished app shell/navigation, admin usability for setup, and deployment/CI smoke checks.
- Selected next direction: Sprint 007 prioritizes pilot readiness and app-shell consolidation before adding another broad product module.

## Sprint 007 Handoff Notes (Architect)

- Detailed Sprint 007 requirements, blueprint, acceptance criteria, handoff prompt, Claude start prompt, and placeholder completion notes.
- Sprint 007 scope is consolidation: role-aware app shell, clearer login/session state, teacher/parent navigation for existing workflows, setup docs, validation gate, and pilot smoke checklist.
- Sprint 007 should not add new modules. It explicitly defers Pengumuman, full admin/TU UI, full raport, payments/premium, student login, learning workflows, principal analytics, browser/native push, and provider replacement.
- Builder may add a lightweight `pnpm validate` script and improve deterministic seed/demo documentation if needed, but should not introduce Turborepo/Nx or a heavy new test stack.

## Sprint 007 Build Notes (Builder)

- Replaced the Sprint 002 "Foundation Validation" console with a role-aware app shell in `apps/web`: `App.tsx` (session-first root), `AppShell.tsx` (header with school/role context + real sign-out + empty state), `LoginPanel.tsx`, `RoleSwitcher.tsx`, `TeacherWorkspace.tsx`, `ParentWorkspace.tsx`, and `api.ts` (typed session/membership/sign-in/sign-out client + role→workspace derivation). Raw API logs and tenant-check diagnostic buttons removed from the UI.
- Session resolved from `GET /me`; workspaces derived from `GET /me/memberships` (teacher for `guru`/`wali_kelas`/`admin_sekolah`/`soka_internal`, parent for `orang_tua`); both-role users get a switcher; no-role users see a clear empty state.
- Sign-out is the real Better Auth `POST /api/auth/sign-out` (clears server session); no client-only fake sign-out. No client-supplied `school_id`.
- Teacher and parent surfaces reuse existing `PapanPagi`/`ParentHome`; added anchor ids + chip nav pointing only to real sections (no dead routes). "Pesan Ortu" anchors to the existing unreplied-status section (existing reply API unchanged). Parent visibility unchanged: published-only `/parent/*` endpoints; no draft grades / internal notes.
- Extended `packages/db/src/seed.ts` deterministically/idempotently (local-dev only): School A gets class Kelas 1A, three students, `guru.a` as `wali_kelas`, and `multi@example.com` linked as `orang_tua` of Adinda Putri — giving one teacher + one parent happy path. No schema/migration; no new credentials; no auth bypass.
- Added root `pnpm validate` (= test + typecheck + web build; no install). No Turborepo/Nx.
- Added `docs/SETUP.md` and `docs/PILOT_SMOKE_CHECKLIST.md`; updated `docs/VALIDATION.md`, `README.md`. `docs/API.md`/`PERMISSIONS.md`/`UX_VISUAL_STANDARD.md` and `planning/DECISIONS.md` unchanged (no behavior/decision change).
- Validation: `pnpm install` ok; `pnpm validate` ok → 100/100 API tests passing (unchanged), typecheck clean across all packages incl. the new shell, web build succeeds. Live Neon migrate/seed + full Better Auth HTTP flow not exercised here (no `DATABASE_URL`); documented for manual verification.

## Architect Checkpoint After Sprint 007

- Architect accepted Sprint 007 after PR #6 merge. Re-review verified the sign-out fix (no client-only fake sign-out), 100 API tests, typecheck, and web build. In the Codex environment, `pnpm validate` could not run because nested `pnpm` was not on PATH, but its three constituent commands passed via `corepack pnpm@10.33.0`.
- SOKA now has a coherent role-aware web shell, local setup docs, pilot smoke checklist, deterministic local-dev seed data, and a one-command quality gate.
- The biggest remaining pilot gap is practical school setup by a non-technical operator. Today, realistic onboarding still depends on seed/internal paths or API calls for school/class/student/teacher/parent-link setup.
- Recommended next direction: Sprint 008 should be **Admin Setup UI Hardening**, focused on making the already-built onboarding APIs usable through a constrained internal/admin setup surface.

## Sprint 008 Handoff Notes (Architect)

- Detailed Sprint 008 requirements, blueprint, acceptance criteria, handoff prompt, Claude start prompt, and placeholder completion notes.
- Sprint 008 scope is a constrained admin/setup workspace: classes, students, simple bulk student input, class assignment, teacher assignment, parent link code generation/list/revoke, and existing school settings fields.
- Sprint 008 may add a narrow same-tenant teacher-membership listing endpoint only if needed for safe teacher assignment UI; it must be role-guarded and tested.
- Sprint 008 explicitly defers full TU/admin product, general user management, public privileged role assignment, payments/finance, documents/letters, government reporting, principal analytics, student login/learning workflows, broadcast/pengumuman, push delivery, and Sprint 009.

## Next Actions

- Move to Claude with `planning/sprints/009-pilot-environment-live-smoke-hardening/claude-start-prompt.md`.
- Ask Claude to read the required files and produce the pre-edit implementation plan only.
- Bring Claude's plan back to Architect if it adds product modules, Pengumuman, push delivery, provider lock-in, auth bypasses, permission changes, role behavior changes, or schema changes not justified by live-smoke hardening.
- Optional immediate manual verification remains useful: run `pnpm db:migrate` + `pnpm db:seed` against a live Neon `DATABASE_URL` and walk `docs/PILOT_SMOKE_CHECKLIST.md` end-to-end.

## Blockers

- None blocking. Note: the full Better Auth HTTP sign-in/session flow was not exercised against a live Postgres in this environment (no `DATABASE_URL`); business logic is covered by in-process tests, and the live path is documented for verification. School-timezone handling is limited to cutoff comparison; a full timezone UI is intentionally deferred. Teacher account/membership creation remains internal/seed-driven; Sprint 008 only lets admin assign existing teacher-eligible memberships to classes.
