import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import {
  assignTeacherToClass,
  bindUserToSchoolByCode,
  createClass,
  createParentLinkCode,
  createParentMessage,
  createSchool,
  createStudent,
  getActiveTenantContext,
  getOrCreateSchoolSettings,
  getPapanPagi,
  listNotificationsForUser,
  listUnrepliedParentThreads,
  redeemParentLinkCode,
  replyToParentThread,
  submitClassAttendance,
  updateSchoolSettings,
  schema,
  type Database,
} from "@soka/db";
import type { TenantContext } from "@soka/shared";
import { createApp } from "../app";

const MIGRATIONS_DIR = fileURLToPath(
  new URL("../../../../packages/db/migrations", import.meta.url),
);

let db: Database;

// Asia/Jakarta is UTC+7 with no DST, so these instants map cleanly:
//   00:00Z = 07:00 WIB (before 07:30 cutoff) -> on time
//   01:00Z = 08:00 WIB (after 07:30 cutoff)  -> late
const NOW_ONTIME = new Date("2026-06-10T00:00:00Z");
const NOW_LATE = new Date("2026-06-11T01:00:00Z");
const NOW_TODAY = new Date("2026-06-15T03:00:00Z"); // 10:00 WIB, 2026-06-15

const ctx = {} as {
  adminA: TenantContext;
  adminB: TenantContext;
  teacherA: TenantContext;
  teacherA2: TenantContext;
  parentA: TenantContext;
};
const id = {} as {
  schoolA: string;
  schoolB: string;
  classA1: string;
  classA2: string;
  classB1: string;
  s1: string;
  s2: string;
  s3: string;
  sB1: string;
  teacherMembershipA: string;
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
    { id: "admin-a", name: "Admin A", email: "admina@x.com" },
    { id: "teacher-a", name: "Teacher A", email: "ta@x.com" },
    { id: "teacher-a2", name: "Teacher A2", email: "ta2@x.com" },
    { id: "parent-a", name: "Parent A", email: "pa@x.com" },
    { id: "admin-b", name: "Admin B", email: "adminb@x.com" },
  ]);

  const sA = await createSchool(db, { name: "SD Alpha", schoolCode: "S-A", adminUserId: "admin-a" });
  const sB = await createSchool(db, { name: "SD Beta", schoolCode: "S-B", adminUserId: "admin-b" });
  id.schoolA = (sA as { school: { id: string } }).school.id;
  id.schoolB = (sB as { school: { id: string } }).school.id;

  ctx.adminA = await tenantFor("admin-a");
  ctx.adminB = await tenantFor("admin-b");

  const classA1 = await createClass(db, ctx.adminA, { name: "Kelas 1A" });
  const classA2 = await createClass(db, ctx.adminA, { name: "Kelas 2A" });
  id.classA1 = classA1.id;
  id.classA2 = classA2.id;

  const s1 = await createStudent(db, ctx.adminA, { fullName: "Siswa Satu", classId: id.classA1 });
  const s2 = await createStudent(db, ctx.adminA, { fullName: "Siswa Dua", classId: id.classA1 });
  const s3 = await createStudent(db, ctx.adminA, { fullName: "Siswa Tiga", classId: id.classA1 });
  id.s1 = s1.id;
  id.s2 = s2.id;
  id.s3 = s3.id;

  // Teacher A assigned to class 1A as wali_kelas; teacher A2 is unassigned.
  const taBind = await bindUserToSchoolByCode(db, "teacher-a", "S-A", ["guru", "wali_kelas"]);
  id.teacherMembershipA = (taBind as { membershipId: string }).membershipId;
  await assignTeacherToClass(db, ctx.adminA, id.classA1, id.teacherMembershipA, "wali_kelas");
  await bindUserToSchoolByCode(db, "teacher-a2", "S-A", ["guru"]);
  ctx.teacherA = await tenantFor("teacher-a");
  ctx.teacherA2 = await tenantFor("teacher-a2");

  // Parent A linked to s1 via a redeemed code.
  const code = await createParentLinkCode(db, ctx.adminA, id.s1);
  await redeemParentLinkCode(db, "parent-a", (code as { code: { code: string } }).code.code);
  ctx.parentA = await tenantFor("parent-a");

  // School B: a class + student for isolation checks.
  const classB1 = await createClass(db, ctx.adminB, { name: "Kelas 1B" });
  const sB1 = await createStudent(db, ctx.adminB, { fullName: "Siswa B", classId: classB1.id });
  id.classB1 = classB1.id;
  id.sB1 = sB1.id;
});

