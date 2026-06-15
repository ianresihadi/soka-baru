import { and, eq } from "drizzle-orm";
import { bindUserToSchoolByCode, getActiveTenantContext } from "./repositories";
import { getDb, getPool } from "./client";
import { loadEnv } from "./loadEnv";
import { submitClassAttendance, createParentMessage } from "./dailyLoop";
import {
  createGrade,
  publishGrade,
  createStudentNote,
  publishStudentNote,
} from "./academicRecords";
import {
  classes,
  grades,
  messages,
  parentStudentLinks,
  schools,
  studentNotes,
  students,
  teacherAssignments,
  user,
} from "./schema";

// Load .env (without overwriting real env vars) before importing auth, which
// resolves the database from process.env at module load.
loadEnv();
const { auth } = await import("@soka/auth");

// LOCAL DEV ONLY. These are not production credentials.
const LOCAL_PASSWORD = "LocalDevPassword123!";

async function ensureSchool(code: string, name: string) {
  const db = getDb();
  const existing = await db
    .select()
    .from(schools)
    .where(eq(schools.schoolCode, code));
  if (existing[0]) return existing[0];
  const inserted = await db
    .insert(schools)
    .values({ name, schoolCode: code })
    .returning();
  return inserted[0]!;
}

async function ensureUser(email: string, name: string): Promise<string> {
  try {
    const res = await auth.api.signUpEmail({
      body: { email, password: LOCAL_PASSWORD, name },
    });
    return res.user.id;
  } catch {
    // User likely already exists — look it up.
    const db = getDb();
    const rows = await db.select().from(user).where(eq(user.email, email));
    if (!rows[0]) throw new Error(`Could not create or find user ${email}`);
    return rows[0].id;
  }
}

/** Idempotent: one class per (school, name). */
async function ensureClass(schoolId: string, name: string) {
  const db = getDb();
  const existing = await db
    .select()
    .from(classes)
    .where(and(eq(classes.schoolId, schoolId), eq(classes.name, name)));
  if (existing[0]) return existing[0];
  const inserted = await db
    .insert(classes)
    .values({ schoolId, name, gradeLevel: "1", academicYear: "2026/2027" })
    .returning();
  return inserted[0]!;
}

/** Idempotent: one student per (school, fullName); keeps it in the homeroom. */
async function ensureStudent(schoolId: string, fullName: string, classId: string) {
  const db = getDb();
  const existing = await db
    .select()
    .from(students)
    .where(and(eq(students.schoolId, schoolId), eq(students.fullName, fullName)));
  if (existing[0]) {
    if (existing[0].classId !== classId) {
      await db
        .update(students)
        .set({ classId, updatedAt: new Date() })
        .where(eq(students.id, existing[0].id));
    }
    return existing[0];
  }
  const inserted = await db
    .insert(students)
    .values({ schoolId, fullName, classId })
    .returning();
  return inserted[0]!;
}

/** Idempotent via uniq_class_member_role. */
async function ensureTeacherAssignment(
  schoolId: string,
  classId: string,
  membershipId: string,
  roleInClass: "wali_kelas" | "guru",
) {
  const db = getDb();
  await db
    .insert(teacherAssignments)
    .values({ schoolId, classId, membershipId, roleInClass })
    .onConflictDoNothing();
}

/** Idempotent via uniq_student_parent. Server-controlled link (not self-claim). */
async function ensureParentLink(
  schoolId: string,
  studentId: string,
  parentMembershipId: string,
  relationship: string,
) {
  const db = getDb();
  await db
    .insert(parentStudentLinks)
    .values({ schoolId, studentId, parentMembershipId, relationship })
    .onConflictDoNothing();
}

/**
 * Idempotent demo content for the seeded School A child. Each piece is guarded
 * by an existence check so re-running the seed does not duplicate rows. All
 * writes go through the same tenant-scoped service functions the app uses.
 */
