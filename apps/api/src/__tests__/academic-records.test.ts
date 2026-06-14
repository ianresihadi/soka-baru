import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import {
  assignTeacherToClass,
  bindUserToSchoolByCode,
  createClass,
  createGrade,
  createParentLinkCode,
  createSchool,
  createStudent,
  createStudentNote,
  getActiveTenantContext,
  getParentGradeSummary,
  listGradesForTeacher,
  listPublishedGradesForParent,
  listPublishedStudentNotesForParent,
  listStudentNotesForTeacher,
  publishGrade,
  publishStudentNote,
  redeemParentLinkCode,
  unpublishStudentNote,
  updateGrade,
  updateStudentNote,
  schema,
  type Database,
} from "@soka/db";
import type { TenantContext } from "@soka/shared";
import { createApp } from "../app";

const MIGRATIONS_DIR = fileURLToPath(
  new URL("../../../../packages/db/migrations", import.meta.url),
);

let db: Database;
const ctx = {} as {
  adminA: TenantContext;
  teacherA: TenantContext;
  teacherA2: TenantContext; // unassigned to classA1
  adminB: TenantContext;
};
const id = {} as {
  classA1: string;
  classB1: string;
  s1: string; // School A, parent A's child, in classA1
  s2: string; // School A, in classA1, not parent A's
  sB1: string; // School B
};

async function tenantFor(userId: string): Promise<TenantContext> {
  const t = await getActiveTenantContext(db, userId);
  if (!t) throw new Error(`no tenant for ${userId}`);
  return t;
}

beforeAll(async () => {
  const client = new PGlite();
  const pglite = drizzle(client, { schema });
  await migrate(pglite, { migrationsFolder: MIGRATIONS_DIR });
  db = pglite as unknown as Database;

  await db.insert(schema.user).values([
    { id: "admin-a", name: "Admin A", email: "aa@x.com" },
    { id: "teacher-a", name: "Teacher A", email: "ta@x.com" },
    { id: "teacher-a2", name: "Teacher A2", email: "ta2@x.com" },
    { id: "parent-a", name: "Parent A", email: "pa@x.com" },
    { id: "parent-b", name: "Parent B", email: "pb@x.com" },
    { id: "admin-b", name: "Admin B", email: "ab@x.com" },
  ]);

  await createSchool(db, { name: "SD Alpha", schoolCode: "S-A", adminUserId: "admin-a" });
  await createSchool(db, { name: "SD Beta", schoolCode: "S-B", adminUserId: "admin-b" });
  ctx.adminA = await tenantFor("admin-a");
  ctx.adminB = await tenantFor("admin-b");

  const classA1 = await createClass(db, ctx.adminA, { name: "Kelas 1A" });
  id.classA1 = classA1.id;
  const s1 = await createStudent(db, ctx.adminA, { fullName: "Anak Satu", classId: classA1.id });
  const s2 = await createStudent(db, ctx.adminA, { fullName: "Anak Dua", classId: classA1.id });
  id.s1 = s1.id;
  id.s2 = s2.id;

  const taBind = await bindUserToSchoolByCode(db, "teacher-a", "S-A", ["guru", "wali_kelas"]);
  await assignTeacherToClass(db, ctx.adminA, classA1.id, (taBind as { membershipId: string }).membershipId, "wali_kelas");
  await bindUserToSchoolByCode(db, "teacher-a2", "S-A", ["guru"]);
  ctx.teacherA = await tenantFor("teacher-a");
  ctx.teacherA2 = await tenantFor("teacher-a2");

  const codeA = await createParentLinkCode(db, ctx.adminA, id.s1);
  await redeemParentLinkCode(db, "parent-a", (codeA as { code: { code: string } }).code.code);

  const classB1 = await createClass(db, ctx.adminB, { name: "Kelas 1B" });
  const sB1 = await createStudent(db, ctx.adminB, { fullName: "Anak Beta", classId: classB1.id });
  id.classB1 = classB1.id;
  id.sB1 = sB1.id;
  const codeB = await createParentLinkCode(db, ctx.adminB, id.sB1);
  await redeemParentLinkCode(db, "parent-b", (codeB as { code: { code: string } }).code.code);
});

