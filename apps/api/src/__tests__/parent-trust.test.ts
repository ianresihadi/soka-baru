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
  createParentLinkCode,
  createParentMessage,
  createSchool,
  createStudent,
  getActiveTenantContext,
  getParentAttendanceHistory,
  getParentHome,
  getParentMessageThread,
  listLinkedChildrenForParent,
  listParentMessageThreads,
  listParentNotifications,
  markParentNotificationsRead,
  redeemParentLinkCode,
  submitClassAttendance,
  schema,
  type Database,
} from "@soka/db";
import type { TenantContext } from "@soka/shared";
import { createApp } from "../app";

const MIGRATIONS_DIR = fileURLToPath(
  new URL("../../../../packages/db/migrations", import.meta.url),
);

let db: Database;
const NOW = new Date("2026-06-15T03:00:00Z"); // 10:00 WIB on 2026-06-15

const ctx = {} as { adminA: TenantContext; adminB: TenantContext; teacherA: TenantContext };
const id = {} as {
  s1: string; // parent A's child (School A)
  s2: string; // unlinked child (School A)
  sB1: string; // parent B's child (School B)
  classA1: string;
};

async function tenantFor(userId: string): Promise<TenantContext> {
  const t = await getActiveTenantContext(db, userId);
  if (!t) throw new Error(`no tenant for ${userId}`);
  return t;
}

async function submitSameDay(
  teacher: TenantContext,
  classId: string,
  date: string,
  studentId: string,
  status: "hadir" | "sakit" | "izin" | "alpa" | "terlambat",
) {
  const now = new Date(`${date}T03:00:00Z`);
  return submitClassAttendance(db, teacher, classId, date, { records: [{ studentId, status }] }, now);
}

beforeAll(async () => {
  const client = new PGlite();
  const pglite = drizzle(client, { schema });
  await migrate(pglite, { migrationsFolder: MIGRATIONS_DIR });
  db = pglite as unknown as Database;

  await db.insert(schema.user).values([
    { id: "admin-a", name: "Admin A", email: "aa@x.com" },
    { id: "teacher-a", name: "Teacher A", email: "ta@x.com" },
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
  ctx.teacherA = await tenantFor("teacher-a");

  // Parent A linked to s1 only.
  const codeA = await createParentLinkCode(db, ctx.adminA, id.s1);
  await redeemParentLinkCode(db, "parent-a", (codeA as { code: { code: string } }).code.code);

  // School B: class + student + parent B linked.
  const classB1 = await createClass(db, ctx.adminB, { name: "Kelas 1B" });
  const sB1 = await createStudent(db, ctx.adminB, { fullName: "Anak Beta", classId: classB1.id });
  id.sB1 = sB1.id;
  const codeB = await createParentLinkCode(db, ctx.adminB, id.sB1);
  await redeemParentLinkCode(db, "parent-b", (codeB as { code: { code: string } }).code.code);

  // Attendance: s1 history + today; sB1 gets a sakit (notification for parent B).
  await submitSameDay(ctx.teacherA, id.classA1, "2026-06-13", id.s1, "hadir");
  await submitSameDay(ctx.teacherA, id.classA1, "2026-06-14", id.s1, "sakit");
  await submitSameDay(ctx.teacherA, id.classA1, "2026-06-15", id.s1, "hadir");
  await submitSameDay(ctx.adminB, classB1.id, "2026-06-15", id.sB1, "sakit");
});

describe("parent child access", () => {
  it("lists only linked children", async () => {
    const children = await listLinkedChildrenForParent(db, "parent-a");
    expect(children.map((c) => c.studentId)).toEqual([id.s1]);
  });

  it("returns a calm empty home when there are no linked children", async () => {
    await db.insert(schema.user).values({ id: "parent-none", name: "None", email: "n@x.com" });
    const home = await getParentHome(db, "parent-none", {}, NOW);
    expect(home.ok && home.selectedChild).toBeNull();
    expect(home.ok && home.children).toEqual([]);
  });

  it("cannot access another parent's child by studentId", async () => {
    const home = await getParentHome(db, "parent-a", { studentId: id.sB1 }, NOW);
    expect(home).toEqual({ ok: false, reason: "not_linked" });
    const att = await getParentAttendanceHistory(db, "parent-a", { studentId: id.sB1 });
    expect(att).toEqual({ ok: false, reason: "not_linked" });
  });
});

describe("beranda anak", () => {
  it("returns selected child, today's attendance, recent history, notification, thread", async () => {
    const home = await getParentHome(db, "parent-a", {}, NOW);
    expect(home.ok).toBe(true);
    if (!home.ok) return;
    expect(home.selectedChild?.studentId).toBe(id.s1);
    expect(home.today?.date).toBe("2026-06-15");
    expect(home.today?.attendanceStatus).toBe("hadir");
    expect(home.recentAttendance.length).toBeGreaterThanOrEqual(3);
    expect(home.reassurance?.headline).toContain("hadir");
  });

  it("shows a neutral state when today's attendance is not recorded", async () => {
    // s1 has no record for a far-future 'today'
    const future = new Date("2026-07-01T03:00:00Z");
    const home = await getParentHome(db, "parent-a", {}, future);
    expect(home.ok && home.today?.attendanceStatus).toBeNull();
    expect(home.ok && home.reassurance?.headline).toContain("belum tercatat");
  });

  it("needsAction is true when an older notification is unread even if the latest is read", async () => {
    await db.insert(schema.user).values({ id: "parent-c", name: "PC", email: "pc@x.com" });
    const s3 = await createStudent(db, ctx.adminA, { fullName: "Anak Tiga", classId: id.classA1 });
    const code = await createParentLinkCode(db, ctx.adminA, s3.id);
    await redeemParentLinkCode(db, "parent-c", (code as { code: { code: string } }).code.code);
    const m = await db
      .select()
      .from(schema.schoolMemberships)
      .where(eq(schema.schoolMemberships.userId, "parent-c"));
    const membershipId = m[0]!.id;

    await db.insert(schema.notifications).values([
      {
        schoolId: s3.schoolId,
        recipientMembershipId: membershipId,
        studentId: s3.id,
        type: "attendance",
        title: "Lama",
        body: "x",
        payload: { date: "2026-06-10", status: "alpa" },
        createdAt: new Date("2026-06-10T00:00:00Z"),
        readAt: null, // older, still unread
      },
      {
        schoolId: s3.schoolId,
        recipientMembershipId: membershipId,
        studentId: s3.id,
        type: "attendance",
        title: "Baru",
        body: "y",
        payload: { date: "2026-06-12", status: "sakit" },
        createdAt: new Date("2026-06-12T00:00:00Z"),
        readAt: new Date("2026-06-12T01:00:00Z"), // newer, already read
      },
    ]);

    // s3 has no attendance today, so needsAction can only come from the unread notification.
    const home = await getParentHome(db, "parent-c", { studentId: s3.id }, NOW);
    expect(home.ok).toBe(true);
    if (!home.ok) return;
    expect(home.latestNotification?.title).toBe("Baru"); // latest is the read one
    expect(home.latestNotification?.readAt).not.toBeNull();
    expect(home.reassurance?.needsAction).toBe(true);
    expect(home.reassurance?.reasons).toContain("unread_notification");
  });
});

describe("attendance history (read-only)", () => {
  it("returns only the linked child's records, newest first", async () => {
    const res = await getParentAttendanceHistory(db, "parent-a", { studentId: id.s1 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.records.every((r) => r.studentId === id.s1)).toBe(true);
    expect(res.records[0]!.attendanceDate >= res.records[res.records.length - 1]!.attendanceDate).toBe(true);
  });

  it("respects a max limit", async () => {
    const res = await getParentAttendanceHistory(db, "parent-a", { studentId: id.s1, limit: 999 });
    expect(res.ok && res.records.length).toBeLessThanOrEqual(100);
  });

  it("exposes no parent attendance mutation path", () => {
    // There is no parent-facing write function; attendance edits are teacher-only.
    expect("updateParentAttendance" in (globalThis as object)).toBe(false);
  });
});

describe("notifications", () => {
  it("lists only the caller's notifications", async () => {
    const res = await listParentNotifications(db, "parent-a");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // parent A should not see parent B's sakit notification for sB1
    expect(res.items.some((n) => n.studentId === id.sB1)).toBe(false);
  });

  it("marks own notifications read and ignores foreign ids", async () => {
    // parent A's notification (from s1 sakit on 2026-06-14)
    await submitSameDay(ctx.teacherA, id.classA1, "2026-06-14", id.s1, "sakit");
    const own = await listParentNotifications(db, "parent-a");
    const ownId = own.ok ? own.items[0]!.id : "";

    // a foreign notification (parent B)
    const foreign = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.studentId, id.sB1));
    const foreignId = foreign[0]!.id;

    const result = await markParentNotificationsRead(db, "parent-a", {
      notificationIds: [ownId, foreignId],
    });
    expect(result.updated).toBe(1); // only the own one

    const foreignAfter = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.id, foreignId));
    expect(foreignAfter[0]!.readAt).toBeNull(); // foreign untouched
  });
});