describe("school settings", () => {
  it("creates a default with Asia/Jakarta timezone and 07:30 cutoff", async () => {
    const s = await getOrCreateSchoolSettings(db, ctx.adminA);
    expect(s.attendanceCutoffTime).toBe("07:30");
    expect(s.schoolTimezone).toBe("Asia/Jakarta");
  });

  it("updates the cutoff", async () => {
    const s = await updateSchoolSettings(db, ctx.adminB, { attendanceCutoffTime: "08:00" });
    expect(s.attendanceCutoffTime).toBe("08:00");
  });
});

describe("class access", () => {
  it("teacher can operate an assigned class but not an unassigned one", async () => {
    const ok = await submitClassAttendance(
      db, ctx.teacherA, id.classA1, "2026-06-09",
      { records: [{ studentId: id.s1, status: "hadir" }] }, NOW_TODAY,
    );
    expect(ok.ok).toBe(true);

    const denied = await submitClassAttendance(
      db, ctx.teacherA2, id.classA1, "2026-06-09",
      { records: [{ studentId: id.s1, status: "hadir" }] }, NOW_TODAY,
    );
    expect(denied).toEqual({ ok: false, reason: "forbidden_class" });
  });

  it("admin can operate any class in the school", async () => {
    const res = await submitClassAttendance(
      db, ctx.adminA, id.classA1, "2026-06-09",
      { records: [{ studentId: id.s2, status: "hadir" }] }, NOW_TODAY,
    );
    expect(res.ok).toBe(true);
  });
});

describe("attendance", () => {
  it("supports all five statuses and upserts without duplicates", async () => {
    // Same-day edits (now is on 2026-06-12) need no correction reason.
    const sameDay = new Date("2026-06-12T03:00:00Z");
    for (const status of ["hadir", "sakit", "izin", "alpa", "terlambat"] as const) {
      const r = await submitClassAttendance(
        db, ctx.teacherA, id.classA1, "2026-06-12",
        { records: [{ studentId: id.s1, status }] }, sameDay,
      );
      expect(r.ok).toBe(true);
    }
    const rows = await db
      .select()
      .from(schema.attendanceRecords)
      .where(eq(schema.attendanceRecords.studentId, id.s1));
    const onDate = rows.filter((x) => x.attendanceDate === "2026-06-12");
    expect(onDate).toHaveLength(1); // upsert, not duplicated
    expect(onDate[0]!.status).toBe("terlambat");
  });

  it("rejects a student from another class/school", async () => {
    const r = await submitClassAttendance(
      db, ctx.teacherA, id.classA1, "2026-06-12",
      { records: [{ studentId: id.sB1, status: "hadir" }] }, NOW_TODAY,
    );
    expect(r).toEqual({ ok: false, reason: "student_not_in_class" });
  });

  it("rejects duplicate students in one submission", async () => {
    const r = await submitClassAttendance(
      db, ctx.teacherA, id.classA1, "2026-06-12",
      { records: [
        { studentId: id.s1, status: "hadir" },
        { studentId: id.s1, status: "sakit" },
      ] }, NOW_TODAY,
    );
    expect(r).toEqual({ ok: false, reason: "duplicate_student" });
  });

  it("computes completed_on_time vs completed_late from the school-local cutoff", async () => {
    // On time: all three recorded at 07:00 WIB (< 07:30).
    for (const sid of [id.s1, id.s2, id.s3]) {
      await submitClassAttendance(
        db, ctx.teacherA, id.classA1, "2026-06-10",
        { records: [{ studentId: sid, status: "hadir" }] }, NOW_ONTIME,
      );
    }
    const onTime = await getPapanPagi(db, ctx.teacherA, { classId: id.classA1, date: "2026-06-10" });
    expect(onTime.ok && onTime.attendance.completion).toBe("completed_on_time");

    // Late: all three recorded at 08:00 WIB (> 07:30).
    for (const sid of [id.s1, id.s2, id.s3]) {
      await submitClassAttendance(
        db, ctx.teacherA, id.classA1, "2026-06-11",
        { records: [{ studentId: sid, status: "hadir" }] }, NOW_LATE,
      );
    }
    const late = await getPapanPagi(db, ctx.teacherA, { classId: id.classA1, date: "2026-06-11" });
    expect(late.ok && late.attendance.completion).toBe("completed_late");
  });

  it("reports not_started and in_progress", async () => {
    const empty = await getPapanPagi(db, ctx.teacherA, { classId: id.classA1, date: "2026-06-20" });
    expect(empty.ok && empty.attendance.completion).toBe("not_started");

    await submitClassAttendance(
      db, ctx.teacherA, id.classA1, "2026-06-21",
      { records: [{ studentId: id.s1, status: "hadir" }] }, NOW_TODAY,
    );
    const partial = await getPapanPagi(db, ctx.teacherA, { classId: id.classA1, date: "2026-06-21" });
    expect(partial.ok && partial.attendance.completion).toBe("in_progress");
  });
});

