# Existing Code Salvage

Session 7 defines how SOKA Baru treats the existing SOKA app.

Source app:

`C:\Users\USER\Desktop\Cowork Station\Projects\SOKA`

## Principle

Do not migrate SOKA Lama wholesale.

Every old area should be classified before implementation work.

## Labels

| Label | Meaning |
|---|---|
| Keep Concept | The idea/workflow is retained, but implementation may change. |
| Migrate Code | Existing code can be brought forward with adjustments. |
| Rebuild Fresh | The concept is useful, but old implementation should not be copied. |
| Reference Only | Useful as an example, benchmark, or UX reference only. |
| Discard | Do not bring forward. |

## Status

Session 7 has decided the first salvage area.

## First Salvage Area

Start with Wali Kelas/Guru MVP screens:

| Area | Reason |
|---|---|
| Dashboard | Must become Papan Pagi and guide the daily loop. |
| Absensi | First adoption wedge and core data source. |
| Daftar Siswa | Roster and student status surface. |
| Pesan Ortu | Daily responsiveness channel. |
| Nilai dasar | Parent transparency and objective status input. |
| Catatan Siswa | Qualitative notes with publication status. |
| Jadwal Mengajar | Daily orientation support. |

Do not classify parent app, admin, or Phase 2 modules before this first pass.

## Default Stance For First Salvage Area

Default for Wali Kelas/Guru MVP screens:

**Keep Concept / Rebuild Fresh**

Implications:

- Keep useful product ideas and interaction patterns.
- Use old screens as reference for flows, copy, and component ideas.
- Do not directly migrate files by default.
- Only migrate code after an explicit audit shows it does not carry mock data, relic assumptions, old auth, or incompatible role/data structure.
