import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import {
  TenantViolationError,
  assertSameTenant,
  bindUserToSchoolByCode,
  getActiveTenantContext,
  getSchoolForTenant,
  listMembershipsForTenant,
  schema,
  type Database,
} from "@soka/db";
import { createApp } from "../app";

const MIGRATIONS_DIR = fileURLToPath(
  new URL("../../../../packages/db/migrations", import.meta.url),
);

let db: Database;
const ids = {
  userA: "user-a",
  userB: "user-b",
  userMulti: "user-multi",
  userOrtu: "user-ortu",
  userSelfBind: "user-selfbind",
  schoolA: "",
  schoolB: "",
};

async function makeDb(): Promise<Database> {
  const client = new PGlite();
  const pglite = drizzle(client, { schema });
  await migrate(pglite, { migrationsFolder: MIGRATIONS_DIR });
  return pglite as unknown as Database;
}

beforeAll(async () => {
  db = await makeDb();

  // Users (inserted directly; Better Auth is not exercised in this layer test).
  await db.insert(schema.user).values([
    { id: ids.userA, name: "Guru Alpha", email: "a@example.com" },
    { id: ids.userB, name: "Guru Beta", email: "b@example.com" },
    { id: ids.userMulti, name: "Wali Ortu", email: "m@example.com" },
    { id: ids.userOrtu, name: "Ortu Only", email: "o@example.com" },
    // Authenticated but unbound user, used to test public self-binding.
    { id: ids.userSelfBind, name: "Self Bind", email: "sb@example.com" },
  ]);

  // Schools.
  const [schoolA] = await db
    .insert(schema.schools)
    .values({ name: "SD Soka Alpha", schoolCode: "SOKA-A" })
    .returning();
  const [schoolB] = await db
    .insert(schema.schools)
    .values({ name: "SD Soka Beta", schoolCode: "SOKA-B" })
    .returning();
  ids.schoolA = schoolA!.id;
  ids.schoolB = schoolB!.id;

  // Bindings via the school_code path.
  await bindUserToSchoolByCode(db, ids.userA, "SOKA-A", ["guru", "wali_kelas"]);
  await bindUserToSchoolByCode(db, ids.userB, "SOKA-B", ["guru"]);
  await bindUserToSchoolByCode(db, ids.userMulti, "SOKA-A", [
    "wali_kelas",
    "orang_tua",
  ]);
  await bindUserToSchoolByCode(db, ids.userOrtu, "SOKA-A", ["orang_tua"]);
});

describe("school binding", () => {
  it("derives school_id from school_code, not client input", async () => {
    const ctx = await getActiveTenantContext(db, ids.userA);
    expect(ctx?.schoolId).toBe(ids.schoolA);
  });

  it("rejects an unknown school_code", async () => {
    const result = await bindUserToSchoolByCode(db, ids.userA, "NOPE", ["guru"]);
    expect(result.ok).toBe(false);
  });

  it("is idempotent and does not duplicate memberships", async () => {
    const before = await listMembershipsForTenant(
      db,
      (await getActiveTenantContext(db, ids.userA))!,
    );
    await bindUserToSchoolByCode(db, ids.userA, "SOKA-A", ["guru"]);
    const after = await listMembershipsForTenant(
      db,
      (await getActiveTenantContext(db, ids.userA))!,
    );
    expect(after.length).toBe(before.length);
  });

  it("supports multiple roles for one user", async () => {
    const ctx = await getActiveTenantContext(db, ids.userMulti);
    expect(ctx?.roles.sort()).toEqual(["orang_tua", "wali_kelas"]);
  });

  it("keeps siswa available as a role value", async () => {
    await db.insert(schema.user).values({
      id: "user-siswa",
      name: "Siswa",
      email: "s@example.com",
    });
    const result = await bindUserToSchoolByCode(db, "user-siswa", "SOKA-A", [
      "siswa",
    ]);
    expect(result.ok).toBe(true);
    const ctx = await getActiveTenantContext(db, "user-siswa");
    expect(ctx?.roles).toContain("siswa");
  });
});

describe("tenant isolation (repository layer)", () => {
  it("scopes school reads to the caller's tenant", async () => {
    const ctxA = (await getActiveTenantContext(db, ids.userA))!;
    const ctxB = (await getActiveTenantContext(db, ids.userB))!;
    expect((await getSchoolForTenant(db, ctxA))?.id).toBe(ids.schoolA);
    expect((await getSchoolForTenant(db, ctxB))?.id).toBe(ids.schoolB);
  });

  it("only lists memberships within the caller's school", async () => {
    const ctxA = (await getActiveTenantContext(db, ids.userA))!;
    const memberships = await listMembershipsForTenant(db, ctxA);
    expect(memberships.every((m) => m.schoolId === ids.schoolA)).toBe(true);
    // School B's membership must not leak into School A's listing.
    expect(memberships.some((m) => m.schoolId === ids.schoolB)).toBe(false);
  });

  it("assertSameTenant blocks a client-supplied foreign school_id", async () => {
    const ctxA = (await getActiveTenantContext(db, ids.userA))!;
    expect(() => assertSameTenant(ctxA, ids.schoolA)).not.toThrow();
    expect(() => assertSameTenant(ctxA, ids.schoolB)).toThrow(
      TenantViolationError,
    );
  });
});

