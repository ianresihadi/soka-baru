import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import type { Role, TenantContext } from "@soka/shared";
import type { Database } from "./client";
import { TenantViolationError } from "./repositories";
import {
  auditEvents,
  classes,
  membershipRoles,
  parentLinkCodes,
  parentStudentLinks,
  schoolMemberships,
  schools,
  students,
  teacherAssignments,
  user,
} from "./schema";

const DEFAULT_LINK_CODE_TTL_DAYS = 14;

// Crockford Base32 alphabet (no I, L, O, U) to avoid ambiguous characters.
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function generateCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return out;
}

export interface AuditEventInput {
  schoolId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function recordAuditEvent(db: Database, e: AuditEventInput) {
  await db.insert(auditEvents).values({
    schoolId: e.schoolId,
    actorUserId: e.actorUserId ?? null,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId ?? null,
    metadata: e.metadata ?? null,
  });
}

// ---------------------------------------------------------------------------
// Platform-level (soka_internal): school creation + admin assignment.
// ---------------------------------------------------------------------------

export type CreateSchoolResult =
  | { ok: true; school: typeof schools.$inferSelect; membershipId?: string }
  | { ok: false; reason: "school_code_taken" | "admin_user_not_found" };

/**
 * Create a school and (optionally) bind an admin in a single transaction.
 *
 * If `adminUserId` is provided but does not exist, NO school is created — the
 * transaction validates the user first and aborts, so a bad adminUserId can
 * never leave an orphan school behind.
 */
export async function createSchool(
  db: Database,
  input: { name: string; schoolCode: string; adminUserId?: string },
): Promise<CreateSchoolResult> {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(schools)
      .where(eq(schools.schoolCode, input.schoolCode));
    if (existing[0]) return { ok: false, reason: "school_code_taken" };

    if (input.adminUserId) {
      const found = await tx
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, input.adminUserId));
      if (!found[0]) return { ok: false, reason: "admin_user_not_found" };
    }

    const inserted = await tx
      .insert(schools)
      .values({ name: input.name, schoolCode: input.schoolCode })
      .returning();
    const school = inserted[0]!;

    let membershipId: string | undefined;
    if (input.adminUserId) {
      const m = await tx
        .insert(schoolMemberships)
        .values({ schoolId: school.id, userId: input.adminUserId })
        .returning();
      membershipId = m[0]!.id;
      await tx
        .insert(membershipRoles)
        .values({ membershipId, role: "admin_sekolah" })
        .onConflictDoNothing();
    }

    return { ok: true, school, membershipId };
  });
}

/** Bind a user as admin_sekolah of a school (idempotent). */
export async function assignSchoolAdmin(
  db: Database,
  schoolId: string,
  userId: string,
): Promise<{ membershipId: string }> {
  const existing = await db
    .select()
    .from(schoolMemberships)
    .where(
      and(
        eq(schoolMemberships.userId, userId),
        eq(schoolMemberships.schoolId, schoolId),
      ),
    );
  let membershipId = existing[0]?.id;
  if (!membershipId) {
    const inserted = await db
      .insert(schoolMemberships)
      .values({ schoolId, userId })
      .returning();
    membershipId = inserted[0]!.id;
  }
  await db
    .insert(membershipRoles)
    .values({ membershipId, role: "admin_sekolah" })
    .onConflictDoNothing();
  return { membershipId };
}

// ---------------------------------------------------------------------------
// Tenant-scoped onboarding (admin_sekolah / soka_internal within their school).
// Every function derives school_id from ctx and verifies that any client-
// supplied foreign key belongs to the same tenant before using it.
// ---------------------------------------------------------------------------

export async function createClass(
  db: Database,
  ctx: TenantContext,
  input: { name: string; gradeLevel?: string; academicYear?: string },
) {
  const inserted = await db
    .insert(classes)
    .values({
      schoolId: ctx.schoolId,
      name: input.name,
      gradeLevel: input.gradeLevel ?? null,
      academicYear: input.academicYear ?? null,
    })
    .returning();
  return inserted[0]!;
}

