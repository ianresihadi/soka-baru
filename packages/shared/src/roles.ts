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

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
