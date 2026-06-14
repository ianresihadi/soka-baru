# Grill Sessions

This is the proposed grill roadmap for turning SOKA's mixed inputs into a clear, scalable product plan.

## Session 0: Project Operating System

Goal: Decide how SOKA Baru will use the 120x folder structure, where source truth lives, and how old SOKA docs migrate.

Status: Complete.

Key decisions so far:

- `C:\Users\USER\Documents\SOKA` is the new project operating folder.
- SOKA Lama is a reference and migration source, not the new source of truth.
- SOKA Lama's `docs/SOKA-MAP` should be summarized into the new planning structure, not copied raw.
- SOKA Baru will not recreate `docs/SOKA-MAP/`; migration history lives in `references/SOKA-MAP-MIGRATION.md`.
- First migration order: `30-core-loop.md`, then `00-overview.md`, then `90-relic-catalog.md`.
- The relic catalog is a product guardrail, not an implementation backlog.

## Session 1: Product North Star

Goal: Lock the product promise, buyer, daily user, and "SOKA is not" boundaries.

Status: Complete.

Starting baseline:

- Buyer: school/foundation, not individual parent.
- First segment: Indonesian private elementary schools, especially SD swasta menengah.
- Daily operator: wali kelas / guru.
- Parent value: transparency, communication, and trust.
- Product guardrail: do not become enterprise SIS, full LMS, B2C parent app, or government reporting platform in MVP.

Resolved so far:

- Primary buyer is school owner, foundation, or school leadership.
- Parent premium subscription is only a future hypothesis and must be challenged before becoming a product decision.
- Product North Star: SOKA helps private elementary schools look more transparent, responsive, and orderly in parents' eyes without adding administrative burden for teachers.
- Primary daily operator is wali kelas / guru.
- First adoption wedge is morning attendance that feeds parent reassurance and the teacher's morning board.
- Early success is measured by habit: attendance completion and parent engagement, not feature count.
- MVP boundary: SOKA is not an LMS and not an enterprise SIS; it is a lightweight operating layer for school-parent trust.

## Session 2: Roles and MVP Scope

Goal: Decide which roles are active in MVP, prepared for future, or explicitly postponed.

Status: Complete.

Main tension:

- Super Apps deck includes kepsek, guru, wali kelas, siswa, orang tua, and TU.
- SOKA-MAP narrows the MVP around wali kelas and orang tua, with siswa as a future ecosystem role.

Starting baseline:

- MVP active roles: Guru/Wali Kelas and Orang Tua.
- Phase 2 ecosystem role: Siswa.
- Post-MVP/backlog roles: Kepala Sekolah and TU/Admin Sekolah.

Resolved so far:

- MVP active roles are Guru/Wali Kelas and Orang Tua.
- Siswa is prepared in architecture but activated in Phase 2.
- Kepala Sekolah is post-MVP/backlog, not an active MVP role.
- TU/Admin Sekolah is not an active MVP role, but minimal admin capability is needed for onboarding.
- Guru/Wali Kelas MVP menus are Dashboard, Daftar Siswa, Absensi, Pesan Ortu, Nilai & Raport, Catatan Siswa, and Jadwal Mengajar.
- Orang Tua MVP areas are Beranda Anak, Absensi, Nilai/Raport, Pesan Guru, and Notifikasi.
- Catatan Siswa requires publication status before parent visibility.
- Catatan Siswa is qualitative-only: no behavior scores, points, leaderboards, or automatic contribution to student status.
- Student status labels are Aman, Perhatian, and Kritis, based on objective data only.

## Session 3: Core Daily Loop

Goal: Lock the 10-minute daily loop and decide what truly belongs in daily usage.

Status: Complete.

Candidate loop:

- Absensi pagi
- Pesan orang tua
- Papan pagi wali kelas
- Siswa perlu perhatian
- Jadwal hari ini

Starting baseline:

- Daily budget: around 10 minutes.
- Daily anchor: morning attendance.
- Daily loop: attendance plus parent messages.
- Dashboard should become Papan Pagi Wali Kelas.

