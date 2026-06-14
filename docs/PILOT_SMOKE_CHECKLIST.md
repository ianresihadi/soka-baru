# Pilot Smoke Checklist

A manual happy-path check for local or live pilot rehearsal. It exercises the
teacher and parent flows built across Sprints 001-006 through the Sprint 007 app
shell.

Prerequisite: complete `docs/SETUP.md` and run `pnpm db:seed`. All credentials
below are **LOCAL DEV ONLY**. Notifications are in-app only — this build does
**not** provide browser or native push.

Seeded references used throughout:

- Teacher: `guru.a@example.com` / `LocalDevPassword123!` (wali kelas of **Kelas 1A**).
- Parent: `multi@example.com` / `LocalDevPassword123!` (parent of **Adinda Putri**).
- Web app: `http://localhost:5173` · API: `http://localhost:8787`.

## Setup

1. [ ] Install dependencies: `pnpm install`.
2. [ ] Configure `.env` (see `docs/SETUP.md`), incl. a live `DATABASE_URL`.
3. [ ] Run migrations: `pnpm db:migrate`.
4. [ ] Run seed: `pnpm db:seed`.
5. [ ] Start API: `pnpm dev:api` (http://localhost:8787).
6. [ ] Start web: `pnpm dev:web` (http://localhost:5173).

## Teacher path

7. [ ] Open `http://localhost:5173` → the **sign-in** surface (`LoginPanel`) is
   shown, not a raw validation console.
8. [ ] Sign in as `guru.a@example.com`. The app shell (`AppShell`) opens with the
   header showing **SD Soka Alpha** and the teacher roles. No role switcher
   (single workspace).
9. [ ] In the teacher workspace (`TeacherWorkspace` → `PapanPagi`), confirm the
   class selector shows **Kelas 1A** and Papan Pagi loads its four sections
   (Status Absensi, Pesan Ortu Belum Dibalas, Siswa Perlu Perhatian, Jadwal).
10. [ ] Under **Isi Absensi** (`#absensi`), set **Adinda Putri** to `hadir` (and
    optionally others), then **Simpan absensi**. Expect a success status and the
    Status Absensi section to update.

## Parent path

11. [ ] Click **Keluar** (sign-out), then sign in as `multi@example.com`.
12. [ ] Because this user has both teacher and parent roles, the **role switcher**
    appears. Switch to **Orang Tua**.
13. [ ] In the parent workspace (`ParentWorkspace` → `ParentHome`), confirm the
    linked child **Adinda Putri** is shown with a reassurance summary.
14. [ ] In **Riwayat Absensi** (`#absensi-ortu`), confirm today's attendance
    recorded in step 10 appears (e.g. `Hadir`).

## Grades (publish → parent view)

15. [ ] Sign back in as `guru.a@example.com`, open **Nilai & Catatan**
    (`#nilai-catatan`). Add a grade for **Adinda Putri** (e.g. Matematika, 80/100),
    then **Publish** it.
16. [ ] Sign in as `multi@example.com`, parent workspace → **Nilai** (`#nilai-ortu`).
    Confirm the published grade appears with its KKM result. Confirm **draft**
    grades (any not published) do **not** appear.

## Notes (publish → parent view)

17. [ ] As `guru.a@example.com`, in **Catatan Siswa**, add a note for **Adinda
    Putri**, then **Bagikan** (publish) it.
18. [ ] As `multi@example.com`, parent workspace → **Catatan dari Guru**
    (`#catatan-ortu`). Confirm the published note appears. Confirm **internal**
    (unpublished) notes do **not** appear.

## Parent message

19. [ ] As `multi@example.com`, in **Pesan Guru** (`#pesan-guru`), type a message
    and **Kirim**.
20. [ ] As `guru.a@example.com`, open Papan Pagi → **Pesan Ortu Belum Dibalas**
    (`#pesan-ortu`). Confirm the unreplied count reflects the new parent message.
    (A full teacher reply UI is not part of this build; the teacher surface shows
    the unreplied status. The reply API exists at `POST /guru/messages/:threadId/reply`.)

## Done

21. [ ] Click **Keluar** and confirm you are returned to the sign-in surface
    (server session cleared).