describe("attendance corrections", () => {
  it("same-day edit works without a correction reason", async () => {
    // record on 2026-06-15 (same-day relative to NOW_TODAY)
    await submitClassAttendance(
      db, ctx.teacherA, id.classA1, "2026-06-15",
      { records: [{ studentId: id.s1, status: "hadir" }] }, NOW_TODAY,
    );
    const edit = await submitClassAttendance(
      db, ctx.teacherA, id.classA1, "2026-06-15",
      { records: [{ studentId: id.s1, status: "izin" }] }, NOW_TODAY,
    );
    expect(edit.ok).toBe(true);
  });

  it("post-day correction without a reason is rejected; with a reason it audits", async () => {
    // create the original record "on the day"
    await submitClassAttendance(
      db, ctx.teacherA, id.classA1, "2026-06-14",
      { records: [{ studentId: id.s1, status: "hadir" }] },
      new Date("2026-06-14T03:00:00Z"),
    );
    // now it's 2026-06-15; changing it is a post-day correction
    const noReason = await submitClassAttendance(
      db, ctx.teacherA, id.classA1, "2026-06-14",
      { records: [{ studentId: id.s1, status: "alpa" }] }, NOW_TODAY,
    );
    expect(noReason).toEqual({ ok: false, reason: "correction_reason_required" });

    const withReason = await submitClassAttendance(
      db, ctx.teacherA, id.classA1, "2026-06-14",
      { records: [{ studentId: id.s1, status: "alpa" }], correctionReason: "salah input" },
      NOW_TODAY,
    );
    expect(withReason.ok).toBe(true);

    const audits = await db
      .select()
      .from(schema.auditEvents)
      .where(eq(schema.auditEvents.action, "attendance_record.corrected"));
    expect(audits.length).toBeGreaterThanOrEqual(1);
  });
});

describe("notifications", () => {
  it("creates notifications for non-present/late and not for hadir, with dedupe", async () => {
    await submitClassAttendance(
      db, ctx.teacherA, id.classA1, "2026-06-18",
      { records: [{ studentId: id.s1, status: "hadir" }] }, NOW_TODAY,
    );
    let notifs = await listNotificationsForUser(db, "parent-a");
    const hadirCount = notifs.filter((n) => (n.payload as { date?: string })?.date === "2026-06-18").length;
    expect(hadirCount).toBe(0);

    await submitClassAttendance(
      db, ctx.teacherA, id.classA1, "2026-06-18",
      { records: [{ studentId: id.s1, status: "sakit" }] }, NOW_TODAY,
    );
    // re-save same status -> no duplicate
    await submitClassAttendance(
      db, ctx.teacherA, id.classA1, "2026-06-18",
      { records: [{ studentId: id.s1, status: "sakit" }] }, NOW_TODAY,
    );
    notifs = await listNotificationsForUser(db, "parent-a");
    const sakit = notifs.filter(
      (n) => (n.payload as { date?: string; status?: string })?.date === "2026-06-18" &&
        (n.payload as { status?: string })?.status === "sakit",
    );
    expect(sakit).toHaveLength(1);
  });
});

describe("papan pagi sections", () => {
  it("returns attendance, messages, attention students, and schedule", async () => {
    // s2 -> objective status perhatian
    await db.update(schema.students).set({ objectiveStatus: "perhatian" }).where(eq(schema.students.id, id.s2));
    // s3 -> alpa today
    await submitClassAttendance(
      db, ctx.teacherA, id.classA1, "2026-06-15",
      { records: [{ studentId: id.s3, status: "alpa" }] }, NOW_TODAY,
    );
    const res = await getPapanPagi(db, ctx.teacherA, { classId: id.classA1, date: "2026-06-15" });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.attendance.cutoffTime).toBe("07:30");
    expect(res.attendance.timezone).toBe("Asia/Jakarta");
    const attentionIds = res.attentionStudents.map((a) => a.studentId);
    expect(attentionIds).toContain(id.s2); // perhatian
    expect(attentionIds).toContain(id.s3); // alpa today
    expect(Array.isArray(res.schedule)).toBe(true);
  });
});