Resolved so far:

- MVP daily loop is Absensi Pagi plus Pesan Ortu, guided by Papan Pagi.
- Papan Pagi order is Status Absensi Hari Ini, Pesan Ortu Belum Dibalas, Siswa Perlu Perhatian, then Jadwal Mengajar Hari Ini.
- Attendance push notifications go to parents for Sakit, Izin, Alpa, and Terlambat only; Hadir remains visible without mandatory push.
- Morning attendance cutoff is configurable per school.
- MVP attendance statuses are Hadir, Sakit, Izin, Alpa, and Terlambat.
- Attendance can be edited same day; post-day corrections require a reason and lightweight audit trail.
- Parent messages have no formal SLA in MVP; Papan Pagi shows unreplied count, oldest waiting message, and "needs response" filter.
- Siswa Perlu Perhatian triggers are Alpa today, Terlambat today, or status Perhatian/Kritis.

## Session 4: Module Classification

Goal: Map deck modules into Now, Later, or Never.

Status: Complete.

Modules to classify:

- Absensi
- Nilai and raport
- Pesan and pengumuman
- Notifikasi
- Pembayaran
- TU/admin data
- Kepsek analytics
- Tugas digital
- Materi repository
- Ekskul
- Bank soal
- Forum diskusi
- Laporan instansi

Classification labels:

- Now: belongs in MVP.
- Later: valid product direction, but not MVP.
- Never: outside SOKA's product boundary unless strategy changes.
- Rebuild Fresh: useful concept, but do not copy old implementation.

Resolved so far:

- Classification labels are Now, Later, Never, and Rebuild Fresh.
- Absensi is Now.
- Pesan Ortu is Now; Pengumuman kelas/sekolah is Later.
- Nilai dasar / nilai terhadap KKM is Now; full raport finalization is Later.
- Core transactional notifications are Now; complex broadcast/campaign notifications are Later.
- Catatan Siswa kualitatif with publish status is Now; case-management/intervention/BK SLA workflows are Never for MVP.
- Pembayaran / SPP online is Later.
- Admin onboarding minimal is Now; full TU module is Later.
- Leadership sales/reporting and full principal analytics are Later; teacher KPI/evaluation is Never for MVP.
- Tugas Digital and Repositori Materi are Rebuild Fresh / Later.
- Ekskul is Later; Bank Soal is Later/Never for MVP; Forum Diskusi and Laporan Instansi are Never for MVP.

## Session 5: Data, Auth, and Multi-Tenant Architecture

Goal: Decide the durable model for schools, users, roles, permissions, student records, parent links, and data ownership.

Status: Complete.

Starting baseline:

- SOKA is B2B multi-school software.
- MVP active roles are Guru/Wali Kelas and Orang Tua.
- Siswa should be prepared in architecture for Phase 2.
- Minimal admin onboarding is Now.
- Production cannot use demo credentials or mock data as foundations.

Resolved so far:

- Data ownership and isolation are per school.
- MVP baseline is one shared database with `school_id`, backend tenant enforcement, and Row Level Security as defense-in-depth where compatible; not physical database per school.
- Auth baseline is email/password with unique school code for initial `school_id` binding; subdomain-per-school is deferred.
- Users can hold multiple roles through explicit school memberships and role assignments.
- Parent-student links are school-controlled through invitations/link codes, not free self-claim.
- MVP core entities are schools, users, school_memberships, membership_roles, students, classes, teacher_assignments, parent_student_links, attendance_records, grades, student_notes, messages, notifications, and school_settings.
- `school_settings` owns per-school configurable rules such as attendance cutoff, default KKM, and student status thresholds.
- Lightweight audit/history applies to post-day attendance corrections, grade changes after parent publication, student note publish/unpublish changes, and parent-student link create/remove events.

## Session 6: Web and Mobile Strategy

Goal: Decide which platform is built first for each role and what mobile stack should be used.

Status: Complete.

Starting baseline:

- Guru/Wali Kelas needs a web dashboard optimized for school work.
- Orang Tua needs mobile-first access.
- Siswa is Phase 2.
- Existing SOKA Lama is React/Vite-oriented, but mobile strategy is not final.

