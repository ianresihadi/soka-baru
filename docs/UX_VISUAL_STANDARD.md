# UX and Visual Standard

## Principle

SOKA Baru should feel:

**Hangat, ramah, tertib, dan operasional.**

Meaning:

- Hangat: human, school-friendly, not cold enterprise software.
- Ramah: easy to understand for teachers and parents.
- Tertib: organized, clear, and trustworthy.
- Operasional: built for repeated daily work, not marketing spectacle.

## Product Fit

SOKA is not a landing page, social app, or generic super-app dashboard.

The visual system must support:

- Fast teacher workflows.
- Parent reassurance.
- School trust.
- Clear daily status.
- Low cognitive load.

More detailed UX rules will be added during Session 8.

## Teacher Dashboard

The Guru/Wali Kelas dashboard is task-first, not KPI-first.

Primary order:

1. Status Absensi Hari Ini.
2. Pesan Ortu Belum Dibalas.
3. Siswa Perlu Perhatian.
4. Jadwal Mengajar Hari Ini.

Rules:

- Prioritize actions the teacher can complete now.
- KPI summaries may appear only as small supporting context.
- Avoid analytics-heavy composition in the morning dashboard.
- The dashboard should be scannable quickly before or during class.

## Parent Experience

The parent experience is reassurance-first, not data-dump.

Parent home should answer quickly:

- Is my child present?
- Is there an important message?
- Is there a new grade or note?
- Is there anything I need to do?

Rules:

- Keep the first screen calm and clear.
- Put details behind summaries.
- Avoid dense tables on the main parent home.
- Prioritize status, trust, and next action.

## Density By Role

Guru/Wali Kelas:

- Dense-but-calm.
- Tables, filters, status indicators, and quick actions are appropriate.
- Avoid empty decorative layouts that waste working space.

Orang Tua:

- Simple-card summary.
- Show the most important child status and next action first.
- Avoid admin-dashboard density.

Do not force one generic layout system across both roles.

## Sprint 010 Frontend Conventions (apps/web)

Sprint 010 productized the web UI. Concrete conventions now in code:

### Tokens

- Tailwind v3 with a `brand` indigo scale (`tailwind.config.js`); primary action =
  `brand-600`.
- Warm-neutral page surface (`bg-stone-50`) set in `apps/web/src/index.css`; cards
  are white with a subtle `shadow-card` and `rounded-xl2` (~14px) corners.
- Consistent focus ring (`ring-brand-400`) applied globally via `*:focus-visible`.

### Shared primitives (`apps/web/src/components/ui.tsx`)

`Button` (primary/secondary/ghost/danger × sm/md), `Card`, `SectionHeader`
(supports a numbered `step` badge for the Papan Pagi order), `Badge`, `Notice`,
`Input`, `Select`, `Field` (label + hint + error), `EmptyState`, `Loading`, and
`NavChips`. Reuse these instead of ad-hoc utility-class clusters.

### Status → label/tone mapping (`apps/web/src/components/status.ts`)

Raw backend enums are never shown to users. Helpers map them to Indonesian
labels + a semantic tone (badge colour): attendance (`hadir`→success,
`terlambat`→warning, `alpa`→danger, `sakit`/`izin`→info), attendance completion,
grade/note visibility, KKM met/below, parent-link-code status, and workspace
labels. Tones: `neutral|brand|success|warning|danger|info`.

### Layout rules

- Shell width caps at `max-w-4xl` (teacher/admin) and `max-w-md` (parent,
  mobile-first). Sticky header shows SOKA + school + active-workspace badge;
  on mobile the school context drops to a second line so nothing overflows.
- Role switcher renders only the workspaces a user actually has (segmented,
  stable width). Sign-out keeps the Sprint 007 behavior (local state cleared
  only after the server sign-out succeeds; error + retry otherwise).
- Teacher Papan Pagi keeps the fixed numbered order (1 Absensi status, 2 Pesan
  Ortu, 3 Siswa Perlu Perhatian, 4 Jadwal); attendance uses tone-coloured
  segmented status buttons with a "Tersimpan" badge per student.
- Parent home leads with a reassurance summary card (green when calm, amber when
  action is needed) before detail cards. Only published grades/notes appear.
- Avoid: heavy UI frameworks, decorative gradients/orbs/hero sections, nested
  cards, dead navigation, and raw enum/log text in the UI.
