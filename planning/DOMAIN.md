# Domain Context

This file captures SOKA's business and school-operations context.

## Business Goal

Build a school operating app that can start with a focused MVP and later scale into a broader school super app without losing product clarity.

## Product North Star

SOKA helps private elementary schools look more transparent, responsive, and orderly in parents' eyes without adding administrative burden for teachers.

This North Star binds three stakeholder needs:

- Schools want trust, professionalism, and retention.
- Parents want visibility, responsiveness, and reassurance.
- Teachers need tools that fit the school day instead of adding administrative weight.

## Primary Daily Operator

Session 1 confirmed wali kelas / guru as the primary daily operator.

Reason:

- Parents receive value only if school-side data is current.
- Attendance, messages, notes, and grades are mostly produced by teachers.
- Teacher adoption is the operational heartbeat of SOKA.
- If SOKA feels like extra admin work, the parent-facing app will become empty or stale.

Design implication:

Every daily workflow should be tested against teacher time, classroom rhythm, and the 10-minute daily loop baseline.

## Adoption Wedge

Session 1 confirmed morning attendance as the first adoption wedge.

Why this wins:

- It happens every school day.
- It is objective and easy to trust.
- It can be completed quickly by wali kelas / guru.
- It creates immediate parent value through reassurance and notification.
- It creates teacher value through the Papan Pagi Wali Kelas.
- It proves the North Star without needing broad super-app scope.

The first MVP slice should make this wedge excellent before expanding into heavier workflows.

## Early Success Metrics

Session 1 confirmed early success should be measured by habit, not feature count.

Initial success metrics:

| Metric | Target | Why It Matters |
|---|---:|---|
| Morning attendance completion | At least 80% of school days in the first month | Proves teacher-side habit formation. |
| Attendance completed before school-defined cutoff time | At least 80% of completed attendance days | Proves the workflow fits morning rhythm. |
| Parent notification or child-home engagement | At least 60% of parents open the notification or child home in the first week | Proves parent-side value is visible. |

These are discovery/MVP targets and may be refined after pilot context.

## Working Segment

Indonesian private elementary schools, especially schools that need practical digital operations but do not have a large internal IT team.

More specifically, SOKA Lama's overview framed the working segment as SD swasta menengah: schools with enough ability and motivation to pay for digital operations, but not enough internal IT capacity to build or maintain a custom system.

## Business Model Baseline

The migrated working baseline is B2B Sekolah:

- The school or foundation buys SOKA.
- Parents use the parent-facing experience as part of the school's service.
- SOKA should help the school look more transparent, responsive, and organized to parents.
- Parent adoption matters, but parents are not the direct subscription buyer in the current baseline.

Session 1 confirmed the primary buyer baseline:

- Primary buyer: school owner, foundation, or school leadership.
- Primary parent role: daily user, trust signal, and reputational pressure channel.
- Product promise should be framed around making the school more transparent, responsive, and orderly in the eyes of parents without adding teacher burden.

## Future Hypothesis: Parent Premium

The user proposed a future possibility: parents who want deeper access or richer information than the standard parent features could buy an additional premium module.

This is not MVP scope. It is a future business-model hypothesis that must be challenged before adoption.

Key challenge:

- If parents pay extra for more information, SOKA may create two classes of parental access inside one school community.
- Schools may object if SOKA monetizes their parents directly.
- Teachers may feel pressured to produce extra data for paying parents.
- Premium access must not expose sensitive student data, teacher notes, comparisons, or school-controlled records without explicit school consent.
- Premium must not make the free parent experience feel intentionally incomplete.

## Current Product Inputs

- SOKA Lama has an existing React/Vite/Supabase-style web app with roles for wali kelas, guru, orang tua, siswa, admin, and partial principal support.
- SOKA Baru keeps the React/Vite/TypeScript/Tailwind frontend direction, but replaces Supabase as the backend baseline with a custom TypeScript API and Neon Postgres.
- SOKA Lama has `docs/SOKA-MAP`, a product map that narrowed MVP scope around wali kelas and orang tua, with siswa as a future ecosystem role.
- The Super Apps Sekolah deck presents a broader vision: modular RBAC, web/mobile access, centralized data, and role-specific modules for kepsek, guru, wali kelas, siswa, orang tua, and TU.
- The 120x Operators Kit provides the operating method for turning this material into a documented, sprint-based build.