export function listClasses(db: Database, ctx: TenantContext) {
  return db.select().from(classes).where(eq(classes.schoolId, ctx.schoolId));
}

export async function createStudent(
  db: Database,
  ctx: TenantContext,
  input: { fullName: string; nisn?: string; classId?: string },
) {
  if (input.classId) {
    const owned = await classInTenant(db, ctx, input.classId);
    if (!owned) throw new TenantViolationError(ctx.schoolId, input.classId);
  }
  const inserted = await db
    .insert(students)
    .values({
      schoolId: ctx.schoolId,
      fullName: input.fullName,
      nisn: input.nisn ?? null,
      classId: input.classId ?? null,
    })
    .returning();
  return inserted[0]!;
}

export async function createStudents(
  db: Database,
  ctx: TenantContext,
  rows: { fullName: string; nisn?: string; classId?: string }[],
) {
  const created: (typeof students.$inferSelect)[] = [];
  for (const row of rows) {
    created.push(await createStudent(db, ctx, row));
  }
  return created;
}

export function listStudents(db: Database, ctx: TenantContext) {
  return db.select().from(students).where(eq(students.schoolId, ctx.schoolId));
}

export type AssignResult = { ok: true } | { ok: false; reason: string };

export async function assignStudentToClass(
  db: Database,
  ctx: TenantContext,
  studentId: string,
  classId: string,
): Promise<AssignResult> {
  if (!(await studentInTenant(db, ctx, studentId)))
    return { ok: false, reason: "student_not_found" };
  if (!(await classInTenant(db, ctx, classId)))
    return { ok: false, reason: "class_not_found" };
  await db
    .update(students)
    .set({ classId, updatedAt: new Date() })
    .where(eq(students.id, studentId));
  return { ok: true };
}

export async function assignTeacherToClass(
  db: Database,
  ctx: TenantContext,
  classId: string,
  membershipId: string,
  roleInClass: "wali_kelas" | "guru",
  subject?: string,
): Promise<AssignResult> {
  if (!(await classInTenant(db, ctx, classId)))
    return { ok: false, reason: "class_not_found" };
  if (!(await membershipInTenant(db, ctx, membershipId)))
    return { ok: false, reason: "membership_not_found" };
  // The membership must actually be a teacher membership.
  const roles = await db
    .select({ role: membershipRoles.role })
    .from(membershipRoles)
    .where(eq(membershipRoles.membershipId, membershipId));
  const isTeacher = roles.some(
    (r) => r.role === "guru" || r.role === "wali_kelas",
  );
  if (!isTeacher) return { ok: false, reason: "membership_not_teacher" };

  await db
    .insert(teacherAssignments)
    .values({
      schoolId: ctx.schoolId,
      classId,
      membershipId,
      roleInClass,
      subject: subject ?? null,
    })
    .onConflictDoNothing();
  return { ok: true };
}

/**
 * Narrow, read-only listing of same-tenant TEACHER-ELIGIBLE memberships for the
 * Admin Setup UI's teacher-assignment selector. NOT general user management:
 * - scoped strictly to ctx.schoolId (server-derived; no client school_id);
 * - returns only the minimal fields needed to pick a membership;
 * - always filtered to teacher roles. When `roleFilter` is omitted it defaults
 *   to all teacher roles (`guru`/`wali_kelas`), so parent-only and admin-only
 *   memberships are never returned. A narrower `roleFilter` (e.g. just `guru`)
 *   restricts further.
 */
export interface TenantMembershipSummary {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  roles: Role[];
}

/** Roles eligible for class teacher assignment. */
const TEACHER_ELIGIBLE_ROLES: readonly Role[] = ["guru", "wali_kelas"];

