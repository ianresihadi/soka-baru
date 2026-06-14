import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  GRADE_LIMITS,
  NOTE_LIMITS,
  clampLimit,
  isBelowKkm,
  scorePercent,
  type CreateGradeInput,
  type CreateStudentNoteInput,
  type GradeVisibility,
  type StudentNoteVisibility,
  type TenantContext,
  type UpdateGradeInput,
  type UpdateStudentNoteInput,
} from "@soka/shared";
import type { Database } from "./client";
import { assertCanOperateClass } from "./dailyLoop";
import { getOrCreateSchoolSettings } from "./dailyLoop";
import { assertParentCanAccessStudent, listLinkedChildrenForParent } from "./parentTrust";
import {
  auditEvents,
  grades,
  notifications,
  parentStudentLinks,
  studentNotes,
  students,
} from "./schema";

type Grade = typeof grades.$inferSelect;
type StudentNote = typeof studentNotes.$inferSelect;

export interface GradeDto extends Grade {
  scorePercent: number;
  isBelowKkm: boolean;
}

function toGradeDto(g: Grade): GradeDto {
  return {
    ...g,
    scorePercent: scorePercent(g.score, g.maxScore),
    isBelowKkm: isBelowKkm(g.score, g.maxScore, g.kkm),
  };
}

function isAdminLike(tenant: TenantContext): boolean {
  return tenant.roles.some((r) => r === "admin_sekolah" || r === "soka_internal");
}

type AccessResult =
  | { ok: true }
  | { ok: false; reason: "class_not_found" | "forbidden_class" };

/** Class access for a row whose class_id may be null (then admin-only). */
async function canOperateClass(
  db: Database,
  tenant: TenantContext,
  classId: string | null,
): Promise<AccessResult> {
  if (classId) return assertCanOperateClass(db, tenant, classId);
  return isAdminLike(tenant) ? { ok: true } : { ok: false, reason: "forbidden_class" };
}

async function studentInClass(
  db: Database,
  tenant: TenantContext,
  classId: string,
  studentId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: students.id })
    .from(students)
    .where(
      and(
        eq(students.id, studentId),
        eq(students.classId, classId),
        eq(students.schoolId, tenant.schoolId),
      ),
    );
  return rows.length > 0;
}

/** Notify a student's linked parents, deduped per recipient + dedupe key. */
async function notifyLinkedParents(
  db: Database,
  schoolId: string,
  studentId: string,
  type: string,
  dedupeField: string,
  dedupeValue: string,
  title: string,
  body: string,
  payload: Record<string, unknown>,
): Promise<number> {
  const parents = await db
    .select({ membershipId: parentStudentLinks.parentMembershipId })
    .from(parentStudentLinks)
    .where(
      and(
        eq(parentStudentLinks.studentId, studentId),
        eq(parentStudentLinks.schoolId, schoolId),
      ),
    );
  let created = 0;
  for (const p of parents) {
    const dup = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientMembershipId, p.membershipId),
          eq(notifications.type, type),
          sql`(${notifications.payload}->>${sql.raw(`'${dedupeField}'`)}) = ${dedupeValue}`,
        ),
      );
    if (dup[0]) continue;
    await db.insert(notifications).values({
      schoolId,
      recipientMembershipId: p.membershipId,
      studentId,
      type,
      title,
      body,
      payload,
    });
    created++;
  }
  return created;
}

// ---------------------------------------------------------------------------
// Grades
// ---------------------------------------------------------------------------

export type CreateGradeResult =
  | { ok: true; grade: GradeDto }
  | { ok: false; reason: "class_not_found" | "forbidden_class" | "student_not_in_class" };

export async function createGrade(
  db: Database,
  tenant: TenantContext,
  classId: string,
  input: CreateGradeInput,
): Promise<CreateGradeResult> {
  const access = await assertCanOperateClass(db, tenant, classId);
  if (!access.ok) return access;
  if (!(await studentInClass(db, tenant, classId, input.studentId)))
    return { ok: false, reason: "student_not_in_class" };

  const settings = await getOrCreateSchoolSettings(db, tenant);
  const kkm = input.kkm ?? settings.defaultKkm;
  const maxScore = input.maxScore ?? 100;

  const inserted = await db
    .insert(grades)
    .values({
      schoolId: tenant.schoolId,
      classId,
      studentId: input.studentId,
      subject: input.subject,
      assessmentName: input.assessmentName,
      assessmentDate: input.assessmentDate,
      score: input.score,
      maxScore,
      kkm,
      recordedByMembershipId: tenant.membershipId,
    })
    .returning();
  return { ok: true, grade: toGradeDto(inserted[0]!) };
}