## Users / Roles To Resolve

| Role | Current Understanding | Status |
|---|---|---|
| Wali Kelas / Guru | Primary daily operator for MVP. | Active MVP role. |
| Orang Tua | Primary parent-facing consumer and trust/reputation stakeholder. | Active MVP role. |
| Siswa | Valuable ecosystem role for learning workflows. | Prepare in architecture; activate in Phase 2. |
| Kepala Sekolah | Buyer/influencer and future monitoring role. | Post-MVP/backlog; not active MVP role. |
| TU / Admin Sekolah | Future school administration role. | Not active MVP role; minimal admin capability needed for onboarding. |

## Key Product Tension

The broad deck says "super app for all school stakeholders." The current SOKA-MAP says "start with the daily loop that creates adoption." SOKA Baru needs a staged product architecture that honors both: narrow enough to ship, structured enough to scale.

## Approved Technical Baseline

Session 10 confirms the SOKA Baru implementation stack baseline:

- Frontend: React, Vite, TypeScript, Tailwind.
- Teacher app: desktop/tablet-first web dashboard with responsive mobile fallback.
- Parent app: mobile-first PWA/mobile web, designed for later Capacitor wrapping.
- Backend API: custom TypeScript API using Hono.
- Database: Neon Postgres, or another Postgres-compatible managed database if a later ADR changes provider.
- ORM and migrations: Drizzle ORM.
- Auth: Better Auth for email/password sessions.
- Tenancy enforcement: backend service/query layer first, with Postgres Row Level Security as defense-in-depth where compatible.

Supabase remains reference context from SOKA Lama, not the SOKA Baru backend baseline.

## Multi-Tenant Data Ownership

Session 5 confirms that each school's data must be owned by and isolated for that school.

Meaning:

- SOKA Baru can use one shared database.
- Every school-owned record should be associated with `school_id`.
- Access must be isolated through backend policy enforcement, with Row Level Security used as an additional database-level barrier where practical.
- Users from one school must not read or write another school's data.
- Physical database-per-school is not the MVP baseline, but can remain an enterprise option later.

## Auth and School Binding

Session 5 confirmed the product auth baseline, and Session 10 confirms the implementation baseline:

- Users log in with email and password.
- Better Auth is the baseline auth library.
- Each school has a unique `school_code`.
- The `school_code` is used during account creation or first login to bind the user to `school_id`.
- After binding, authorization depends on `school_id` and role.
- Subdomain-per-school is not the MVP baseline.

## User Role Model

Session 5 confirms one user may hold more than one role in the same school.

Examples:

- Guru can also be wali kelas.
- Kepala sekolah in a small school may also teach.
- Orang tua may also be a teacher in the same school.
- One parent may be linked to multiple children.

The product should model this through explicit school memberships and role assignments, not a single user role field.

## Parent-Student Linking

Session 5 confirms:

- Students are created or imported by admin onboarding first.
- The school issues parent invitations or link codes.
- Parents use email/password plus invitation/link flow.
- One parent can connect to multiple children.
- One child can connect to multiple parents/guardians.
- Parents cannot freely claim a child only by name or NISN.

## MVP Core Entities

Session 5 confirms the MVP core entities:

- `schools`
- `users`
- `school_memberships`
- `membership_roles`
- `students`
- `classes`
- `teacher_assignments`
- `parent_student_links`
- `attendance_records`
- `grades`
- `student_notes`
- `messages`
- `notifications`
- `school_settings`

These support the Now modules without pulling in payments, assignments, materials, principal analytics, or full TU workflows.

## School Settings

Session 5 confirms school-specific rules live in `school_settings`.

Examples:

- Attendance cutoff.
- Default KKM.
- Status thresholds for Aman, Perhatian, and Kritis.
- Future school-specific labels or statuses if needed.

SOKA can ship sensible defaults, but configurable school rules should not be hardcoded.

## Lightweight Audit / History

Session 5 confirms lightweight audit/history for records that affect trust:

- Attendance corrections after the day changes.
- Grade changes after publication to parents.
- Student note publish/unpublish status changes.
- Parent-student link create/remove events.

