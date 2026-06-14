/**
 * Canonical SOKA role values.
 *
 * All roles exist in the foundation so later sprints do not require a role-model
 * rewrite, but only ACTIVE_MVP_ROLES are wired to product UI in the MVP.
 */
export const ROLES = [
  "guru",
  "wali_kelas",
  "orang_tua",
  "siswa",
  "admin_sekolah",
  "kepala_sekolah",
  "soka_internal",
] as const;

export type Role = (typeof ROLES)[number];

/** Roles that have active product UI in the MVP (Session 2 decision). */
export const ACTIVE_MVP_ROLES: readonly Role[] = ["guru", "wali_kelas", "orang_tua"];

/**
 * Roles a user is allowed to self-assign through the PUBLIC, session-only
 * binding endpoint (`POST /school-bindings/by-code`) just by knowing a
 * `school_code`.
 *
 * Only non-privileged self-service roles belong here. Privileged roles
 * (`guru`, `wali_kelas`, `admin_sekolah`, `kepala_sekolah`, `soka_internal`)
 * must be assigned by seed/internal code or a future admin-controlled
 * onboarding path — never by a client that merely knows the school_code.
 *
 * NOTE: even `orang_tua` self-binding will be tightened to invitation/link
 * codes in a later sprint; for Sprint 002 it is the only self-bindable role.
 */
export const SELF_BINDABLE_ROLES: readonly Role[] = ["orang_tua"];

/** Roles that must never be self-assigned via the public binding endpoint. */
export function isSelfBindableRole(role: Role): boolean {
  return SELF_BINDABLE_ROLES.includes(role);
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