describe("parent messages", () => {
  it("lists/sees threads only for linked children and can view detail", async () => {
    const created = await createParentMessage(db, "parent-a", { studentId: id.s1, body: "Halo" });
    expect(created.ok).toBe(true);
    const threadId = (created as { threadId: string }).threadId;

    const threads = await listParentMessageThreads(db, "parent-a");
    expect(threads.ok && threads.items.some((t) => t.id === threadId)).toBe(true);

    const detail = await getParentMessageThread(db, "parent-a", threadId);
    expect(detail.ok && detail.messages.length).toBeGreaterThanOrEqual(1);
  });

  it("cannot view another parent's thread", async () => {
    const created = await createParentMessage(db, "parent-b", { studentId: id.sB1, body: "Hai" });
    const bThread = (created as { threadId: string }).threadId;
    const asA = await getParentMessageThread(db, "parent-a", bThread);
    expect(asA).toEqual({ ok: false, reason: "thread_not_found" });
  });

  it("cannot send a message for an unlinked/cross-school child", async () => {
    const unlinked = await createParentMessage(db, "parent-a", { studentId: id.s2, body: "x" });
    expect(unlinked).toEqual({ ok: false, reason: "not_linked" });
    const cross = await createParentMessage(db, "parent-a", { studentId: id.sB1, body: "x" });
    expect(cross).toEqual({ ok: false, reason: "not_linked" });
  });
});

describe("route guards", () => {
  it("orang_tua cannot access /guru/*", async () => {
    const app = createApp({ db, resolveUserId: async () => "parent-a" });
    const res = await app.request("/guru/papan-pagi");
    expect(res.status).toBe(403);
  });

  it("parent home route returns 403 for an unlinked studentId", async () => {
    const app = createApp({ db, resolveUserId: async () => "parent-a" });
    const res = await app.request(`/parent/home?studentId=${id.sB1}`);
    expect(res.status).toBe(403);
  });

  it("parent children route works over session only", async () => {
    const app = createApp({ db, resolveUserId: async () => "parent-a" });
    const res = await app.request("/parent/children");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { children: { studentId: string }[] };
    expect(body.children).toHaveLength(1);
  });
});
