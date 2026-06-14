# Sprint 002 Requirements: Foundation Data/Auth

## Goal

Build the production foundation for multi-school data ownership, authentication, school binding, and role-based access.

## Business Objective

SOKA must support more than one school without cross-school data leakage, while keeping MVP onboarding simple.

## In Scope

- Shared database baseline.
- `school_id` tenant isolation.
- Backend-enforced tenant access policy.
- Postgres Row Level Security as optional defense-in-depth where compatible.
- Email/password auth.
- Better Auth integration.
- Unique `school_code` per school.
- User binding to school through account creation or first login.
- `schools`, `users`, `school_memberships`, and `membership_roles`.
- Preparation for active MVP roles: Guru/Wali Kelas and Orang Tua.
- Architecture space for Siswa as Phase 2.

## Out of Scope

- Parent PWA UI.
- Guru daily loop UI.
- Payments.
- Full TU module.
- Principal dashboard.
- Physical database per school.
- Subdomain-per-school.

## Business Rules

- Each school's data is owned by and isolated for that school.
- Users cannot read or write another school's data.
- A user may have multiple roles in the same school.
- A user may belong to more than one school in the future.
- Siswa is prepared in the model but not activated in MVP.

## Open Details

- Exact deployment host can be decided during implementation.
- RLS should not be treated as the only enforcement layer because SOKA Baru is not using Supabase Auth as its baseline.
