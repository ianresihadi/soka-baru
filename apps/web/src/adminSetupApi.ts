import type { Role } from "@soka/shared";

/**
 * Client for the Admin / Setup workspace. Wraps the existing tenant-scoped
 * `/admin/*` onboarding routes plus the read-only `GET /admin/memberships`
 * helper. Every call sends the session cookie and NEVER sends `school_id` —
 * the server derives tenant context from the session.
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

export interface AdminClass {
  id: string;
  name: string;
  gradeLevel: string | null;
  academicYear: string | null;
}
export interface AdminStudent {
  id: string;
  fullName: string;
  nisn: string | null;
  classId: string | null;
}
export interface TeacherMembership {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  roles: Role[];
}
export interface ParentLinkCode {
  id: string;
  code: string;
  status: string; // active | used | revoked
  studentId: string;
  expiresAt: string;
}
export interface SchoolSettings {
  attendanceCutoffTime: string;
  schoolTimezone: string;
  defaultKkm: number;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `request_failed_${res.status}`;
  } catch {
    return `request_failed_${res.status}`;
  }
}

async function request<T>(
  path: string,
  init: RequestInit | undefined,
  pick: (json: unknown) => T,
): Promise<ApiResult<T>> {
  const res = await fetch(path, { credentials: "include", ...init });
  if (!res.ok) return { ok: false, status: res.status, error: await readError(res) };
  const json = res.status === 204 ? {} : await res.json();
  return { ok: true, data: pick(json) };
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

// --- Classes ---------------------------------------------------------------

export function listClasses() {
  return request("/admin/classes", undefined, (j) => (j as { classes: AdminClass[] }).classes);
}
export function createClass(input: {
  name: string;
  gradeLevel?: string;
  academicYear?: string;
}) {
  return request("/admin/classes", jsonInit("POST", input), (j) => (j as { class: AdminClass }).class);
}

// --- Students --------------------------------------------------------------

export function listStudents() {
  return request("/admin/students", undefined, (j) => (j as { students: AdminStudent[] }).students);
}
export function createStudent(input: { fullName: string; nisn?: string; classId?: string }) {
  return request("/admin/students", jsonInit("POST", input), (j) => (j as { student: AdminStudent }).student);
}
/** Simple bulk: one name per line → `{ fullName }[]`. No spreadsheet parsing. */
export function bulkStudents(names: string[]) {
  const students = names.map((fullName) => ({ fullName }));
  return request(
    "/admin/students/bulk",
    jsonInit("POST", { students }),
    (j) => (j as { count: number }).count,
  );
}
export function assignStudentClass(studentId: string, classId: string) {
  return request(
    `/admin/students/${studentId}/assign-class`,
    jsonInit("POST", { classId }),
    () => true as const,
  );
}

// --- Teacher memberships + assignment --------------------------------------

export function listTeacherMemberships(role?: "guru" | "wali_kelas") {
  const q = role ? `?role=${role}` : "";
  return request(
    `/admin/memberships${q}`,
    undefined,
    (j) => (j as { memberships: TeacherMembership[] }).memberships,
  );
}
export function assignTeacher(
  classId: string,
  input: { membershipId: string; roleInClass: "wali_kelas" | "guru"; subject?: string },
) {
  return request(
    `/admin/classes/${classId}/teachers`,
    jsonInit("POST", input),
    () => true as const,
  );
}

// --- Parent link codes -----------------------------------------------------

export function listLinkCodes() {
  return request(
    "/admin/parent-link-codes",
    undefined,
    (j) => (j as { codes: ParentLinkCode[] }).codes,
  );
}
export function createLinkCode(studentId: string) {
  return request(
    "/admin/parent-link-codes",
    jsonInit("POST", { studentId }),
    (j) => (j as { code: ParentLinkCode }).code,
  );
}
export function revokeLinkCode(codeId: string) {
  return request(
    `/admin/parent-link-codes/${codeId}/revoke`,
    jsonInit("POST", {}),
    () => true as const,
  );
}

// --- School settings -------------------------------------------------------

/** Read settings via /guru/settings (its existing guard already allows admins). */
export function getSettings() {
  return request("/guru/settings", undefined, (j) => (j as { settings: SchoolSettings }).settings);
}
/**
 * Update only the fields the existing PATCH supports (cutoff + timezone).
 * `defaultKkm` is read-only here: the current API does not accept it, and no
 * new write endpoint is in Sprint 008 scope.
 */
export function updateSettings(input: {
  attendanceCutoffTime?: string;
  schoolTimezone?: string;
}) {
  return request(
    "/admin/school-settings",
    jsonInit("PATCH", input),
    (j) => (j as { settings: SchoolSettings }).settings,
  );
}