export async function listTeacherMembershipsForTenant(
  db: Database,
  ctx: TenantContext,
  roleFilter?: Role[],
): Promise<TenantMembershipSummary[]> {
  // Default to teacher-eligible roles; an explicit filter narrows within them.
  const effectiveFilter =
    roleFilter && roleFilter.length > 0 ? roleFilter : TEACHER_ELIGIBLE_ROLES;

  const rows = await db
    .select({
      membershipId: schoolMemberships.id,
      userId: user.id,
      name: user.name,
      email: user.email,
    })
    .from(schoolMemberships)
    .innerJoin(user, eq(schoolMemberships.userId, user.id))
    .where(eq(schoolMemberships.schoolId, ctx.schoolId));

  const result: TenantMembershipSummary[] = [];
  for (const row of rows) {
    const roleRows = await db
      .select({ role: membershipRoles.role })
      .from(membershipRoles)
      .where(eq(membershipRoles.membershipId, row.membershipId));
    const roles = roleRows.map((r) => r.role as Role);
    if (!roles.some((r) => effectiveFilter.includes(r))) continue;
    result.push({ ...row, roles });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Parent link codes.
// ---------------------------------------------------------------------------

export type CreateLinkCodeResult =
  | { ok: true; code: typeof parentLinkCodes.$inferSelect }
  | { ok: false; reason: "student_not_found" };

export async function createParentLinkCode(
  db: Database,
  ctx: TenantContext,
  studentId: string,
  expiresInDays = DEFAULT_LINK_CODE_TTL_DAYS,
): Promise<CreateLinkCodeResult> {
  if (!(await studentInTenant(db, ctx, studentId)))
    return { ok: false, reason: "student_not_found" };

  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  // Generate a unique code, retrying on the (rare) unique-constraint conflict.
  for (let attempt = 0; attempt < 5; attempt++) {
    const inserted = await db
      .insert(parentLinkCodes)
      .values({
        schoolId: ctx.schoolId,
        studentId,
        code: generateCode(),
        expiresAt,
        createdByUserId: ctx.userId,
      })
      .onConflictDoNothing()
      .returning();
    if (inserted[0]) {
      await recordAuditEvent(db, {
        schoolId: ctx.schoolId,
        actorUserId: ctx.userId,
        action: "parent_link_code.created",
        entityType: "parent_link_code",
        entityId: inserted[0].id,
        metadata: { studentId },
      });
      return { ok: true, code: inserted[0] };
    }
  }
  throw new Error("Failed to generate a unique parent link code");
}

export function listParentLinkCodes(db: Database, ctx: TenantContext) {
  return db
    .select()
    .from(parentLinkCodes)
    .where(eq(parentLinkCodes.schoolId, ctx.schoolId));
}

export async function revokeParentLinkCode(
  db: Database,
  ctx: TenantContext,
  codeId: string,
): Promise<AssignResult> {
  const rows = await db
    .select()
    .from(parentLinkCodes)
    .where(
      and(
        eq(parentLinkCodes.id, codeId),
        eq(parentLinkCodes.schoolId, ctx.schoolId),
      ),
    );
  if (!rows[0]) return { ok: false, reason: "code_not_found" };
  await db
    .update(parentLinkCodes)
    .set({ status: "revoked" })
    .where(eq(parentLinkCodes.id, codeId));
  return { ok: true };
}

export type RedeemResult =
  | { ok: true; schoolId: string; studentId: string; membershipId: string }
  | {
      ok: false;
      reason: "code_not_found" | "code_used" | "code_revoked" | "code_expired";
    };

/**
 * Redeem a parent link code. This is a server-controlled binding path: the
 * school and student come from the code row (server-trusted), never from the
 * client. It legitimately grants the orang_tua role because the school issued
 * the code.
 */
export async function redeemParentLinkCode(
  db: Database,
  userId: string,
  code: string,
  relationship?: string,
): Promise<RedeemResult> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(parentLinkCodes)
      .where(eq(parentLinkCodes.code, code));
    const lc = rows[0];
    if (!lc) return { ok: false, reason: "code_not_found" };
    if (lc.status === "revoked") return { ok: false, reason: "code_revoked" };
    if (lc.status === "used") return { ok: false, reason: "code_used" };
    if (lc.expiresAt.getTime() <= Date.now())
      return { ok: false, reason: "code_expired" };

    // Atomically claim the code: transition active -> used only if it is still
    // active. Under concurrent redeems, the row lock means exactly one caller's
    // UPDATE matches; the loser sees 0 rows and is rejected as code_used. This
    // makes redemption truly single-use even with simultaneous requests.
    const claimed = await tx
      .update(parentLinkCodes)
      .set({ status: "used", redeemedByUserId: userId, redeemedAt: new Date() })
      .where(
        and(
          eq(parentLinkCodes.id, lc.id),
          eq(parentLinkCodes.status, "active"),
        ),
      )
      .returning();
    if (!claimed[0]) return { ok: false, reason: "code_used" };

    // Ensure the parent has a membership in the code's school.
    const existing = await tx
      .select()
      .from(schoolMemberships)
      .where(
        and(
          eq(schoolMemberships.userId, userId),
          eq(schoolMemberships.schoolId, lc.schoolId),
        ),
      );
    let membershipId = existing[0]?.id;
    if (!membershipId) {
      const inserted = await tx
        .insert(schoolMemberships)
        .values({ schoolId: lc.schoolId, userId })
        .returning();
      membershipId = inserted[0]!.id;
    }

    await tx
      .insert(membershipRoles)
      .values({ membershipId, role: "orang_tua" })
      .onConflictDoNothing();

    await tx
      .insert(parentStudentLinks)
      .values({
        schoolId: lc.schoolId,
        studentId: lc.studentId,
        parentMembershipId: membershipId,
        relationship: relationship ?? null,
      })
      .onConflictDoNothing();

    await tx.insert(auditEvents).values({
      schoolId: lc.schoolId,
      actorUserId: userId,
      action: "parent_student_link.created",
      entityType: "parent_student_link",
      entityId: lc.studentId,
      metadata: { via: "link_code", codeId: lc.id },
    });

    return {
      ok: true,
      schoolId: lc.schoolId,
      studentId: lc.studentId,
      membershipId,
    };
  });
}

