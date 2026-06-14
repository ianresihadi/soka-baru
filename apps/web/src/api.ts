import type { MembershipSummary, Role } from "@soka/shared";

/**
 * Thin client for the SOKA API used by the app shell. All calls send the
 * Better Auth session cookie via `credentials: "include"`. school_id is never
 * sent by the client — the server derives tenant context from the session.
 */

const TEACHER_ROLES: readonly Role[] = [
  "guru",
  "wali_kelas",
  "admin_sekolah",
  "soka_internal",
];

export interface Session {
  userId: string;
}

async function jsonOrNull<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/** Returns the current session, or null when unauthenticated (401). */
export async function getSession(): Promise<Session | null> {
  const res = await fetch("/me", { credentials: "include" });
  return jsonOrNull<Session>(res);
}

export async function getMemberships(): Promise<MembershipSummary[]> {
  const res = await fetch("/me/memberships", { credentials: "include" });
  const data = await jsonOrNull<{ memberships: MembershipSummary[] }>(res);
  return data?.memberships ?? [];
}

export interface SignInResult {
  ok: boolean;
  error?: string;
}

/** Sign in with Better Auth's email/password route. */
export async function signInEmail(
  email: string,
  password: string,
): Promise<SignInResult> {
  const res = await fetch("/api/auth/sign-in/email", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) return { ok: true };
  if (res.status === 401 || res.status === 403) {
    return { ok: false, error: "Email atau kata sandi salah." };
  }
  return { ok: false, error: `Gagal masuk (${res.status}). Coba lagi.` };
}

/**
 * Sign out using Better Auth's real sign-out route, which clears the server
 * session. Returns true on success. There is no client-only fake sign-out.
 */
export async function signOut(): Promise<boolean> {
  const res = await fetch("/api/auth/sign-out", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  return res.ok;
}

/** Roles that may use the Admin / Setup workspace. */
const ADMIN_ROLES: readonly Role[] = ["admin_sekolah", "soka_internal"];

export type Workspace = "teacher" | "parent" | "admin";

export interface WorkspaceAccess {
  teacher: boolean;
  parent: boolean;
  admin: boolean;
}

/** Decide which workspaces a user can see from their membership roles. */
export function deriveWorkspaceAccess(
  memberships: MembershipSummary[],
): WorkspaceAccess {
  const roles = new Set<Role>(memberships.flatMap((m) => m.roles));
  return {
    teacher: TEACHER_ROLES.some((r) => roles.has(r)),
    parent: roles.has("orang_tua"),
    admin: ADMIN_ROLES.some((r) => roles.has(r)),
  };
}

/** Ordered list of workspaces the user can open (admin last). */
export function availableWorkspaces(access: WorkspaceAccess): Workspace[] {
  const list: Workspace[] = [];
  if (access.teacher) list.push("teacher");
  if (access.parent) list.push("parent");
  if (access.admin) list.push("admin");
  return list;
}