describe("parent messages", () => {
  it("a linked parent can message, teacher sees unreplied, reply clears it", async () => {
    const created = await createParentMessage(db, "parent-a", { studentId: id.s1, body: "Halo bu" });
    expect(created.ok).toBe(true);

    const before = await listUnrepliedParentThreads(db, ctx.teacherA, id.classA1);
    expect(before.length).toBe(1);

    const threadId = (created as { threadId: string }).threadId;
    const reply = await replyToParentThread(db, ctx.teacherA, threadId, { body: "Baik, terima kasih" });
    expect(reply.ok).toBe(true);

    const after = await listUnrepliedParentThreads(db, ctx.teacherA, id.classA1);
    expect(after.length).toBe(0);
  });

  it("rejects messaging an unlinked or cross-school child", async () => {
    const unlinked = await createParentMessage(db, "parent-a", { studentId: id.s2, body: "x" });
    expect(unlinked).toEqual({ ok: false, reason: "not_linked" });
    const crossSchool = await createParentMessage(db, "parent-a", { studentId: id.sB1, body: "x" });
    expect(crossSchool).toEqual({ ok: false, reason: "not_linked" });
  });
});

describe("cross-school isolation", () => {
  it("a School A teacher cannot operate a School B class", async () => {
    const r = await submitClassAttendance(
      db, ctx.teacherA, id.classB1, "2026-06-15",
      { records: [{ studentId: id.sB1, status: "hadir" }] }, NOW_TODAY,
    );
    expect(r).toEqual({ ok: false, reason: "class_not_found" });
  });

  it("notifications are limited to the user's memberships", async () => {
    const adminBNotifs = await listNotificationsForUser(db, "admin-b");
    expect(adminBNotifs.every((n) => n.schoolId === id.schoolB)).toBe(true);
  });
});

describe("route permission guard", () => {
  it("orang_tua cannot access /guru/*", async () => {
    const app = createApp({ db, resolveUserId: async () => "parent-a" });
    const res = await app.request("/guru/papan-pagi");
    expect(res.status).toBe(403);
  });

  it("unauthenticated cannot access /guru/*", async () => {
    const app = createApp({ db, resolveUserId: async () => null });
    const res = await app.request("/guru/classes");
    expect(res.status).toBe(401);
  });
});

describe("school settings timezone validation", () => {
  it("rejects an invalid timezone and keeps existing settings usable", async () => {
    const app = createApp({ db, resolveUserId: async () => "admin-a" });
    const patch = (body: unknown) =>
      app.request("/admin/school-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

    const before = await getOrCreateSchoolSettings(db, ctx.adminA);

    const bad = await patch({ schoolTimezone: "Not/AZone" });
    expect(bad.status).toBe(400);

    // Bad data was not saved; settings remain unchanged and usable.
    const after = await getOrCreateSchoolSettings(db, ctx.adminA);
    expect(after.schoolTimezone).toBe(before.schoolTimezone);
    const pp = await getPapanPagi(db, ctx.adminA, { classId: id.classA1, date: "2026-06-15" });
    expect(pp.ok).toBe(true);

    // A valid timezone is accepted.
    const good = await patch({ schoolTimezone: "Asia/Makassar" });
    expect(good.status).toBe(200);
    const updated = await getOrCreateSchoolSettings(db, ctx.adminA);
    expect(updated.schoolTimezone).toBe("Asia/Makassar");
  });
});

describe("school settings defaultKkm (PATCH /admin/school-settings)", () => {
  const patchAs = (userId: string, body: unknown) =>
    createApp({ db, resolveUserId: async () => userId }).request(
      "/admin/school-settings",
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );

  it("lets an admin update defaultKkm", async () => {
    const res = await patchAs("admin-a", { defaultKkm: 70 });
    expect(res.status).toBe(200);
    const settings = await getOrCreateSchoolSettings(db, ctx.adminA);
    expect(settings.defaultKkm).toBe(70);
  });

  it("rejects an invalid defaultKkm and does not persist it", async () => {
    const before = await getOrCreateSchoolSettings(db, ctx.adminA);
    const tooHigh = await patchAs("admin-a", { defaultKkm: 150 });
    expect(tooHigh.status).toBe(400);
    const notInt = await patchAs("admin-a", { defaultKkm: 70.5 });
    expect(notInt.status).toBe(400);
    const after = await getOrCreateSchoolSettings(db, ctx.adminA);
    expect(after.defaultKkm).toBe(before.defaultKkm);
  });

  it("forbids a non-admin from updating settings", async () => {
    // teacher-a2 is a guru in School A with no admin role.
    const res = await patchAs("teacher-a2", { defaultKkm: 60 });
    expect(res.status).toBe(403);
    const settings = await getOrCreateSchoolSettings(db, ctx.adminA);
    expect(settings.defaultKkm).not.toBe(60);
  });
});