/** List the students linked to a parent user, across their memberships. */
export async function listChildrenForParent(db: Database, userId: string) {
  const memberships = await db
    .select({ id: schoolMemberships.id })
    .from(schoolMemberships)
    .where(eq(schoolMemberships.userId, userId));
  if (memberships.length === 0) return [];
  const membershipIds = memberships.map((m) => m.id);

  return db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      schoolId: students.schoolId,
      classId: students.classId,
      relationship: parentStudentLinks.relationship,
    })
    .from(parentStudentLinks)
    .innerJoin(students, eq(parentStudentLinks.studentId, students.id))
    .where(inArray(parentStudentLinks.parentMembershipId, membershipIds));
}

// ---------------------------------------------------------------------------
// Tenant-ownership checks (used before trusting a client-supplied id).
// ---------------------------------------------------------------------------

async function studentInTenant(db: Database, ctx: TenantContext, id: string) {
  const r = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, id), eq(students.schoolId, ctx.schoolId)));
  return Boolean(r[0]);
}

async function classInTenant(db: Database, ctx: TenantContext, id: string) {
  const r = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, id), eq(classes.schoolId, ctx.schoolId)));
  return Boolean(r[0]);
}

async function membershipInTenant(
  db: Database,
  ctx: TenantContext,
  id: string,
) {
  const r = await db
    .select({ id: schoolMemberships.id })
    .from(schoolMemberships)
    .where(
      and(
        eq(schoolMemberships.id, id),
        eq(schoolMemberships.schoolId, ctx.schoolId),
      ),
    );
  return Boolean(r[0]);
}
