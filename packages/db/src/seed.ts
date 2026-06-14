import { eq } from "drizzle-orm";
import { auth } from "@soka/auth";
import { bindUserToSchoolByCode } from "./repositories";
import { getDb, getPool } from "./client";
import { schools, user } from "./schema";

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

async function main() {
  const db = getDb();

  await ensureSchool("SOKA-A", "SD Soka Alpha");
  await ensureSchool("SOKA-B", "SD Soka Beta");

  const userA = await ensureUser("guru.a@example.com", "Guru Alpha");
  const userB = await ensureUser("guru.b@example.com", "Guru Beta");
  const userMulti = await ensureUser("multi@example.com", "Wali dan Ortu");

  // User A: School A, single school, two roles.
  await bindUserToSchoolByCode(db, userA, "SOKA-A", ["guru", "wali_kelas"]);
  // User B: School B.
  await bindUserToSchoolByCode(db, userB, "SOKA-B", ["guru"]);
  // Multi-role user in School A (wali_kelas + orang_tua).
  await bindUserToSchoolByCode(db, userMulti, "SOKA-A", [
    "wali_kelas",
    "orang_tua",
  ]);

  await getPool().end();
  console.log("Seed complete (LOCAL DEV ONLY credentials).");
  console.log(`  Schools: SOKA-A (SD Soka Alpha), SOKA-B (SD Soka Beta)`);
  console.log(`  Users: guru.a@example.com, guru.b@example.com, multi@example.com`);
  console.log(`  Password (local dev only): ${LOCAL_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