export type GradeMutationResult =
  | { ok: true; grade: GradeDto }
  | { ok: false; reason: "grade_not_found" | "forbidden_class" | "class_not_found" };

export async function updateGrade(
  db: Database,
  tenant: TenantContext,
  gradeId: string,
  input: UpdateGradeInput,
): Promise<GradeMutationResult> {
  const rows = await db
    .select()
    .from(grades)
    .where(and(eq(grades.id, gradeId), eq(grades.schoolId, tenant.schoolId)));
  const existing = rows[0];
  if (!existing) return { ok: false, reason: "grade_not_found" };

  const access = await canOperateClass(db, tenant, existing.classId);
  if (!access.ok) return access;

  const next = {
    subject: input.subject ?? existing.subject,
    assessmentName: input.assessmentName ?? existing.assessmentName,
    assessmentDate: input.assessmentDate ?? existing.assessmentDate,
    score: input.score ?? existing.score,
    maxScore: input.maxScore ?? existing.maxScore,
    kkm: input.kkm ?? existing.kkm,
  };

  return db.transaction(async (tx) => {
    const updated = await tx
      .update(grades)
      .set({ ...next, updatedAt: new Date() })
      .where(eq(grades.id, gradeId))
      .returning();

    // Audit only when changing an already-published grade.
    if (existing.visibilityStatus === "published") {
      await tx.insert(auditEvents).values({
        schoolId: tenant.schoolId,
        actorUserId: tenant.userId,
        action: "grade.updated",
        entityType: "grade",
        entityId: gradeId,
        metadata: {
          before: {
            score: existing.score,
            maxScore: existing.maxScore,
            kkm: existing.kkm,
            subject: existing.subject,
            assessmentName: existing.assessmentName,
            assessmentDate: existing.assessmentDate,
          },
          after: next,
        },
      });
    }
    return { ok: true as const, grade: toGradeDto(updated[0]!) };
  });
}

export type PublishGradeResult =
  | { ok: true; grade: GradeDto; notified: number; alreadyPublished: boolean }
  | { ok: false; reason: "grade_not_found" | "forbidden_class" | "class_not_found" };