The MVP does not need enterprise audit logs for every table.

## Platform Strategy

Session 6 confirms the MVP platform baseline:

- Guru/Wali Kelas: web dashboard first.
- Orang Tua: PWA/mobile web first, designed for later Capacitor wrapping and Play Store path.
- Siswa: prepared for Phase 2, not active in MVP.

The product should not force one shared interface shape across all roles.

Teacher UI standard:

- Desktop/tablet-first.
- Mobile fallback must remain usable, especially for attendance.
- It does not need the same mobile polish as the parent app.

Notification delivery baseline:

- In-app notification center/inbox is required in MVP.
- Browser push can be attempted where feasible.
- Native push is deferred until the parent app is wrapped for Play Store.

## Existing Code Salvage

Session 7 confirms SOKA Lama is not migrated wholesale.

Old code must be classified with:

- Keep Concept.
- Migrate Code.
- Rebuild Fresh.
- Reference Only.
- Discard.

Detailed salvage notes live in `planning/CODE-SALVAGE.md`.

## UX and Visual Standard

Session 8 confirms the product should feel:

**Hangat, ramah, tertib, dan operasional.**

This means the product should be warm and school-friendly without becoming decorative, and operational without becoming cold enterprise software.

Detailed UX standards live in `docs/UX_VISUAL_STANDARD.md`.

Teacher dashboard rule:

- Papan Pagi is task-first, not KPI-first.
- It prioritizes the morning loop over analytics.

Parent app rule:

- Parent home is reassurance-first, not data-dump.
- It should answer the parent's most immediate trust questions before exposing detail.

Role density rule:

- Guru/Wali Kelas UI is dense-but-calm.
- Orang Tua UI uses simple-card summaries.

## Module Classification Labels

Session 4 confirms four labels:

| Label | Meaning |
|---|---|
| Now | Belongs in MVP. |
| Later | Valid product direction, but not MVP. |
| Never | Outside SOKA's product boundary unless strategy changes. |
| Rebuild Fresh | Useful concept, but do not copy the old implementation. |

Current classifications live in `planning/MODULE-CLASSIFICATION.md`.

## Product Boundary Baseline

Source: `C:\Users\USER\Desktop\Cowork Station\Projects\SOKA\docs\SOKA-MAP\00-overview.md`

SOKA Baru should not become every kind of school software at once.

Working "SOKA is not" boundary:

| Not This | Reason |
|---|---|
| Enterprise SIS for SMA, universities, or large institutions | The target segment is SD swasta menengah with practical daily needs. |
| Full LMS | Learning content may become a later ecosystem module, but the MVP is school operations and communication. |
| B2C parent subscription app | Current buyer baseline is school/foundation. |
| Dinas education-office tool | Government reporting is not the adoption wedge. |

Session 1 sharpened the most important MVP boundary:

SOKA MVP is not an LMS and not an enterprise SIS.

Instead, SOKA MVP is a lightweight operating layer for school-parent trust:

- Attendance as the daily proof point.
- Communication as the responsiveness channel.
- Child-progress visibility as the parent trust layer.
- Teacher workload constraint as a product rule.

Product filter:

If a proposed feature does not serve wali kelas/guru SD, orang tua SD, or school adoption around them, it should be treated as a relic candidate or later-phase item.

## Relic Guardrails From SOKA Lama

Source: `C:\Users\USER\Desktop\Cowork Station\Projects\SOKA\docs\SOKA-MAP\90-relic-catalog.md`

The old relic catalog is not copied as an implementation backlog for SOKA Baru. It is used to prevent known overbuilt or stale concepts from entering the new product unchallenged.

### Guardrail Categories

| Category | SOKA Baru Rule |
|---|---|
| Role sprawl | Do not create separate apps for every school role in MVP. Start from the confirmed core roles and prepare future roles deliberately. |
| Menu sprawl | Do not add route/menu entries for pages that are not real workflows. |
| Heavy teacher tools | RPP Builder, Master Plan, Asset Hub, and similar tools are later-phase unless they become a clear sales differentiator. |
| Finance/payment | Parent payments stay out of the promoted MVP until payment gateway, school finance ownership, and compliance choices are resolved. |
| Mock/demo architecture | Demo credentials and hardcoded mock data are not production foundations. |
| Principal dashboards | Kepala Sekolah belongs post-MVP unless a pilot school makes it a buying requirement. |
| Student role legacy | Student features should be rebuilt around Phase 2 learning workflows, not copied from old mock-based pages. |

