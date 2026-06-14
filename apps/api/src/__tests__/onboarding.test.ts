import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import {
  bindUserToSchoolByCode,
  schema,
  type Database,
} from "@soka/db";
import { createApp } from "../app";

const MIGRATIONS_DIR = fileURLToPath(
  new URL("../../../../packages/db/migrations", import.meta.url),
);

let db: Database;
let app: ReturnType<typeof createApp>;
let currentUser: string | null = null;

const u = {
  internal: "u-internal",
  adminA: "u-admin-a",
  adminB: "u-admin-b",
  teacherA: "u-teacher-a",
  nonTeacherA: "u-nonteacher-a",
  parent: "u-parent",
};

const ctxIds = {
  schoolA: "",
  schoolB: "",
  classA: "",
  classB: "",
  studentA: "",
  studentB: "",
  teacherMembershipA: "",
  nonTeacherMembershipA: "",
  teacherMembershipB: "",
};

function asUser(id: string | null) {
  currentUser = id;
}
const req = (path: string, init?: RequestInit) => app.request(path, init);
const postJson = (path: string, body: unknown) =>
  req(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeAll(async () => {
  const client = new PGlite();
  const pglite = drizzle(client, { schema });
  await migrate(pglite, { migrationsFolder: MIGRATIONS_DIR });
  db = pglite as unknown as Database;
  app = createApp({ db, resolveUserId: async () => currentUser });

  await db.insert(schema.user).values([
    { id: u.internal, name: "Internal", email: "internal@example.com" },
    { id: u.adminA, name: "Admin A", email: "admina@example.com" },
    { id: u.adminB, name: "Admin B", email: "adminb@example.com" },
    { id: u.teacherA, name: "Teacher A", email: "teachera@example.com" },
    { id: u.nonTeacherA, name: "NonTeacher", email: "nt@example.com" },
    { id: u.parent, name: "Parent", email: "parent@example.com" },
  ]);

  // Bootstrap a soka_internal operator (platform-level membership).
  const [platform] = await db
    .insert(schema.schools)
    .values({ name: "Platform", schoolCode: "PLATFORM" })
    .returning();
  const [pm] = await db
    .insert(schema.schoolMemberships)
    .values({ schoolId: platform!.id, userId: u.internal })
    .returning();
  await db
    .insert(schema.membershipRoles)
    .values({ membershipId: pm!.id, role: "soka_internal" });
});

describe("school creation (soka_internal only)", () => {
  it("lets soka_internal create schools and bind an admin", async () => {
    asUser(u.internal);
    const resA = await postJson("/admin/schools", {
      name: "SD Alpha",
      schoolCode: "S-A",
      adminUserId: u.adminA,
    });
    expect(resA.status).toBe(201);
    ctxIds.schoolA = ((await resA.json()) as { school: { id: string } }).school.id;

    const resB = await postJson("/admin/schools", {
      name: "SD Beta",
      schoolCode: "S-B",
      adminUserId: u.adminB,
    });
    expect(resB.status).toBe(201);
    ctxIds.schoolB = ((await resB.json()) as { school: { id: string } }).school.id;
  });

  it("rejects duplicate school_code", async () => {
    asUser(u.internal);
    const res = await postJson("/admin/schools", { name: "Dup", schoolCode: "S-A" });
    expect(res.status).toBe(409);
  });

  it("forbids a non-internal user from creating schools", async () => {
    asUser(u.adminA);
    const res = await postJson("/admin/schools", { name: "X", schoolCode: "S-X" });
    expect(res.status).toBe(403);
  });

  it("does not create a school when adminUserId is invalid", async () => {
    asUser(u.internal);
    const res = await postJson("/admin/schools", {
      name: "Ghost",
      schoolCode: "S-GHOST",
      adminUserId: "does-not-exist",
    });
    expect(res.status).toBe(404);
    // The transaction aborted: no orphan school row was left behind.
    const rows = await db
      .select()
      .from(schema.schools)
      .where(eq(schema.schools.schoolCode, "S-GHOST"));
    expect(rows).toHaveLength(0);
  });
});

describe("class/student/teacher onboarding", () => {
  it("admin creates classes and students in their own school", async () => {
    asUser(u.adminA);
    const cls = await postJson("/admin/classes", { name: "Kelas 1A", gradeLevel: "1" });
    expect(cls.status).toBe(201);
    ctxIds.classA = ((await cls.json()) as { class: { id: string } }).class.id;

    const stu = await postJson("/admin/students", { fullName: "Budi", nisn: "111" });
    expect(stu.status).toBe(201);
    ctxIds.studentA = ((await stu.json()) as { student: { id: string } }).student.id;

    // School B equivalents (as admin B).
    asUser(u.adminB);
    const clsB = await postJson("/admin/classes", { name: "Kelas 1B" });
    ctxIds.classB = ((await clsB.json()) as { class: { id: string } }).class.id;
    const stuB = await postJson("/admin/students", { fullName: "Citra" });
    ctxIds.studentB = ((await stuB.json()) as { student: { id: string } }).student.id;
  });

  it("bulk-imports students", async () => {
    asUser(u.adminA);
    const res = await postJson("/admin/students/bulk", {
      students: [{ fullName: "Ani" }, { fullName: "Dewi" }],
    });
    expect(res.status).toBe(201);
    expect(((await res.json()) as { count: number }).count).toBe(2);
  });

  it("assigns a student to a class in the same school", async () => {
    asUser(u.adminA);
    const res = await postJson(`/admin/students/${ctxIds.studentA}/assign-class`, {
      classId: ctxIds.classA,
    });
    expect(res.status).toBe(200);
  });

  it("assigns a teacher membership to a class", async () => {
    // Teacher membership created via internal binding (seed/internal path).
    const bind = await bindUserToSchoolByCode(db, u.teacherA, "S-A", [
      "guru",
      "wali_kelas",
    ]);
    expect(bind.ok).toBe(true);
    ctxIds.teacherMembershipA = (bind as { membershipId: string }).membershipId;

    asUser(u.adminA);
    const res = await postJson(`/admin/classes/${ctxIds.classA}/teachers`, {
      membershipId: ctxIds.teacherMembershipA,
      roleInClass: "wali_kelas",
    });
    expect(res.status).toBe(201);
  });

  it("rejects assigning a non-teacher membership", async () => {
    const bind = await bindUserToSchoolByCode(db, u.nonTeacherA, "S-A", [
      "orang_tua",
    ]);
    ctxIds.nonTeacherMembershipA = (bind as { membershipId: string }).membershipId;
    asUser(u.adminA);
    const res = await postJson(`/admin/classes/${ctxIds.classA}/teachers`, {
      membershipId: ctxIds.nonTeacherMembershipA,
      roleInClass: "guru",
    });
    expect(res.status).toBe(422);
  });
});

describe("cross-school isolation", () => {
  it("cannot create a student into another school's class", async () => {
    asUser(u.adminA);
    const res = await postJson("/admin/students", {
      fullName: "Hijack",
      classId: ctxIds.classB,
    });
    expect(res.status).toBe(404);
  });

  it("cannot assign own student to another school's class", async () => {
    asUser(u.adminA);
    const res = await postJson(`/admin/students/${ctxIds.studentA}/assign-class`, {
      classId: ctxIds.classB,
    });
    expect(res.status).toBe(404);
  });

  it("cannot assign another school's student to own class", async () => {
    asUser(u.adminA);
    const res = await postJson(`/admin/students/${ctxIds.studentB}/assign-class`, {
      classId: ctxIds.classA,
    });
    expect(res.status).toBe(404);
  });

  it("cannot assign a teacher membership from another school", async () => {
    const bind = await bindUserToSchoolByCode(db, u.teacherA, "S-B", ["guru"]);
    ctxIds.teacherMembershipB = (bind as { membershipId: string }).membershipId;
    asUser(u.adminA);
    const res = await postJson(`/admin/classes/${ctxIds.classA}/teachers`, {
      membershipId: ctxIds.teacherMembershipB,
      roleInClass: "guru",
    });
    expect(res.status).toBe(404);
  });

  it("only lists students within the caller's school", async () => {
    asUser(u.adminA);
    const res = await req("/admin/students");
    const { students } = (await res.json()) as {
      students: { schoolId: string }[];
    };
    expect(students.every((s) => s.schoolId === ctxIds.schoolA)).toBe(true);
    expect(students.some((s) => s.schoolId === ctxIds.schoolB)).toBe(false);
  });
});

describe("parent link codes", () => {
  let activeCode = "";

  it("admin generates a code for a student in their school", async () => {
    asUser(u.adminA);
    const res = await postJson("/admin/parent-link-codes", {
      studentId: ctxIds.studentA,
    });
    expect(res.status).toBe(201);
    activeCode = ((await res.json()) as { code: { code: string } }).code.code;
    expect(activeCode).toMatch(/^[0-9A-Z]{8}$/);
  });

  it("cannot generate a code for another school's student", async () => {
    asUser(u.adminA);
    const res = await postJson("/admin/parent-link-codes", {
      studentId: ctxIds.studentB,
    });
    expect(res.status).toBe(404);
  });

  it("parent redeems the code and gains an orang_tua link", async () => {
    asUser(u.parent);
    const res = await postJson("/parent-links/redeem", { code: activeCode });
    expect(res.status).toBe(201);

    const children = await req("/me/children");
    const { children: kids } = (await children.json()) as {
      children: { studentId: string; schoolId: string }[];
    };
    expect(kids).toHaveLength(1);
    expect(kids[0]!.studentId).toBe(ctxIds.studentA);
    expect(kids[0]!.schoolId).toBe(ctxIds.schoolA);
  });

  it("rejects redeeming an already-used code", async () => {
    asUser(u.parent);
    const res = await postJson("/parent-links/redeem", { code: activeCode });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe("code_used");
  });

  it("rejects an unknown code", async () => {
    asUser(u.parent);
    const res = await postJson("/parent-links/redeem", { code: "ZZZZZZZZ" });
    expect(res.status).toBe(400);
  });

  it("rejects an expired code", async () => {
    await db.insert(schema.parentLinkCodes).values({
      schoolId: ctxIds.schoolA,
      studentId: ctxIds.studentA,
      code: "EXPIRED1",
      expiresAt: new Date(Date.now() - 1000),
      createdByUserId: u.adminA,
    });
    asUser(u.parent);
    const res = await postJson("/parent-links/redeem", { code: "EXPIRED1" });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe("code_expired");
  });

  it("rejects a revoked code", async () => {
    asUser(u.adminA);
    const gen = await postJson("/admin/parent-link-codes", {
      studentId: ctxIds.studentA,
    });
    const codeRow = ((await gen.json()) as { code: { id: string; code: string } })
      .code;
    const rev = await postJson(
      `/admin/parent-link-codes/${codeRow.id}/revoke`,
      {},
    );
    expect(rev.status).toBe(200);

    asUser(u.parent);
    const res = await postJson("/parent-links/redeem", { code: codeRow.code });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe("code_revoked");
  });
});

describe("admin role guard", () => {
  it("forbids an orang_tua user from admin routes", async () => {
    asUser(u.parent); // became orang_tua in School A after redeeming
    const res = await postJson("/admin/classes", { name: "Nope" });
    expect(res.status).toBe(403);
  });
});

describe("redemption is single-use under concurrency", () => {
  it("only one of two concurrent conditional claims wins", async () => {
    // The single-use guarantee rests on a conditional UPDATE that flips
    // active -> used only while the code is still active. Two concurrent claims
    // on the same row must yield exactly one winner (the other matches 0 rows).
    await db.insert(schema.parentLinkCodes).values({
      schoolId: ctxIds.schoolA,
      studentId: ctxIds.studentA,
      code: "RACE0001",
      expiresAt: new Date(Date.now() + 60_000),
      createdByUserId: u.adminA,
    });
    const claim = () =>
      db
        .update(schema.parentLinkCodes)
        .set({ status: "used", redeemedAt: new Date() })
        .where(
          and(
            eq(schema.parentLinkCodes.code, "RACE0001"),
            eq(schema.parentLinkCodes.status, "active"),
          ),
        )
        .returning();
    const [a, b] = await Promise.all([claim(), claim()]);
    const winners = [a, b].filter((r) => r.length === 1);
    expect(winners).toHaveLength(1);
  });

  it("two concurrent redeems create exactly one link", async () => {
    asUser(u.adminA);
    const stu = await postJson("/admin/students", { fullName: "Eka" });
    const studentId = ((await stu.json()) as { student: { id: string } }).student.id;
    const gen = await postJson("/admin/parent-link-codes", { studentId });
    const code = ((await gen.json()) as { code: { code: string } }).code.code;

    await db.insert(schema.user).values([
      { id: "u-parent-x", name: "PX", email: "px@example.com" },
      { id: "u-parent-y", name: "PY", email: "py@example.com" },
    ]);
    const appX = createApp({ db, resolveUserId: async () => "u-parent-x" });
    const appY = createApp({ db, resolveUserId: async () => "u-parent-y" });
    const init = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    };
    const [rx, ry] = await Promise.all([
      appX.request("/parent-links/redeem", init),
      appY.request("/parent-links/redeem", init),
    ]);
    expect([rx.status, ry.status].sort()).toEqual([201, 400]);

    const links = await db
      .select()
      .from(schema.parentStudentLinks)
      .where(eq(schema.parentStudentLinks.studentId, studentId));
    expect(links).toHaveLength(1);
  });
});