export async function publishGrade(
  db: Database,
  tenant: TenantContext,
  gradeId: string,
): Promise<PublishGradeResult> {
  const rows = await db
    .select()
    .from(grades)
    .where(and(eq(grades.id, gradeId), eq(grades.schoolId, tenant.schoolId)));
  const existing = rows[0];
  if (!existing) return { ok: false, reason: "grade_not_found" };

  const access = await canOperateClass(db, tenant, existing.classId);
  if (!access.ok) return access;

  if (existing.visibilityStatus === "published") {
    // Idempotent: no status change, no duplicate notifications.
    return { ok: true, grade: toGradeDto(existing), notified: 0, alreadyPublished: true };
  }

  return db.transaction(async (tx) => {
    const updated = await tx
      .update(grades)
      .set({ visibilityStatus: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(grades.id, gradeId))
      .returning();
    const notified = await notifyLinkedParents(
      tx,
      tenant.schoolId,
      existing.studentId,
      "grade_published",
      "gradeId",
      gradeId,
      "Nilai baru dipublikasikan",
      `${existing.subject} - ${existing.assessmentName}`,
      { gradeId, studentId: existing.studentId },
    );
    return { ok: true as const, grade: toGradeDto(updated[0]!), notified, alreadyPublished: false };
  });
}

export async function listGradesForTeacher(
  db: Database,
  tenant: TenantContext,
  classId: string,
  input: { studentId?: string; subject?: string; visibility?: GradeVisibility; limit?: number },
): Promise<{ ok: false; reason: "class_not_found" | "forbidden_class" } | { ok: true; grades: GradeDto[] }> {
  const access = await assertCanOperateClass(db, tenant, classId);
  if (!access.ok) return access;

  const conds = [eq(grades.schoolId, tenant.schoolId), eq(grades.classId, classId)];
  if (input.studentId) conds.push(eq(grades.studentId, input.studentId));
  if (input.subject) conds.push(eq(grades.subject, input.subject));
  if (input.visibility) conds.push(eq(grades.visibilityStatus, input.visibility));

  const rows = await db
    .select()
    .from(grades)
    .where(and(...conds))
    .orderBy(desc(grades.assessmentDate))
    .limit(clampLimit(input.limit, GRADE_LIMITS));
  return { ok: true, grades: rows.map(toGradeDto) };
}

async function resolveParentChild(
  db: Database,
  userId: string,
  studentId?: string,
): Promise<{ ok: true; studentId: string } | { ok: false; reason: "not_linked" | "no_child" }> {
  if (studentId) {
    const child = await assertParentCanAccessStudent(db, userId, studentId);
    if (!child) return { ok: false, reason: "not_linked" };
    return { ok: true, studentId };
  }
  const children = await listLinkedChildrenForParent(db, userId);
  const first = children[0];
  if (!first) return { ok: false, reason: "no_child" };
  return { ok: true, studentId: first.studentId };
}

export async function listPublishedGradesForParent(
  db: Database,
  userId: string,
  input: { studentId?: string; limit?: number },
): Promise<{ ok: false; reason: "not_linked" | "no_child" } | { ok: true; studentId: string; grades: GradeDto[] }> {
  const resolved = await resolveParentChild(db, userId, input.studentId);
  if (!resolved.ok) return resolved;
  const rows = await db
    .select()
    .from(grades)
    .where(
      and(
        eq(grades.studentId, resolved.studentId),
        eq(grades.visibilityStatus, "published"),
      ),
    )
    .orderBy(desc(grades.assessmentDate))
    .limit(clampLimit(input.limit, GRADE_LIMITS));
  return { ok: true, studentId: resolved.studentId, grades: rows.map(toGradeDto) };
}

export async function getParentGradeSummary(
  db: Database,
  userId: string,
  input: { studentId?: string },
): Promise<{ ok: false; reason: "not_linked" | "no_child" } | { ok: true; studentId: string; total: number; belowKkm: number }> {
  const resolved = await resolveParentChild(db, userId, input.studentId);
  if (!resolved.ok) return resolved;
  const rows = await db
    .select({ score: grades.score, maxScore: grades.maxScore, kkm: grades.kkm })
    .from(grades)
    .where(
      and(
        eq(grades.studentId, resolved.studentId),
        eq(grades.visibilityStatus, "published"),
      ),
    );
  const belowKkm = rows.filter((r) => isBelowKkm(r.score, r.maxScore, r.kkm)).length;
  return { ok: true, studentId: resolved.studentId, total: rows.length, belowKkm };
}

// ---------------------------------------------------------------------------
// Student notes
// ---------------------------------------------------------------------------

export type CreateNoteResult =
  | { ok: true; note: StudentNote }
  | { ok: false; reason: "class_not_found" | "forbidden_class" | "student_not_in_class" };

export async function createStudentNote(
  db: Database,
  tenant: TenantContext,
  classId: string,
  input: CreateStudentNoteInput,
): Promise<CreateNoteResult> {
  const access = await assertCanOperateClass(db, tenant, classId);
  if (!access.ok) return access;
  if (!(await studentInClass(db, tenant, classId, input.studentId)))
    return { ok: false, reason: "student_not_in_class" };

  const inserted = await db
    .insert(studentNotes)
    .values({
      schoolId: tenant.schoolId,
      classId,
      studentId: input.studentId,
      authorMembershipId: tenant.membershipId,
      category: input.category,
      body: input.body,
    })
    .returning();
  return { ok: true, note: inserted[0]! };
}

export type NoteMutationResult =
  | { ok: true; note: StudentNote; notified?: number; alreadyPublished?: boolean }
  | { ok: false; reason: "note_not_found" | "forbidden_class" | "class_not_found" };

export async function updateStudentNote(
  db: Database,
  tenant: TenantContext,
  noteId: string,
  input: UpdateStudentNoteInput,
): Promise<NoteMutationResult> {
  const rows = await db
    .select()
    .from(studentNotes)
    .where(and(eq(studentNotes.id, noteId), eq(studentNotes.schoolId, tenant.schoolId)));
  const existing = rows[0];
  if (!existing) return { ok: false, reason: "note_not_found" };
  const access = await canOperateClass(db, tenant, existing.classId);
  if (!access.ok) return access;

  const next = {
    category: input.category ?? existing.category,
    body: input.body ?? existing.body,
  };
  const contentChanged =
    next.category !== existing.category || next.body !== existing.body;

  return db.transaction(async (tx) => {
    const updated = await tx
      .update(studentNotes)
      .set({ ...next, updatedAt: new Date() })
      .where(eq(studentNotes.id, noteId))
      .returning();
    // Audit when parent-visible content of a published note changes.
    if (existing.visibilityStatus === "published" && contentChanged) {
      await tx.insert(auditEvents).values({
        schoolId: tenant.schoolId,
        actorUserId: tenant.userId,
        action: "student_note.updated",
        entityType: "student_note",
        entityId: noteId,
        metadata: {
          before: { category: existing.category, body: existing.body },
          after: next,
        },
      });
    }
    return { ok: true as const, note: updated[0]! };
  });
}

export async function publishStudentNote(
  db: Database,
  tenant: TenantContext,
  noteId: string,
): Promise<NoteMutationResult> {
  const rows = await db
    .select()
    .from(studentNotes)
    .where(and(eq(studentNotes.id, noteId), eq(studentNotes.schoolId, tenant.schoolId)));
  const existing = rows[0];
  if (!existing) return { ok: false, reason: "note_not_found" };
  const access = await canOperateClass(db, tenant, existing.classId);
  if (!access.ok) return access;

  if (existing.visibilityStatus === "published") {
    return { ok: true, note: existing, notified: 0, alreadyPublished: true };
  }

  return db.transaction(async (tx) => {
    const updated = await tx
      .update(studentNotes)
      .set({ visibilityStatus: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(studentNotes.id, noteId))
      .returning();
    const notified = await notifyLinkedParents(
      tx,
      tenant.schoolId,
      existing.studentId,
      "note_published",
      "noteId",
      noteId,
      "Catatan baru dibagikan",
      "Guru membagikan catatan untuk anak Anda.",
      { noteId, studentId: existing.studentId },
    );
    await tx.insert(auditEvents).values({
      schoolId: tenant.schoolId,
      actorUserId: tenant.userId,
      action: "student_note.published",
      entityType: "student_note",
      entityId: noteId,
      metadata: { category: existing.category },
    });
    return { ok: true as const, note: updated[0]!, notified, alreadyPublished: false };
  });
}

export async function unpublishStudentNote(
  db: Database,
  tenant: TenantContext,
  noteId: string,
): Promise<NoteMutationResult> {
  const rows = await db
    .select()
    .from(studentNotes)
    .where(and(eq(studentNotes.id, noteId), eq(studentNotes.schoolId, tenant.schoolId)));
  const existing = rows[0];
  if (!existing) return { ok: false, reason: "note_not_found" };
  const access = await canOperateClass(db, tenant, existing.classId);
  if (!access.ok) return access;

  if (existing.visibilityStatus === "internal") {
    return { ok: true, note: existing };
  }

  return db.transaction(async (tx) => {
    const updated = await tx
      .update(studentNotes)
      .set({ visibilityStatus: "internal", updatedAt: new Date() })
      .where(eq(studentNotes.id, noteId))
      .returning();
    await tx.insert(auditEvents).values({
      schoolId: tenant.schoolId,
      actorUserId: tenant.userId,
      action: "student_note.unpublished",
      entityType: "student_note",
      entityId: noteId,
      metadata: {},
    });
    return { ok: true as const, note: updated[0]! };
  });
}

export async function listStudentNotesForTeacher(
  db: Database,
  tenant: TenantContext,
  classId: string,
  input: { studentId?: string; visibility?: StudentNoteVisibility; limit?: number },
): Promise<{ ok: false; reason: "class_not_found" | "forbidden_class" } | { ok: true; notes: StudentNote[] }> {
  const access = await assertCanOperateClass(db, tenant, classId);
  if (!access.ok) return access;

  const conds = [eq(studentNotes.schoolId, tenant.schoolId), eq(studentNotes.classId, classId)];
  if (input.studentId) conds.push(eq(studentNotes.studentId, input.studentId));
  if (input.visibility) conds.push(eq(studentNotes.visibilityStatus, input.visibility));

  const notes = await db
    .select()
    .from(studentNotes)
    .where(and(...conds))
    .orderBy(desc(studentNotes.createdAt))
    .limit(clampLimit(input.limit, NOTE_LIMITS));
  return { ok: true, notes };
}

export async function listPublishedStudentNotesForParent(
  db: Database,
  userId: string,
  input: { studentId?: string; limit?: number },
): Promise<{ ok: false; reason: "not_linked" | "no_child" } | { ok: true; studentId: string; notes: StudentNote[] }> {
  const resolved = await resolveParentChild(db, userId, input.studentId);
  if (!resolved.ok) return resolved;
  const notes = await db
    .select()
    .from(studentNotes)
    .where(
      and(
        eq(studentNotes.studentId, resolved.studentId),
        eq(studentNotes.visibilityStatus, "published"),
      ),
    )
    .orderBy(desc(studentNotes.createdAt))
    .limit(clampLimit(input.limit, NOTE_LIMITS));
  return { ok: true, studentId: resolved.studentId, notes };
}
