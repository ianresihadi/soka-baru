# Sprint 003 Acceptance Criteria

Sprint 003 is complete when:

- Drizzle schema and migration exist for onboarding tables.
- A school admin/setup user can create classes for their own school.
- A school admin/setup user can create students for their own school.
- A simple student import path exists or is explicitly deferred with a documented alternative for creating students.
- Students can be assigned to classes in the same school.
- Guru/Wali Kelas memberships can be assigned to classes in the same school.
- Parent invitation/link codes can be generated for students.
- Parent invitation/link codes are school-scoped, status-tracked, and reject invalid/used/expired/cross-school use.
- Parent memberships can redeem valid link codes and become linked to students.
- Parents can list their linked students.
- Cross-school assignment attempts are rejected for students, classes, teachers, parents, and link codes.
- Privileged roles are not self-assigned through public endpoints.
- Existing Sprint 002 auth/tenant tests still pass.
- New tests cover admin onboarding and parent-student link safety.
- `docs/API.md`, `docs/DATA_MODEL.md`, `docs/PERMISSIONS.md`, `docs/VALIDATION.md`, and `planning/STATE.md` are updated.
- `planning/sprints/003-admin-onboarding-minimal/completion-notes.md` records what was built and what remains.
