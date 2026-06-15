#!/usr/bin/env node
// SOKA Baru — live HTTP smoke check (pilot rehearsal tool, NOT a product flow).
//
// Proves the real Better Auth cookie/session path against a running API:
//   health -> admin sign-in -> /me -> /me/memberships -> admin-only route ->
//   sign-out -> /me unauthorized; then optional teacher and parent reads.
//
// Assumes migrations + seed have already run (see docs/SETUP.md). It is
// read-only apart from normal Better Auth session records, and never prints
// secrets. Uses only Node's built-in fetch.
//
// Config (env): SOKA_API_URL (default http://localhost:8787).
// Seeded LOCAL-DEV credentials only — never production-safe.
//
// Usage: pnpm smoke:live   (or: node scripts/live-smoke.mjs)

import { loadEnv } from "./load-env.mjs";

loadEnv();

const API = (process.env.SOKA_API_URL ?? "http://localhost:8787").replace(/\/$/, "");
const PASSWORD = "LocalDevPassword123!"; // seed.ts local-dev password
const ADMIN = "admin.a@example.com";
const TEACHER = "guru.a@example.com";
const PARENT = "multi@example.com";

let failures = 0;
const pass = (m) => console.log(`  [ok]   ${m}`);
const fail = (m) => {
  console.error(`  [FAIL] ${m}`);
  failures++;
};

/** Read Set-Cookie robustly: getSetCookie() when available, else raw header. */
function readSetCookies(res) {
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers.getSetCookie();
  }
  const raw = res.headers.get("set-cookie");
  return raw ? [raw] : [];
}

function updateJar(jar, res) {
  for (const sc of readSetCookies(res)) {
    const pair = sc.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (name) jar.set(name, value);
  }
}

const cookieHeader = (jar) =>
  [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

async function call(method, path, { jar, body } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (jar && jar.size) headers["cookie"] = cookieHeader(jar);
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (jar) updateJar(jar, res);
  return res;
}

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** Sign in; returns a cookie jar or throws a classified error. */
async function signIn(email) {
  const jar = new Map();
  const res = await call("POST", "/api/auth/sign-in/email", {
    jar,
    body: { email, password: PASSWORD },
  });
  if (res.status === 401 || res.status === 403 || res.status === 400) {
    throw new Error(
      `sign-in for ${email} returned ${res.status} — wrong credentials OR seed not run (run \`pnpm db:seed\`).`,
    );
  }
  if (!res.ok) throw new Error(`sign-in for ${email} returned ${res.status}.`);
  if (jar.size === 0) {
    throw new Error(
      `sign-in for ${email} returned no session cookie — auth/cookie configuration problem (check BETTER_AUTH_URL / WEB_ORIGIN).`,
    );
  }
  return jar;
}

async function main() {
  console.log(`SOKA live smoke against ${API}`);
  console.log("(seeded LOCAL-DEV accounts only — not production-safe)\n");

  // 1. Health (also detects "API not running").
  console.log("Health");
  let health;
  try {
    health = await call("GET", "/health");
  } catch (err) {
    console.error(
      `  [FAIL] cannot reach ${API} — is the API running? (\`pnpm dev:api\`)\n         ${err?.cause?.code ?? err?.message ?? err}`,
    );
    process.exit(2);
  }
  const healthJson = await readJson(health);
  if (health.ok && healthJson?.status === "ok") pass("GET /health -> ok");
  else fail(`GET /health -> ${health.status} (unexpected body)`);

  // 2-8. Admin Better Auth session lifecycle.
  console.log("\nAdmin session (Better Auth cookie flow)");
  let adminJar;
  try {
    adminJar = await signIn(ADMIN);
    pass(`sign-in ${ADMIN}`);
  } catch (err) {
    fail(err.message);
    summary();
    return;
  }

  const me = await call("GET", "/me", { jar: adminJar });
  if (me.ok) pass("GET /me -> authenticated");
  else fail(`GET /me -> ${me.status} — auth/cookie/session not preserved after sign-in`);

  const memberships = await call("GET", "/me/memberships", { jar: adminJar });
  const mjson = await readJson(memberships);
  const hasAdmin = (mjson?.memberships ?? []).some((m) =>
    (m.roles ?? []).includes("admin_sekolah"),
  );
  if (memberships.ok && hasAdmin) pass("GET /me/memberships includes admin_sekolah");
  else
    fail(
      `GET /me/memberships -> ${memberships.status} without admin_sekolah — seed not run or wrong account`,
    );

  const adminRoute = await call("GET", "/admin/memberships", { jar: adminJar });
  if (adminRoute.ok) pass("GET /admin/memberships (admin-only) -> ok");
  else if (adminRoute.status === 403)
    fail("GET /admin/memberships -> 403 — permission/role guard failure");
  else fail(`GET /admin/memberships -> ${adminRoute.status}`);

  const signOut = await call("POST", "/api/auth/sign-out", { jar: adminJar, body: {} });
  if (signOut.ok) pass("POST /api/auth/sign-out -> ok");
  else fail(`POST /api/auth/sign-out -> ${signOut.status}`);

  const meAfter = await call("GET", "/me", { jar: adminJar });
  if (meAfter.status === 401) pass("GET /me after sign-out -> 401 (session cleared)");
  else fail(`GET /me after sign-out -> ${meAfter.status} — session not cleared`);

  // 9. Optional teacher read.
  console.log("\nTeacher read (optional)");
  try {
    const jar = await signIn(TEACHER);
    const classes = await call("GET", "/guru/classes", { jar });
    const cjson = await readJson(classes);
    const hasKelas1A = (cjson?.classes ?? []).some((c) => c.name === "Kelas 1A");
    if (classes.ok && hasKelas1A) pass(`sign-in ${TEACHER} -> GET /guru/classes has Kelas 1A`);
    else fail(`GET /guru/classes -> ${classes.status} (Kelas 1A not found — seed?)`);
  } catch (err) {
    fail(err.message);
  }

  // 10. Optional parent read.
  console.log("\nParent read (optional)");
  try {
    const jar = await signIn(PARENT);
    const children = await call("GET", "/parent/children", { jar });
    const pjson = await readJson(children);
    const hasChild = (pjson?.children ?? []).some((c) => c.fullName === "Adinda Putri");
    if (children.ok && hasChild) pass(`sign-in ${PARENT} -> GET /parent/children has Adinda Putri`);
    else fail(`GET /parent/children -> ${children.status} (Adinda Putri not found — seed?)`);
  } catch (err) {
    fail(err.message);
  }

  summary();
}

function summary() {
  console.log("");
  if (failures === 0) {
    console.log("Live smoke PASSED.");
    process.exit(0);
  }
  console.error(`Live smoke FAILED with ${failures} problem(s).`);
  console.error(
    "Common causes: API not running (`pnpm dev:api`), seed not run (`pnpm db:seed`),\n" +
      "wrong Better Auth env (BETTER_AUTH_URL / WEB_ORIGIN / BETTER_AUTH_SECRET),\n" +
      "or cookies not preserved. See docs/PILOT_SMOKE_CHECKLIST.md.",
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(`Unexpected error: ${err?.message ?? err}`);
  process.exit(1);
});