Resolved so far:

- Guru/Wali Kelas uses web dashboard first.
- Orang Tua is mobile-first.
- Siswa platform is deferred to Phase 2.
- Parent experience starts as PWA/mobile web, designed for later Capacitor wrapping and Play Store path.
- Guru/Wali Kelas dashboard is desktop/tablet-first with responsive mobile fallback.
- Notification delivery is staged: in-app required, browser push best-effort, native push later with Capacitor/Play Store.

## Session 7: Existing Code Salvage Plan

Goal: Classify existing SOKA app code as keep, migrate, rewrite, mothball, or delete.

Status: Complete.

Starting baseline:

- SOKA Lama is a migration source, not the source of truth.
- Relic catalog is a guardrail, not an implementation backlog.
- File-by-file code salvage should happen in a dedicated sprint.
- Useful concepts may be Rebuild Fresh instead of copied.

Resolved so far:

- SOKA Lama will not be migrated wholesale.
- Old code will be classified as Keep Concept, Migrate Code, Rebuild Fresh, Reference Only, or Discard.
- First salvage area is Wali Kelas/Guru MVP screens: Dashboard, Absensi, Daftar Siswa, Pesan Ortu, Nilai dasar, Catatan Siswa, and Jadwal Mengajar.
- Default Wali Kelas/Guru salvage stance is Keep Concept / Rebuild Fresh, not Migrate Code.

## Session 8: UX and Visual Standard

Goal: Turn "hangat dan ramah" into practical UI rules for dashboards, mobile screens, and school workflows.

Status: Complete.

Starting baseline:

- UX should support the North Star: transparent, responsive, orderly, low teacher burden.
- Teacher side should feel operational and scannable.
- Parent side should feel reassuring, clear, and mobile-first.
- Existing visual direction from SOKA Lama: "hangat dan ramah".

Resolved so far:

- SOKA Baru visual/UX principle is "hangat, ramah, tertib, dan operasional".
- Guru/Wali Kelas dashboard is task-first, not KPI-first.
- Parent experience is reassurance-first, not data-dump.
- Guru/Wali Kelas UI is dense-but-calm; Orang Tua UI uses simple-card summaries.

## Session 9: Sprint Roadmap

Goal: Convert decisions into sprint folders with requirements, blueprint, acceptance criteria, and handoff prompts.

Status: Complete.

Starting baseline:

- MVP is focused on Guru/Wali Kelas and Orang Tua.
- Adoption wedge is Absensi Pagi.
- Architecture must support multi-school ownership/isolation.
- Build should proceed through 120x sprint artifacts, not ad hoc implementation.

Resolved so far:

- Initial sprint order is 001 Discovery & Architecture, 002 Foundation Data/Auth, 003 Admin Onboarding Minimal, 004 Guru Daily Loop, 005 Parent Trust Loop, and 006 Nilai & Catatan.
- Sprint 001 is nearly complete after documentation cleanup.
- Sprint 002 starter artifacts have been created.
- Sprints 003-006 skeleton artifacts have been created.

## Session 10: Backend Stack Confirmation

Goal: Replace the unresolved Supabase backend question with a scalable, portable implementation baseline for Sprint 002.

Status: Complete.

Starting tension:

- SOKA Lama uses a Supabase-oriented stack.
- The user wants an alternative that can scale and reduce backend vendor lock-in.
- SOKA still needs strong per-school data ownership and isolation.

Resolved so far:

- Keep React, Vite, TypeScript, and Tailwind as the frontend baseline.
- Replace Supabase as the backend baseline with Neon Postgres plus a custom TypeScript API.
- Use Hono as the baseline API framework.
- Use Drizzle ORM for schema, migrations, and typed data access.
- Use Better Auth for email/password auth and sessions.
- Enforce tenant isolation in the backend service/query layer first.
- Treat Postgres Row Level Security as defense-in-depth where it fits the auth/session design cleanly.
- Sprint 002 should now refine and implement the foundation around this approved stack.
