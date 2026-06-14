# Project State

**Project:** SOKA Baru
**Last updated:** 2026-06-14

## Current Status

Sprint 001: Discovery & Architecture is complete. Sprint 002: Foundation Data/Auth is ready for implementation planning with the approved stack baseline.

The user approved using `C:\Users\USER\Documents\SOKA` as the new project operating folder, treating SOKA Lama's `docs/SOKA-MAP` as migration material, retiring `docs/SOKA-MAP/` as an active documentation format, and keeping the relic catalog as guardrails only.

## Active Phase

Architect Layer: Sprint 002 ready for Builder implementation planning.

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

## Next Actions

- Move to Claude for Sprint 002 Builder planning.
- Have Claude produce the pre-edit implementation plan only.
- Approve the plan directly or bring it back to Architect for review before Claude edits files.

## Blockers

- None currently.
