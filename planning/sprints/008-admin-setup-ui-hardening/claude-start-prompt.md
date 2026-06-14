# Claude Start Prompt: Sprint 008 Admin Setup UI Hardening

You are Claude acting as Builder for SOKA Baru.

Open the repo at:

`C:\Users\USER\Documents\SOKA`

Start from:

`planning/sprints/008-admin-setup-ui-hardening/handoff-prompt.md`

Follow the handoff exactly.

First read the required project and sprint files. Then stop and produce the
pre-edit implementation plan only. Do not edit files yet.

Your plan must cover:

1. Current shell/workspace structure.
2. Admin/Setup access for `admin_sekolah`/`soka_internal`.
3. Admin workspace sections/components.
4. Exact APIs used for classes, students, teacher assignment, parent link codes,
   and school settings.
5. Whether a narrow teacher-membership listing backend endpoint is needed.
6. Tests and validation commands.
7. Docs to update.
8. Explicit deferrals.

Non-negotiables:

- no client-supplied `school_id` authority
- no non-admin access to setup workspace
- no full TU/admin module
- no general user management unless explicitly approved as a narrow helper
- no public privileged role self-assignment
- no payments, documents, letters, government reporting, principal analytics,
  student login, learning workflows, broadcast/pengumuman, push, or Sprint 009
- no complex Excel import
- no dead navigation

Wait for Ian's approval before editing files.
