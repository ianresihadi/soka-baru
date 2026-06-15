# Pilot Smoke Checklist

A manual happy-path check for local or live pilot rehearsal. It exercises the
teacher and parent flows built across Sprints 001-006 through the Sprint 007 app
shell.

Prerequisite: complete `docs/SETUP.md` and run `pnpm db:seed`. All credentials
below are **LOCAL DEV ONLY**. Notifications are in-app only — this build does
**not** provide browser or native push.

Seeded references used throughout:

- Admin: `admin.a@example.com` / `LocalDevPassword123!` (`admin_sekolah`, SD Soka Alpha).
- Teacher: `guru.a@example.com` / `LocalDevPassword123!` (wali kelas of **Kelas 1A**).
- Parent: `multi@example.com` / `LocalDevPassword123!` (parent of **Adinda Putri**).
- Web app: `http://localhost:5173` · API: `http://localhost:8787`.

## Setup

1. [ ] Install dependencies: `pnpm install`.
2. [ ] Configure `.env` (see `docs/SETUP.md`), incl. a live `DATABASE_URL`.
3. [ ] Validate the environment: `pnpm check:env` (must pass — no missing/placeholder values).
4. [ ] Run migrations: `pnpm db:migrate`.
5. [ ] Run seed: `pnpm db:seed`.
6. [ ] Start API: `pnpm dev:api` (http://localhost:8787).
7. [ ] Start web: `pnpm dev:web` (http://localhost:5173).

## Scripted smoke (run before the manual checks)

Run the HTTP smoke check while the API is running and the database is seeded:

```bash
pnpm smoke:live        # set SOKA_API_URL to target a non-default API URL
```

S1. [ ] `GET /health` returns ok.
S2. [ ] Admin (`admin.a@example.com`) signs in over Better Auth and the session
    cookie is preserved.
S3. [ ] `/me` and `/me/memberships` confirm the admin session (`admin_sekolah`).
S4. [ ] An admin-only route (`/admin/memberships`) succeeds.
S5. [ ] Sign-out clears the session (`/me` then returns 401).
S6. [ ] Teacher (`guru.a@`) loads `/guru/classes` (Kelas 1A); parent (`multi@`)
    loads `/parent/children` (Adinda Putri).

The script exits non-zero and prints a classified reason on failure (API not
running, seed not run, wrong credentials, auth/cookie/session failure, or
permission failure). It is read-only apart from normal auth session records.
It does **not** claim browser/native push is available.

The manual paths below remain the human walkthrough of the same flows in the UI.

## Admin setup path (Sprint 008)

The seed already creates a class, roster, teacher assignment, and parent link.
This path verifies the Admin / Setup workspace can do the same setup manually for
a fresh school. It is optional before the teacher/parent paths below.

A. [ ] Sign in as `admin.a@example.com`. The shell shows the **role switcher**
   with an **Admin / Setup** option (only admins see it); open it.
B. [ ] **Kelas** (`#setup-classes`): create a class (e.g. "Kelas 2A"); confirm it
   appears in the list.
C. [ ] **Siswa** (`#setup-students`): create a single student, then add a few via
   the bulk textarea (one name per line); assign one student to "Kelas 2A".
D. [ ] **Penugasan Guru** (`#setup-teachers`): assign `guru.a` (shown in the
   teacher selector) to "Kelas 2A" as `wali_kelas` or `guru`. Confirm a
   non-teacher membership is rejected with a clear message.
E. [ ] **Kode Tautan Ortu** (`#setup-codes`): generate a link code for a student,
   confirm it appears with status `active`, copy it, then revoke it.
F. [ ] **Pengaturan Sekolah** (`#setup-settings`): change the attendance cutoff,
   timezone, and **Default KKM** and save; confirm success. An invalid timezone
   or an out-of-range KKM (e.g. 150) shows a clear error and is not saved.
G. [ ] Confirm a non-admin (e.g. `guru.a@example.com`) does **not** see the Admin /
   Setup option.

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

## Visual walkthrough (Sprint 010)

After `pnpm db:seed`, the School A demo child **Adinda Putri** has seeded content
so the pages are not empty: one attendance record (today, Hadir), one published
grade (Matematika — Ulangan Harian 1, 85/100), one published note, and one
parent→teacher message. Use it to judge product feel.

Check these viewports for each surface (no text overflow, overlap, unreadable
contrast, broken buttons, or dead navigation):

- Desktop/laptop ~1366×768.
- Mobile ~390×844.

V1. [ ] Login screen is centered, warm, and branded (not a raw form).
V2. [ ] Teacher Papan Pagi shows the numbered order (1 Status Absensi → 2 Pesan
    Ortu → 3 Siswa Perlu Perhatian → 4 Jadwal), a progress bar, and tone-coloured
    attendance buttons with "Tersimpan" badges. Usable on mobile.
V3. [ ] Parent home leads with a reassurance summary card, then calm cards for
    notifications, attendance, nilai (published only), catatan (published only),
    and pesan. Mobile-first.
V4. [ ] Admin / Setup shows the overview (counts + setup checklist), then Kelas,
    Siswa, Penugasan Guru, Kode Tautan Ortu, and Pengaturan (cutoff/timezone/KKM).
V5. [ ] For a multi-role account, the header role switcher renders only the
    available workspaces and does not overflow on mobile.

Builder visual QA (this environment) used a built-in web server (`vite preview`)
with mocked API responses to screenshot login, teacher, parent, and admin at both
viewports. A live walkthrough still requires `pnpm dev:api` + `pnpm dev:web`
against a seeded database.
