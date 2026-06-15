#!/usr/bin/env node
// SOKA Baru — environment validator for the live/pilot path.
//
// Validates the variables the API, migrate, seed, and live smoke need. It is
// safe to run locally: it NEVER prints secret values, only variable names and a
// status (ok / missing / placeholder). Exits non-zero when any required value
// is missing or is still the insecure .env.example placeholder.
//
// Usage: pnpm check:env   (or: node scripts/check-env.mjs)

import { loadEnv } from "./load-env.mjs";

const loadedFrom = loadEnv();

// Placeholder values copied straight from .env.example — never valid for a real
// run, so they are treated as failures (not mere warnings).
const PLACEHOLDERS = {
  DATABASE_URL: "postgres://user:password@localhost:5432/soka",
  BETTER_AUTH_SECRET: "replace-with-a-long-random-string",
};

const results = [];
let hardFail = false;

function add(name, status, message) {
  results.push({ name, status, message });
  if (status === "FAIL") hardFail = true;
}

function checkRequired(name, { placeholder, validate } = {}) {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    add(name, "FAIL", "missing (required)");
    return;
  }
  if (placeholder && value === placeholder) {
    add(name, "FAIL", "still the .env.example placeholder — set a real value");
    return;
  }
  const extra = validate ? validate(value) : null;
  if (extra) {
    add(name, extra.status, extra.message);
    return;
  }
  add(name, "OK", "set");
}

// --- Required live-path variables ------------------------------------------

checkRequired("DATABASE_URL", {
  placeholder: PLACEHOLDERS.DATABASE_URL,
  validate: (v) =>
    /^postgres(ql)?:\/\//.test(v)
      ? null
      : { status: "FAIL", message: "must be a postgres:// connection string" },
});

checkRequired("BETTER_AUTH_SECRET", {
  placeholder: PLACEHOLDERS.BETTER_AUTH_SECRET,
  validate: (v) =>
    v.length < 16
      ? { status: "FAIL", message: "too short — use a long random string (>=16 chars)" }
      : null,
});

checkRequired("BETTER_AUTH_URL", {
  validate: (v) =>
    /^https?:\/\//.test(v)
      ? null
      : { status: "FAIL", message: "must be an http(s) URL" },
});

checkRequired("WEB_ORIGIN", {
  validate: (v) =>
    /^https?:\/\//.test(v.split(",")[0].trim())
      ? null
      : { status: "FAIL", message: "must be an http(s) origin (comma-separated allowed)" },
});

// --- Optional variables (warn only) ----------------------------------------

function checkOptional(name, fallbackNote) {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    add(name, "WARN", `not set — ${fallbackNote}`);
  } else {
    add(name, "OK", "set");
  }
}

checkOptional("PORT", "API defaults to 8787");
checkOptional("SOKA_API_URL", "live smoke defaults to http://localhost:8787");
checkOptional("SOKA_WEB_URL", "live smoke web checks default to http://localhost:5173");

// --- Report (names + status only; never values) ----------------------------

console.log("SOKA env check");
console.log(loadedFrom ? `  .env loaded from: ${loadedFrom}` : "  .env: not found (using process environment only)");
console.log("");
for (const r of results) {
  const tag = r.status === "OK" ? "ok  " : r.status === "WARN" ? "warn" : "FAIL";
  console.log(`  [${tag}] ${r.name} — ${r.message}`);
}
console.log("");

if (hardFail) {
  console.error(
    "Environment is NOT ready for the live path. Fix the [FAIL] items above.\n" +
      "A passing .env needs real values for: DATABASE_URL, BETTER_AUTH_SECRET,\n" +
      "BETTER_AUTH_URL, WEB_ORIGIN. See docs/SETUP.md.",
  );
  process.exit(1);
}

console.log("Environment looks ready for the live path.");
