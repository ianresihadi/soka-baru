# SOKA Context

This file captures canonical product language for SOKA Baru. It should stay understandable to a school operator, not only to engineers.

## Canonical Terms

| Term | Meaning |
|---|---|
| SOKA Baru | The new, cleanly documented version of SOKA being planned in `C:\Users\USER\Documents\SOKA`. |
| SOKA Lama | The existing application in `C:\Users\USER\Desktop\Cowork Station\Projects\SOKA`. It is a reference and migration source, not the new source of truth. |
| Project Operating Folder | The folder that holds durable project truth: planning, decisions, domain language, risks, sprint files, and future implementation. For this project, it is `C:\Users\USER\Documents\SOKA`. |
| Source of Truth | The written project artifacts in this folder, especially `planning/DECISIONS.md`, `planning/DOMAIN.md`, and active sprint files. |
| Reference Material | External material used for discovery, such as SOKA Lama, 120x Operators Kit, and the Super Apps Sekolah deck. |
| Migration Source | Existing material that can inform SOKA Baru only after it is reviewed, summarized, and moved into the new planning structure. SOKA Lama's `docs/SOKA-MAP` is a migration source. |
| Architect Layer | The planning layer that clarifies business goals, users, workflows, scope, risks, and acceptance criteria before code is written. |
| Builder Layer | The implementation layer that builds from approved planning artifacts. |
| Loop Harian Inti | The small daily operating loop that should make SOKA useful without overloading teachers. Current migrated baseline: absensi pagi plus pesan orang tua. |
| Adoption Wedge | The first repeated workflow that gets a school to actually use SOKA. Current decision: morning attendance. |
| Papan Pagi Wali Kelas | The teacher dashboard that guides the morning loop in this order: today's attendance status, unreplied parent messages, students needing attention, and today's teaching schedule. |
| Catatan Siswa | Qualitative student notes. This replaces numeric behavior scoring, intervention case management, and scattered teacher notes in the SOKA Lama MVP baseline. Notes can be internal-only or shared/published to parents. |
| Nilai & Raport | A combined academic workflow that replaces separate Buku Nilai and Akademik/Raport menus in the SOKA Lama MVP baseline. |
| SD Swasta Menengah | The working target segment for SOKA: Indonesian private elementary schools with enough willingness to pay for digital operations, but usually without a mature internal IT team. |
| B2B Sekolah | The working business model: schools or foundations pay for SOKA; parents use the parent-facing app as part of the school service. |
| Relic | A feature, route, module, or concept from SOKA Lama that should not automatically enter SOKA Baru because it does not serve the target school workflow, is unfinished, duplicates another feature, or belongs to a later phase. |
| Mothball | A feature or code path that may be useful later but should stay inactive until a later phase explicitly reactivates it. |
| Hide From Menu | A feature that can remain technically accessible for internal testing or demo, but is not promoted to everyday users. |

## Current Product Frame

SOKA Baru is a school operating app for Indonesian private elementary schools. The current working assumption is that SOKA Baru should start narrower than the broad Super Apps Sekolah deck and should preserve the strongest decisions from SOKA Lama's `docs/SOKA-MAP`.

## Product North Star

SOKA helps private elementary schools look more transparent, responsive, and orderly in parents' eyes without adding administrative burden for teachers.

SOKA Lama's `docs/SOKA-MAP` should not be copied raw into SOKA Baru. Durable content should be migrated into the new 120x-style structure:

- `planning/DOMAIN.md` for school roles, workflows, terms, and business context.
- `planning/DECISIONS.md` for scope and architecture decisions that should govern future work.
- `planning/QUESTIONS.md` for unresolved conflicts and tensions.
- `planning/GRILL-SESSIONS.md` for grill sequencing and session agendas.

## Migrated Baseline From `30-core-loop.md`

The first migrated baseline from SOKA Lama is:

- SOKA's daily use should not exceed roughly 10 minutes for normal teacher operation.
- The daily anchor is morning attendance.
- The core daily loop is attendance plus parent messages.
- Heavy activities like grade entry, raport, and student notes are weekly, seasonal, or event-driven, not daily.
- Behavior should be recorded qualitatively, not scored with points.
- Objective student status may come from objective data such as attendance and grades, with interpretation thresholds owned by each school.
- The teacher dashboard should become a "papan pagi" rather than a generic analytics dashboard.

## Migrated Context From `00-overview.md`

SOKA is currently framed as:

- A school operating app for Indonesian private elementary schools.
- A B2B product sold to schools or foundations.
- A daily tool for wali kelas / guru.
- A parent-facing transparency and communication channel for orang tua.

SOKA is not currently framed as:

- An enterprise SIS for large institutions, high schools, or universities.
- A full LMS for online learning content.
- A B2C parent subscription product.
- A government education-office reporting platform.

Product filter:

Every proposed feature should answer: does this directly or indirectly serve wali kelas SD, guru SD, orang tua SD, or the school adoption path around them? If not, it is a candidate relic or later-phase module.

## Migrated Guardrails From `90-relic-catalog.md`

SOKA Baru should not inherit SOKA Lama's relic catalog as a literal cleanup backlog. The old file is a warning system.

Current migrated relic guardrails:

- Do not revive a separate Guru Matpel app by default; use one Guru model unless Session 2 reverses this.
- Do not promote Kepala Sekolah dashboard in MVP; keep it post-MVP unless the buyer explicitly needs it.
- Do not promote Pembayaran/finance before a payment-gateway and school-finance decision exists.
- Do not carry mock-data architecture into SOKA Baru production.
- Do not carry demo credentials into production auth.
- Do not add heavy teacher tools like RPP Builder, Master Plan, Asset Hub, or per-period attendance before the core school loop is stable.
- Do not add new super-app modules before cleaning and validating the core role, data, and permission model.

## Tensions To Resolve

- The deck describes a broad super app for many school roles and modules.
- SOKA Lama's latest map narrows the daily loop around wali kelas and orang tua, while keeping siswa as a future ecosystem role.
- The next grill sessions must decide which vision governs the MVP and which modules are postponed.