describe("tenant isolation (route layer)", () => {
  let currentUser: string | null = null;
  let app: ReturnType<typeof createApp>;

  // Built after the outer beforeAll has assigned `db`.
  beforeAll(() => {
    app = createApp({ db, resolveUserId: async () => currentUser });
  });

  const makeRequest = (path: string, init?: RequestInit) =>
    app.request(path, init);

  function asUser(id: string | null) {
    currentUser = id;
  }

  it("rejects unauthenticated requests", async () => {
    asUser(null);
    const res = await makeRequest("/me");
    expect(res.status).toBe(401);
  });

  it("returns only the caller's school on /tenant-check/school", async () => {
    asUser(ids.userA);
    const resA = await makeRequest("/tenant-check/school");
    const bodyA = (await resA.json()) as { schoolId: string };
    expect(bodyA.schoolId).toBe(ids.schoolA);

    asUser(ids.userB);
    const resB = await makeRequest("/tenant-check/school");
    const bodyB = (await resB.json()) as { schoolId: string };
    expect(bodyB.schoolId).toBe(ids.schoolB);
    expect(bodyB.schoolId).not.toBe(bodyA.schoolId);
  });

  it("ignores a client-supplied school_id on writes", async () => {
    asUser(ids.userA);
    // User A attempts to rename, smuggling School B's id in the body.
    const res = await makeRequest("/tenant-check/school", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "HIJACKED", schoolId: ids.schoolB }),
    });
    expect(res.status).toBe(200);
    const updated = ((await res.json()) as { updated: { id: string } }).updated;
    // The update landed on School A (the tenant), not School B.
    expect(updated.id).toBe(ids.schoolA);

    // School B is untouched.
    const schoolB = await db
      .select()
      .from(schema.schools)
      .where(eq(schema.schools.id, ids.schoolB));
    expect(schoolB[0]!.name).toBe("SD Soka Beta");
  });

  it("enforces role checks on protected writes", async () => {
    asUser(ids.userOrtu); // orang_tua only -> not allowed to write
    const res = await makeRequest("/tenant-check/school", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "x" }),
    });
    expect(res.status).toBe(403);

    asUser(ids.userA); // guru/wali_kelas -> allowed
    const ok = await makeRequest("/tenant-check/school", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "SD Soka Alpha" }),
    });
    expect(ok.status).toBe(200);
  });
});

describe("public binding endpoint role guard", () => {
  let currentUser: string | null = null;
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp({ db, resolveUserId: async () => currentUser });
  });

  const bind = (roles: string[]) =>
    app.request("/school-bindings/by-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ schoolCode: "SOKA-A", roles }),
    });

  it("rejects self-assigning admin_sekolah", async () => {
    currentUser = ids.userSelfBind;
    const res = await bind(["admin_sekolah"]);
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: string }).error).toBe("forbidden_role");
    // No membership was created for the rejected attempt.
    expect(await getActiveTenantContext(db, ids.userSelfBind)).toBeNull();
  });

  it("rejects self-assigning soka_internal", async () => {
    currentUser = ids.userSelfBind;
    const res = await bind(["soka_internal"]);
    expect(res.status).toBe(403);
    expect(await getActiveTenantContext(db, ids.userSelfBind)).toBeNull();
  });

  it("rejects a mix that smuggles a privileged role (guru)", async () => {
    currentUser = ids.userSelfBind;
    const res = await bind(["orang_tua", "guru"]);
    expect(res.status).toBe(403);
    // Nothing partially applied: still no membership.
    expect(await getActiveTenantContext(db, ids.userSelfBind)).toBeNull();
  });

  it("rejects self-assigning wali_kelas", async () => {
    currentUser = ids.userSelfBind;
    const res = await bind(["wali_kelas"]);
    expect(res.status).toBe(403);
    expect(await getActiveTenantContext(db, ids.userSelfBind)).toBeNull();
  });

  it("allows self-binding the non-privileged orang_tua role", async () => {
    currentUser = ids.userSelfBind;
    const res = await bind(["orang_tua"]);
    expect(res.status).toBe(201);
    const ctx = await getActiveTenantContext(db, ids.userSelfBind);
    expect(ctx?.roles).toEqual(["orang_tua"]);
  });
});