describe("audit trail", () => {
  it("records a parent_student_link.created event", async () => {
    const events = await db.select().from(schema.auditEvents);
    expect(
      events.some((e) => e.action === "parent_student_link.created"),
    ).toBe(true);
    expect(events.some((e) => e.action === "parent_link_code.created")).toBe(true);
  });
});

describe("admin membership listing (GET /admin/memberships)", () => {
  type Row = { membershipId: string; userId: string; roles: string[] };
  const list = async (query = "") => {
    const res = await req(`/admin/memberships${query}`);
    return {
      status: res.status,
      rows: res.ok
        ? ((await res.json()) as { memberships: Row[] }).memberships
        : [],
    };
  };

  it("requires authentication", async () => {
    asUser(null);
    expect((await list()).status).toBe(401);
  });

  it("forbids a non-admin (teacher-only) caller", async () => {
    asUser(u.teacherA); // active membership in S-A is guru/wali_kelas, no admin
    expect((await list()).status).toBe(403);
  });

  it("forbids an orang_tua caller", async () => {
    asUser(u.parent);
    expect((await list()).status).toBe(403);
  });

  it("lists only same-tenant memberships for the admin", async () => {
    asUser(u.adminA);
    const { status, rows } = await list();
    expect(status).toBe(200);
    const ids = rows.map((r) => r.membershipId);
    // School A teacher membership is present; School B's is not.
    expect(ids).toContain(ctxIds.teacherMembershipA);
    expect(ids).not.toContain(ctxIds.teacherMembershipB);
  });

  it("filters to teacher-eligible memberships with ?role=", async () => {
    asUser(u.adminA);
    const { rows } = await list("?role=guru");
    const ids = rows.map((r) => r.membershipId);
    expect(ids).toContain(ctxIds.teacherMembershipA); // has guru
    // Parent-only and admin-only memberships are excluded by the teacher filter.
    expect(ids).not.toContain(ctxIds.nonTeacherMembershipA);
    expect(rows.every((r) => r.roles.includes("guru"))).toBe(true);
  });

  it("rejects an unsupported role filter", async () => {
    asUser(u.adminA);
    expect((await list("?role=orang_tua")).status).toBe(400);
  });

  it("ignores a client-supplied school_id query param", async () => {
    asUser(u.adminA);
    // Smuggle School B's id; the server must scope to the caller's tenant only.
    const { rows } = await list(`?schoolId=${ctxIds.schoolB}`);
    const ids = rows.map((r) => r.membershipId);
    expect(ids).toContain(ctxIds.teacherMembershipA);
    expect(ids).not.toContain(ctxIds.teacherMembershipB);
  });
});
