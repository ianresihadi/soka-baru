# Open Questions

When answered, move durable answers into `planning/DECISIONS.md`, `planning/DOMAIN.md`, or the relevant sprint file.

| Question | Owner | Needed By | Status | Answer / Notes |
|---|---|---|---|---|
| How should SOKA Lama's `docs/SOKA-MAP` be mapped into the new 120x planning files? | Ian / Architect | End of Session 0 | Answered | Migrate durable content into the new planning structure; do not copy raw. |
| Should SOKA Baru recreate `docs/SOKA-MAP/` as a compatibility archive? | Ian / Architect | End of Session 0 | Answered | No. Retire the format as active docs; keep migration history in `references/SOKA-MAP-MIGRATION.md`. |
| Which SOKA-MAP file should be extracted first? | Ian / Architect | End of Session 0 | Answered | Start from `30-core-loop.md`, then `00-overview.md`, then `90-relic-catalog.md`. |
| Should `30-core-loop.md` be migrated now or after all Session 0 operating decisions? | Ian / Architect | End of Session 0 | Answered | Migrate now so Session 1 and 2 use the strongest SOKA Lama baseline. |
| Should `00-overview.md` be extracted before starting Product North Star? | Ian / Architect | End of Session 0 | Answered | Yes. It supplies business context, target segment, B2B model, and product boundaries. |
| Should `90-relic-catalog.md` be extracted before Product North Star? | Ian / Architect | End of Session 0 | Answered | Yes. Extract it as guardrails so old relics and broad deck modules do not silently enter SOKA Baru. |
| Should relic catalog content become an implementation backlog or a guardrail document? | Ian / Architect | End of Session 0 | Answered | Keep it as product guardrails only. File-by-file code salvage belongs in a later dedicated sprint. |
| Is Session 0 complete? | Ian / Architect | End of Session 0 | Answered | Yes. Move to Session 1: Product North Star. |
| Is SOKA Baru's MVP a 2-role product or a 3-role ecosystem with siswa prepared from day one? | Ian / Architect | Session 2 | Answered | MVP has 2 active roles: Guru/Wali Kelas and Orang Tua. Siswa is prepared in architecture and activated in Phase 2. |
| Is Kepala Sekolah an active MVP role? | Ian / Architect | Session 2 | Answered | No. Kepala Sekolah is post-MVP/backlog. It can be served by simple sales/reporting artifacts, but not a full active role yet. |
| Is TU/Admin Sekolah an active MVP role? | Ian / Architect | Session 2 | Answered | No. TU/Admin Sekolah is not a full MVP role, but MVP needs minimal admin capability for onboarding schools, students, parent links, classes, and teacher assignments. |
| Does SOKA Baru formally keep the 7-menu teacher MVP baseline from `30-core-loop.md`? | Ian / Architect | Session 2 | Answered | Yes: Dashboard, Daftar Siswa, Absensi, Pesan Ortu, Nilai & Raport, Catatan Siswa, and Jadwal Mengajar. |
| What are the Orang Tua MVP areas? | Ian / Architect | Session 2 | Answered | Beranda Anak, Absensi, Nilai/Raport, Pesan Guru, and Notifikasi. |
| Does SOKA Baru formally keep "Catatan Siswa" as qualitative only with no behavior scoring? | Ian / Architect | Session 2 | Answered | Yes. No behavior score, points, leaderboard, or automatic contribution to student status. Publication status also applies. |
| Are all Catatan Siswa visible to parents by default? | Ian / Architect | Session 2 | Answered | No. Catatan Siswa needs publication status: internal-only or shared/published to parents. |
| What student status labels should SOKA use? | Ian / Architect | Session 2 | Answered | Aman, Perhatian, and Kritis. Status is based on objective data only: attendance and academic data against KKM in MVP. |
| Is Session 2 complete? | Ian / Architect | End of Session 2 | Answered | Yes. Move to Session 3: Core Daily Loop. |
| What is the MVP daily loop? | Ian / Architect | Session 3 | Answered | Absensi Pagi plus Pesan Ortu, guided by Papan Pagi. Nilai, Raport, Catatan Siswa, and Jadwal are not daily obligations. |
| What is the Papan Pagi Wali Kelas order? | Ian / Architect | Session 3 | Answered | Status Absensi Hari Ini, Pesan Ortu Belum Dibalas, Siswa Perlu Perhatian, then Jadwal Mengajar Hari Ini. |
| Which attendance statuses should trigger automatic parent push notifications? | Ian / Architect | Session 3 | Answered | Sakit, Izin, Alpa, and Terlambat. Hadir is visible in parent home/history but does not require daily push. |
| Should morning attendance cutoff be configurable? | Ian / Architect | Session 3 | Answered | Yes. Attendance cutoff is configurable per school and used for Papan Pagi status and habit metrics. |
| What attendance statuses are in MVP? | Ian / Architect | Session 3 | Answered | Hadir, Sakit, Izin, Alpa, and Terlambat. |
| How should attendance correction work? | Ian / Architect | Session 3 | Answered | Same-day edits are allowed directly. After the day changes, changes require a short correction reason and lightweight audit trail. |
| Should parent messages have a formal response-time SLA in MVP? | Ian / Architect | Session 3 | Answered | No. Show unreplied count, oldest waiting message, and "needs response" filter instead of SLA compliance. |
| What triggers Siswa Perlu Perhatian in MVP? | Ian / Architect | Session 3 | Answered | Alpa today, Terlambat today, or student status Perhatian/Kritis. Qualitative behavior notes do not automatically trigger it. |
| Is Session 3 complete? | Ian / Architect | End of Session 3 | Answered | Yes. Move to Session 4: Module Classification. |
| What labels should Session 4 use for module classification? | Ian / Architect | Session 4 | Answered | Now, Later, Never, and Rebuild Fresh. |
| How should Absensi be classified? | Ian / Architect | Session 4 | Answered | Now. It is the adoption wedge, daily anchor, parent transparency signal, and objective status input. |
| How should Pesan and Pengumuman be classified? | Ian / Architect | Session 4 | Answered | Pesan Ortu is Now. Pengumuman kelas/sekolah is Later. |
| How should Nilai and Raport be classified? | Ian / Architect | Session 4 | Answered | Nilai dasar / nilai terhadap KKM is Now. Full raport/finalisasi semester is Later. |
| How should Notifikasi be classified? | Ian / Architect | Session 4 | Answered | Core transactional notifications are Now. Broadcast/campaign/reminder-complex notifications are Later. |
| How should Catatan Siswa and intervention/case management be classified? | Ian / Architect | Session 4 | Answered | Catatan Siswa kualitatif with publish status is Now. Case management/intervention/BK SLA workflows are Never for MVP. |
| How should Pembayaran / SPP online be classified? | Ian / Architect | Session 4 | Answered | Later. Valuable, but not MVP because it requires payment gateway and finance operations decisions. |
| How should TU/Admin Data be classified? | Ian / Architect | Session 4 | Answered | Admin onboarding minimal is Now. Full TU module is Later. |
| How should Kepsek analytics be classified? | Ian / Architect | Session 4 | Answered | Sales/report ringkas and full principal analytics are Later. Teacher KPI/evaluation is Never for MVP. |
| How should Tugas Digital and Repositori Materi be classified? | Ian / Architect | Session 4 | Answered | Rebuild Fresh / Later. Valid Phase 2 concepts with Siswa, but old implementation should not be copied. |
| How should Ekskul, Bank Soal, Forum Diskusi, and Laporan Instansi be classified? | Ian / Architect | Session 4 | Answered | Ekskul is Later. Bank Soal is Later or Never for MVP. Forum Diskusi and Laporan Instansi are Never for MVP. |
| Is Session 4 complete? | Ian / Architect | End of Session 4 | Answered | Yes. Move to Session 5: Data, Auth, and Multi-Tenant Architecture. |
| Should each school have a physically separate database or data ownership/isolation inside a shared database? | Ian / Architect | Session 5 | Answered | Data ownership and isolation per school is required. MVP baseline is shared database with `school_id` and RLS, not physical database per school. |
| What login/auth model should SOKA MVP use? | Ian / Architect | Session 5 | Answered | Email/password with unique school code for initial school binding. Subdomain-per-school is deferred. |
| Can one user hold multiple roles in the same school? | Ian / Architect | Session 5 | Answered | Yes. Use explicit school memberships and role assignments, not a single `role` column. |
| How are parents linked to students? | Ian / Architect | Session 5 | Answered | School/admin creates or imports students, then issues parent invitations or link codes. Parent-student links are explicit; no free self-claim by name/NISN. |
| What are the MVP core data entities? | Ian / Architect | Session 5 | Answered | schools, users, school_memberships, membership_roles, students, classes, teacher_assignments, parent_student_links, attendance_records, grades, student_notes, messages, notifications, and school_settings. |
| Where should per-school configurable rules live? | Ian / Architect | Session 5 | Answered | In `school_settings`, with SOKA defaults. Includes attendance cutoff, default KKM, status thresholds, and future school-specific labels/statuses. |
| Which MVP records need lightweight audit/history? | Ian / Architect | Session 5 | Answered | attendance_records post-day corrections, grades after parent publication, student_notes publish/unpublish changes, and parent_student_links create/remove events. |
| Is Session 5 complete? | Ian / Architect | End of Session 5 | Answered | Yes. Move to Session 6: Web and Mobile Strategy. |
| What platform should each MVP role use first? | Ian / Architect | Session 6 | Answered | Guru/Wali Kelas uses web dashboard first; Orang Tua is mobile-first; Siswa is deferred to Phase 2. |
| Should parent mobile start as PWA/mobile web or native/Capacitor? | Ian / Architect | Session 6 | Answered | Start as PWA/mobile web, designed to be wrapped with Capacitor later for Play Store. |
| Should the Guru/Wali Kelas dashboard be optimized for mobile too? | Ian / Architect | Session 6 | Answered | Desktop/tablet-first with responsive mobile fallback. It must be usable on HP, especially for attendance, but parent app gets higher mobile polish. |
| What is the MVP push notification strategy? | Ian / Architect | Session 6 | Answered | In-app notification center is required; browser push is attempted if feasible; native push waits for Capacitor/Play Store. |
| Is Session 6 complete? | Ian / Architect | End of Session 6 | Answered | Yes. Move to Session 7: Existing Code Salvage Plan. |
| Should SOKA Lama be migrated wholesale? | Ian / Architect | Session 7 | Answered | No. Old code must be classified as Keep Concept, Migrate Code, Rebuild Fresh, Reference Only, or Discard. |
| Which old-code area should be classified first? | Ian / Architect | Session 7 | Answered | Wali Kelas/Guru MVP screens: Dashboard, Absensi, Daftar Siswa, Pesan Ortu, Nilai dasar, Catatan Siswa, and Jadwal Mengajar. |
| What is the default salvage stance for Wali Kelas/Guru MVP screens? | Ian / Architect | Session 7 | Answered | Keep Concept / Rebuild Fresh by default, not Migrate Code. Direct migration requires later audit. |
| Is Session 7 complete? | Ian / Architect | End of Session 7 | Answered | Yes. Move to Session 8: UX and Visual Standard. |
| What is SOKA Baru's visual and UX principle? | Ian / Architect | Session 8 | Answered | Hangat, ramah, tertib, dan operasional. |
| Should Guru/Wali Kelas dashboard be task-first or KPI-first? | Ian / Architect | Session 8 | Answered | Task-first. KPI summaries can exist only as small supporting context. |
| Should parent experience be reassurance-first or data-dump? | Ian / Architect | Session 8 | Answered | Reassurance-first. Parent home should answer presence, important messages, new grades/notes, and required actions quickly. |
| What UI density should SOKA use per role? | Ian / Architect | Session 8 | Answered | Guru/Wali Kelas should be dense-but-calm. Orang Tua should use simple-card summaries. |
| Is Session 8 complete? | Ian / Architect | End of Session 8 | Answered | Yes. Move to Session 9: Sprint Roadmap. |
| What is the initial sprint order? | Ian / Architect | Session 9 | Answered | 001 Discovery & Architecture, 002 Foundation Data/Auth, 003 Admin Onboarding Minimal, 004 Guru Daily Loop, 005 Parent Trust Loop, 006 Nilai & Catatan. |
| Is Sprint 001 nearly complete and should Sprint 002 details be prepared next? | Ian / Architect | Session 9 | Answered | Yes. Sprint 001 needs documentation cleanup, then Sprint 002 Foundation Data/Auth should be detailed. |
| Should Sprints 003-006 get skeleton artifacts now? | Ian / Architect | Session 9 | Answered | Yes. Create skeleton artifacts now, but defer detailed blueprints until earlier foundation work is complete. |
| Is Session 9 complete? | Ian / Architect | End of Session 9 | Answered | Yes. Move to final documentation sanity pass for Sprint 001. |
| Does SOKA Baru formally keep B2B Sekolah as the business model? | Ian / Architect | Session 1 | Answered | Yes. Primary buyer is school owner, foundation, or school leadership as B2B buyer. |
| Does SOKA Baru formally keep SD swasta menengah as the first target segment? | Ian / Architect | Session 1 | Answered | Yes. First target segment remains Indonesian private elementary schools, especially SD swasta menengah. |
| Who is the primary buyer SOKA Baru optimizes for first? | Ian / Architect | Session 1 | Answered | School owner, foundation, or school leadership as B2B buyer. Parents are important users and trust/reputation stakeholders, not first buyer. |
| What is SOKA Baru's main product promise to the school buyer? | Ian / Architect | Session 1 | Answered | SOKA helps private elementary schools look more transparent, responsive, and orderly in parents' eyes without adding administrative burden for teachers. |
| Who is SOKA Baru's most important daily user? | Ian / Architect | Session 1 | Answered | Wali kelas / guru as primary daily operator. Parent value depends on teacher-side data being current. |
| What is SOKA Baru's first adoption wedge? | Ian / Architect | Session 1 | Answered | Morning attendance that feeds parent reassurance and the teacher's morning board. |
| What is the first success metric for SOKA adoption? | Ian / Architect | Session 1 | Answered | Habit metrics: 80% school-day morning attendance completion in month one, 80% before school cutoff, and 60% parent notification/child-home engagement in week one. |
| What is the most important "SOKA is not" boundary for MVP? | Ian / Architect | Session 1 | Answered | SOKA MVP is not an LMS and not an enterprise SIS; it is a lightweight operating layer for school-parent trust. |
| Is Session 1 complete? | Ian / Architect | End of Session 1 | Answered | Yes. Move to Session 2: Roles and MVP Scope. |
| Can SOKA later sell a premium subscription directly to parents? | Ian / Architect | Future business-model session | Open | User proposed this as future reference. Must be challenged for school consent, fairness, teacher burden, privacy, and whether it weakens B2B positioning. |
| Which old SOKA modules should be explicitly marked Never, Later, or Rebuild Fresh? | Ian / Architect | Session 4 | Answered | See `planning/MODULE-CLASSIFICATION.md`. |
| Should mobile start with orang tua only, or include siswa early? | Ian / Architect | Session 6 | Answered | Orang Tua starts mobile-first as PWA/mobile web. Siswa is deferred to Phase 2. |
| What is the first implementation sprint after discovery? | Ian / Architect | Session 9 | Answered | Sprint 002: Foundation Data/Auth. |
| What stack should SOKA Baru use for web, mobile, backend, and auth? | Ian / Architect | Before Sprint 002 implementation | Answered | Use React/Vite/TypeScript/Tailwind frontend, Hono custom API, Drizzle ORM, Better Auth, and Neon Postgres. Supabase is reference context only, not the backend baseline. |