async function ensureDemoContent(
  schoolId: string,
  classId: string,
  studentId: string,
  teacherUserId: string,
  parentUserId: string,
) {
  const db = getDb();
  const teacherCtx = await getActiveTenantContext(db, teacherUserId);
  if (!teacherCtx) return;
  const today = new Date().toISOString().slice(0, 10);

  // 1. Attendance for today (upsert is naturally idempotent).
  await submitClassAttendance(db, teacherCtx, classId, today, {
    records: [{ studentId, status: "hadir" }],
  });

  // 2. One published grade (skip if this assessment already exists).
  const subject = "Matematika";
  const assessmentName = "Ulangan Harian 1";
  const existingGrade = await db
    .select({ id: grades.id })
    .from(grades)
    .where(
      and(
        eq(grades.schoolId, schoolId),
        eq(grades.studentId, studentId),
        eq(grades.subject, subject),
        eq(grades.assessmentName, assessmentName),
      ),
    );
  if (!existingGrade[0]) {
    const created = await createGrade(db, teacherCtx, classId, {
      studentId,
      subject,
      assessmentName,
      assessmentDate: today,
      score: 85,
      maxScore: 100,
    });
    if (created.ok) await publishGrade(db, teacherCtx, created.grade.id);
  }

  // 3. One published note (skip if an identical note body already exists).
  const noteBody = "Aktif bertanya di kelas dan rajin mengerjakan tugas.";
  const existingNote = await db
    .select({ id: studentNotes.id })
    .from(studentNotes)
    .where(
      and(
        eq(studentNotes.schoolId, schoolId),
        eq(studentNotes.studentId, studentId),
        eq(studentNotes.body, noteBody),
      ),
    );
  if (!existingNote[0]) {
    const created = await createStudentNote(db, teacherCtx, classId, {
      studentId,
      category: "academic",
      body: noteBody,
    });
    if (created.ok) await publishStudentNote(db, teacherCtx, created.note.id);
  }

  // 4. One parent→teacher message (skip if the child already has any message).
  const existingMessage = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.studentId, studentId));
  if (!existingMessage[0]) {
    await createParentMessage(db, parentUserId, {
      studentId,
      body: "Selamat pagi, Bu/Pak. Terima kasih atas perhatiannya untuk Adinda.",
    });
  }
}

async function main() {
  const schoolA = await ensureSchool("SOKA-A", "SD Soka Alpha");
  await ensureSchool("SOKA-B", "SD Soka Beta");

  const userA = await ensureUser("guru.a@example.com", "Guru Alpha");
  const userB = await ensureUser("guru.b@example.com", "Guru Beta");
  const userMulti = await ensureUser("multi@example.com", "Wali dan Ortu");
  const userAdmin = await ensureUser("admin.a@example.com", "Admin Alpha");

  // User A: School A, single school, two roles.
  const bindA = await bindUserToSchoolByCode(getDb(), userA, "SOKA-A", [
    "guru",
    "wali_kelas",
  ]);
  // User B: School B.
  await bindUserToSchoolByCode(getDb(), userB, "SOKA-B", ["guru"]);
  // Multi-role user in School A (wali_kelas + orang_tua).
  const bindMulti = await bindUserToSchoolByCode(getDb(), userMulti, "SOKA-A", [
    "wali_kelas",
    "orang_tua",
  ]);
  // School A admin (privileged role via internal/seed path, never public
  // self-binding) so the Admin / Setup workspace can be rehearsed locally.
  await bindUserToSchoolByCode(getDb(), userAdmin, "SOKA-A", ["admin_sekolah"]);

  // --- Pilot rehearsal happy-path data (School A only) ---------------------
  // Gives one teacher path (assigned class + roster) and one parent path
  // (a linked child) so the 001-006 workflows can be smoke-tested end-to-end.
  if (bindA.ok && bindMulti.ok) {
    const kelas = await ensureClass(schoolA.id, "Kelas 1A");
    const anak = await ensureStudent(schoolA.id, "Adinda Putri", kelas.id);
    await ensureStudent(schoolA.id, "Bagas Pratama", kelas.id);
    await ensureStudent(schoolA.id, "Citra Lestari", kelas.id);

    // guru.a is the wali kelas of Kelas 1A.
    await ensureTeacherAssignment(schoolA.id, kelas.id, bindA.membershipId, "wali_kelas");

    // multi@example.com is the parent of Adinda Putri (server-controlled link).
    await ensureParentLink(schoolA.id, anak.id, bindMulti.membershipId, "orang_tua");

    // Small, idempotent demo content so the pilot walkthrough is not empty:
    // one attendance record, one published grade, one published note, and one
    // parent→teacher message for Adinda Putri. Uses the same tested service
    // paths as the app — no mock layer, no schema change.
    await ensureDemoContent(schoolA.id, kelas.id, anak.id, userA, userMulti);
  }

  await getPool().end();
  console.log("Seed complete (LOCAL DEV ONLY credentials).");
  console.log(`  Schools: SOKA-A (SD Soka Alpha), SOKA-B (SD Soka Beta)`);
  console.log(`  Users: guru.a@example.com, guru.b@example.com, multi@example.com, admin.a@example.com`);
  console.log(`  School A demo: Kelas 1A · 3 siswa · guru.a wali kelas · multi ortu Adinda Putri · admin.a admin_sekolah`);
  console.log(`  Password (local dev only): ${LOCAL_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