### Migration-Relevant Old Findings

| Old Finding | New Interpretation |
|---|---|
| Guru Matpel merged into Wali Kelas / Guru | Keep one Guru model as baseline; distinguish wali kelas and guru spesialis through assignments/permissions, not separate app silos. |
| Kepala Sekolah hidden/drop from menu | Keep post-MVP until role scope is confirmed. |
| Pembayaran hidden from parent sidebar | Keep later-phase until finance model is real. |
| DemoCredential mechanism | Production auth must be redesigned. |
| Hardcoded mock data | Production data layer must be real and multi-tenant. |
| Teacher heavy tools mothballed | Do not prioritize before core daily adoption. |

### Important Conflict

The relic catalog contains old text saying the student role was mothballed, but it also records that this decision was later cancelled. The current migrated baseline from `30-core-loop.md` wins: Siswa is a Phase 2 ecosystem role, not a dead role.

## Migrated MVP Baseline From SOKA Lama

Source: `C:\Users\USER\Desktop\Cowork Station\Projects\SOKA\docs\SOKA-MAP\30-core-loop.md`

### Daily Operating Loop

The strongest migrated product insight is that SOKA should fit into a teacher's real school day.

Session 3 confirms the MVP daily loop:

- Daily anchor: morning attendance.
- Daily loop: attendance plus parent messages.
- Normal daily time budget: around 10 minutes.
- Grade entry, raport, and student notes are not daily obligations; they are weekly, seasonal, or event-driven.
- Papan Pagi Wali Kelas is the dashboard that guides the teacher through the daily loop.

### Papan Pagi Order

Session 3 confirms this order:

1. Status Absensi Hari Ini.
2. Pesan Ortu Belum Dibalas.
3. Siswa Perlu Perhatian.
4. Jadwal Mengajar Hari Ini.

This should be an action-oriented dashboard, not a generic KPI dashboard.

### Attendance Notification Rule

Session 3 confirms:

- Hadir: saved and visible in parent home/history, but no mandatory push notification.
- Sakit: automatic parent push.
- Izin: automatic parent push.
- Alpa: automatic parent push.
- Terlambat: automatic parent push.

This keeps parent communication meaningful and avoids notification fatigue.

### Attendance Cutoff Rule

Session 3 confirms morning attendance cutoff is configurable per school.

The cutoff supports:

- Papan Pagi status: not started, in progress, completed on time, completed late.
- Habit metrics: attendance completed before school-defined cutoff.
- School-specific operating rhythm.

The cutoff should not be hardcoded.

### Attendance Statuses

Session 3 confirms five MVP attendance statuses:

- Hadir.
- Sakit.
- Izin.
- Alpa.
- Terlambat.

Additional statuses should not be added to MVP unless a pilot school requires them.

### Attendance Correction Flow

Session 3 confirms:

- Same-day attendance can be edited directly.
- After the day changes, attendance changes become corrections.
- Corrections require a short reason.
- Post-day corrections should keep a lightweight audit trail.

This protects data trust without making morning operation slow.

### Parent Message Handling

Session 3 confirms MVP does not use a formal response-time SLA for parent messages.

Papan Pagi should show:

- Count of unreplied parent messages.
- Oldest waiting message.
- Filter for messages that need response.

The goal is to prevent forgotten communication, not to create a teacher performance timer.

### Siswa Perlu Perhatian

Session 3 confirms the MVP triggers:

- Alpa today.
- Terlambat today.
- Student status is Perhatian or Kritis.

Not automatic triggers:

- Qualitative behavior notes.
- Raw internal teacher notes.
- Aggressive daily grade fluctuations.

This section should remain short enough for a teacher to scan in around 30 seconds.

### Teacher MVP Menu Baseline

Session 2 confirms the teacher side should use seven MVP menus:

| Menu | Purpose |
|---|---|
| Dashboard | Morning operating board for wali kelas. |
| Daftar Siswa | Roster and student status overview. |
| Absensi | Daily attendance capture. |
| Pesan Ortu | Parent communication. |
| Nilai & Raport | Combined grade entry, completion monitoring, and raport workflow. |
| Catatan Siswa | Qualitative student notes. |
| Jadwal Mengajar | Today's and weekly teaching schedule. |

Excluded from Guru/Wali Kelas MVP:

- Pusat Tugas.
- Repositori Materi.
- RPP Builder.
- Master Plan.
- Asset Hub.
- Presensi per jam pelajaran.
- Kepsek dashboard.
- TU module.
- Pembayaran.

### Student Status Baseline

SOKA should avoid opaque risk scores. Session 2 confirms simple status labels based on objective data:

- Aman
- Perhatian
- Kritis

MVP objective inputs:

- Attendance facts.
- Academic performance against KKM.

Behavior notes should not automatically affect status.

Future candidate input:

- Assignment/submission lateness in Phase 2.

Teacher manual flags may be considered, but system-generated status should not become a hidden behavior score.

### Behavior and Student Notes Baseline

SOKA should not impose a numeric behavior point system.

The migrated baseline is:

- Qualitative student notes only.
- No points.
- No leaderboard.
- No automatic behavior contribution to student risk/status.
- No counselor-style SLA or case-management workflow in MVP.

Session 2 confirms this baseline as a decision.

Session 2 adds a publication rule:

- Catatan Siswa can be internal-only.
- Catatan Siswa can be shared/published to parents.
- Only shared/published notes appear in the parent experience.
- Raw internal observations should not automatically become parent-facing communication.

### Role Staging Baseline

Session 2 confirms the MVP role staging:

- Guru / Wali Kelas as MVP primary operator.
- Orang Tua as MVP parent-facing consumer.
- Siswa prepared in architecture but activated in Phase 2, especially for digital assignments and learning materials.

This preserves the 3-role ecosystem direction without making the first MVP carry the cost of student-facing workflows.

### Kepala Sekolah

Session 2 confirms Kepala Sekolah as post-MVP/backlog.

Important distinction:

- Kepala Sekolah may still matter in sales, approval, renewal, and school leadership conversations.
- MVP can include simple reporting or demo artifacts for leadership.
- MVP should not activate a full principal role, dashboard, approval workflow, or KPI analytics module.

### TU / Admin Sekolah

Session 2 confirms TU/Admin Sekolah is not an active MVP product role.

However, MVP needs minimal admin capability for onboarding:

- Create school.
- Import or create students.
- Link parent accounts to children.
- Assign students to classes.
- Assign teachers to classes.
- Set basic school/class configuration needed for attendance and parent visibility.

This capability can be handled by a SOKA internal operator, setup script, or limited admin panel. It should not become a full TU module in MVP.

### Orang Tua MVP Areas

Session 2 confirms five parent MVP areas:

| Area | Purpose |
|---|---|
| Beranda Anak | Parent home for current child status and daily reassurance. |
| Absensi | Attendance visibility and history. |
| Nilai/Raport | Academic visibility appropriate for parents. |
| Pesan Guru | Communication with wali kelas/guru. |
| Notifikasi | Timely alerts for attendance, messages, and important updates. |

Excluded from Orang Tua MVP:

- Pembayaran.
- Tugas.
- Materi.
- Forum.
- Feedback/surveys.
- Parent premium subscription.

### Phase 2 Baseline

The migrated Phase 2 package is "Ekosistem Belajar":

- Student login.
- Digital assignments: teacher creates, student submits, teacher grades.
- Learning material repository consumed by students.
- RPP and heavier teaching tools remain undecided.

## Delivery Workflow Baseline

SOKA Lama's overview described a layered working rhythm that fits the 120x operating model:

| Layer | Purpose | Output |
|---|---|---|
| Lapis 0: Peta | Maintain product map and durable direction. | Planning/domain/decision docs. |
| Lapis 1: Spec Sprint | Pick one feature or slice and define current state to target state. | Sprint requirements and acceptance criteria. |
| Lapis 2: Eksekusi | Build the approved slice. | Code change. |
| Lapis 3: Verifikasi | Check result against scope and update state/docs. | Validation notes and updated planning files. |

For SOKA Baru, this maps to the 120x sprint structure rather than the old `SOKA-MAP` folder.