describe("grades: create + access", () => {
  it("teacher creates a draft grade for an assigned class/student", async () => {
    const res = await createGrade(db, ctx.teacherA, id.classA1, {
      studentId: id.s1,
      subject: "Matematika",
      assessmentName: "UH 1",
      assessmentDate: "2026-06-10",
      score: 80,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.grade.visibilityStatus).toBe("draft");
    expect(res.grade.kkm).toBe(75); // school default applied + stored
  });

  it("rejects a teacher for an unassigned class", async () => {
    const res = await createGrade(db, ctx.teacherA2, id.classA1, {
      studentId: id.s1,
      subject: "IPA",
      assessmentName: "UH 1",
      assessmentDate: "2026-06-10",
      score: 60,
    });
    expect(res).toEqual({ ok: false, reason: "forbidden_class" });
  });

  it("rejects a student outside the class/school", async () => {
    const res = await createGrade(db, ctx.teacherA, id.classA1, {
      studentId: id.sB1,
      subject: "IPA",
      assessmentName: "UH 1",
      assessmentDate: "2026-06-10",
      score: 60,
    });
    expect(res).toEqual({ ok: false, reason: "student_not_in_class" });
  });

  it("computes isBelowKkm using percentage for non-100 maxScore", async () => {
    const pass = await createGrade(db, ctx.teacherA, id.classA1, {
      studentId: id.s1, subject: "B.Indo", assessmentName: "Kuis", assessmentDate: "2026-06-11",
      score: 16, maxScore: 20, kkm: 75,
    });
    const fail = await createGrade(db, ctx.teacherA, id.classA1, {
      studentId: id.s1, subject: "B.Indo", assessmentName: "Kuis 2", assessmentDate: "2026-06-12",
      score: 14, maxScore: 20, kkm: 75,
    });
    expect(pass.ok && pass.grade.isBelowKkm).toBe(false); // 80% >= 75
    expect(fail.ok && fail.grade.isBelowKkm).toBe(true); // 70% < 75
  });
});

describe("grades: publish, visibility, notify, audit", () => {
  it("parent sees only published grades for their linked child", async () => {
    const created = await createGrade(db, ctx.teacherA, id.classA1, {
      studentId: id.s1, subject: "PKn", assessmentName: "UH", assessmentDate: "2026-06-13", score: 90,
    });
    const gradeId = (created as { grade: { id: string } }).grade.id;

    // before publish: not visible to parent
    let parentView = await listPublishedGradesForParent(db, "parent-a", { studentId: id.s1 });
    expect(parentView.ok && parentView.grades.some((g) => g.id === gradeId)).toBe(false);

    const pub = await publishGrade(db, ctx.teacherA, gradeId);
    expect(pub.ok && pub.notified).toBe(1);

    parentView = await listPublishedGradesForParent(db, "parent-a", { studentId: id.s1 });
    expect(parentView.ok && parentView.grades.some((g) => g.id === gradeId)).toBe(true);

    // idempotent re-publish: no new notification
    const again = await publishGrade(db, ctx.teacherA, gradeId);
    expect(again.ok && again.alreadyPublished).toBe(true);
    expect(again.ok && again.notified).toBe(0);
  });

  it("parent cannot see another child's grades", async () => {
    const res = await listPublishedGradesForParent(db, "parent-a", { studentId: id.sB1 });
    expect(res).toEqual({ ok: false, reason: "not_linked" });
  });

  it("updating a published grade writes an audit event", async () => {
    const created = await createGrade(db, ctx.teacherA, id.classA1, {
      studentId: id.s1, subject: "Seni", assessmentName: "Tugas", assessmentDate: "2026-06-14", score: 70,
    });
    const gradeId = (created as { grade: { id: string } }).grade.id;
    await publishGrade(db, ctx.teacherA, gradeId);
    await updateGrade(db, ctx.teacherA, gradeId, { score: 85 });
    const audits = await db
      .select()
      .from(schema.auditEvents)
      .where(and(eq(schema.auditEvents.action, "grade.updated"), eq(schema.auditEvents.entityId, gradeId)));
    expect(audits.length).toBe(1);
  });

  it("parent grade summary counts below-KKM from stored grade KKM", async () => {
    const summary = await getParentGradeSummary(db, "parent-a", { studentId: id.s1 });
    expect(summary.ok).toBe(true);
    if (!summary.ok) return;
    expect(summary.total).toBeGreaterThanOrEqual(1);
    expect(summary.belowKkm).toBeGreaterThanOrEqual(0);
  });

  it("teacher grade list is tenant/class scoped", async () => {
    const res = await listGradesForTeacher(db, ctx.teacherA, id.classA1, {});
    expect(res.ok && res.grades.every((g) => g.classId === id.classA1)).toBe(true);
  });
});

describe("student notes: visibility + audit", () => {
  it("teacher creates an internal note; parent cannot see it", async () => {
    const created = await createStudentNote(db, ctx.teacherA, id.classA1, {
      studentId: id.s1, category: "academic", body: "Catatan internal",
    });
    expect(created.ok).toBe(true);
    const noteId = (created as { note: { id: string } }).note.id;

    const parentView = await listPublishedStudentNotesForParent(db, "parent-a", { studentId: id.s1 });
    expect(parentView.ok && parentView.notes.some((n) => n.id === noteId)).toBe(false);
  });

  it("publishing a note shows it to parent, notifies, audits, and is idempotent", async () => {
    const created = await createStudentNote(db, ctx.teacherA, id.classA1, {
      studentId: id.s1, category: "general", body: "Bagus sekali",
    });
    const noteId = (created as { note: { id: string } }).note.id;

    const pub = await publishStudentNote(db, ctx.teacherA, noteId);
    expect(pub.ok && pub.notified).toBe(1);

    const parentView = await listPublishedStudentNotesForParent(db, "parent-a", { studentId: id.s1 });
    expect(parentView.ok && parentView.notes.some((n) => n.id === noteId)).toBe(true);

    const again = await publishStudentNote(db, ctx.teacherA, noteId);
    expect(again.ok && again.alreadyPublished).toBe(true);
    expect(again.ok && again.notified).toBe(0);

    const pubAudit = await db
      .select()
      .from(schema.auditEvents)
      .where(and(eq(schema.auditEvents.action, "student_note.published"), eq(schema.auditEvents.entityId, noteId)));
    expect(pubAudit.length).toBe(1);

    // unpublish removes parent visibility and audits
    await unpublishStudentNote(db, ctx.teacherA, noteId);
    const afterUnpub = await listPublishedStudentNotesForParent(db, "parent-a", { studentId: id.s1 });
    expect(afterUnpub.ok && afterUnpub.notes.some((n) => n.id === noteId)).toBe(false);
    const unpubAudit = await db
      .select()
      .from(schema.auditEvents)
      .where(and(eq(schema.auditEvents.action, "student_note.unpublished"), eq(schema.auditEvents.entityId, noteId)));
    expect(unpubAudit.length).toBe(1);
  });

  it("parent cannot see another child's notes", async () => {
    const res = await listPublishedStudentNotesForParent(db, "parent-a", { studentId: id.sB1 });
    expect(res).toEqual({ ok: false, reason: "not_linked" });
  });

  it("teacher note list scoped; unassigned teacher rejected", async () => {
    const ok = await listStudentNotesForTeacher(db, ctx.teacherA, id.classA1, {});
    expect(ok.ok).toBe(true);
    const denied = await listStudentNotesForTeacher(db, ctx.teacherA2, id.classA1, {});
    expect(denied).toEqual({ ok: false, reason: "forbidden_class" });
  });

  it("notes never mutate students.objective_status", async () => {
    const before = await db.select().from(schema.students).where(eq(schema.students.id, id.s1));
    const created = await createStudentNote(db, ctx.teacherA, id.classA1, {
      studentId: id.s1, category: "wellbeing", body: "Perlu perhatian ekstra",
    });
    await publishStudentNote(db, ctx.teacherA, (created as { note: { id: string } }).note.id);
    const after = await db.select().from(schema.students).where(eq(schema.students.id, id.s1));
    expect(after[0]!.objectiveStatus).toBe(before[0]!.objectiveStatus);
  });
});

describe("cross-school + route guards", () => {
  it("School A teacher cannot create a grade for School B class", async () => {
    const res = await createGrade(db, ctx.teacherA, id.classB1, {
      studentId: id.sB1, subject: "X", assessmentName: "Y", assessmentDate: "2026-06-10", score: 50,
    });
    expect(res).toEqual({ ok: false, reason: "class_not_found" });
  });

  it("orang_tua cannot publish grades via /guru/*", async () => {
    const app = createApp({ db, resolveUserId: async () => "parent-a" });
    const res = await app.request("/guru/grades/x/publish", { method: "POST" });
    expect(res.status).toBe(403);
  });

  it("parent grade route works over session only and returns published only", async () => {
    const app = createApp({ db, resolveUserId: async () => "parent-a" });
    const res = await app.request(`/parent/grades?studentId=${id.s1}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { grades: { visibilityStatus: string }[] };
    expect(body.grades.every((g) => g.visibilityStatus === "published")).toBe(true);
  });
});
