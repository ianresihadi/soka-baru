# Sprint 002 Acceptance Criteria

Sprint 002 is complete when:

- Shared database tenancy is implemented or fully scaffolded for the chosen backend.
- School-owned tables have `school_id` or equivalent tenant scope.
- Hono API scaffold exists for protected auth/tenant validation routes.
- Drizzle schema and migrations exist for core auth/membership/role tables.
- Access policies in the backend service/query layer prevent cross-school reads and writes.
- Postgres RLS is documented as implemented defense-in-depth or explicitly deferred with reason.
- Better Auth email/password auth is implemented or scaffolded.
- `school_code` can bind a user to a school during onboarding or first login.
- Membership and role assignment model supports multiple roles per user.
- Tests or documented validation prove School A cannot access School B data.
- Tests or documented validation prove client-supplied `school_id` cannot bypass membership scope.
- `docs/DATA_MODEL.md`, `docs/PERMISSIONS.md`, and `planning/STATE.md` are updated.
