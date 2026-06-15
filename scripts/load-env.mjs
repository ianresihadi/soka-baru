import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Dependency-free `.env` loader for the Node helper scripts (check-env,
 * live-smoke). Mirrors packages/db/src/loadEnv.ts:
 *
 * - searches upward from cwd for a `.env` file (it lives at the repo root);
 * - parses simple `KEY=VALUE` lines (ignores blanks/`#`, strips one layer of
 *   surrounding quotes);
 * - never overwrites a variable already present in the real environment;
 * - no-ops when no `.env` exists; never logs values.
 *
 * Returns the path of the loaded file (or null) so callers can report whether a
 * `.env` was found without printing its contents.
 */
export function loadEnv() {
  const file = findEnvFile(process.cwd());
  if (!file) return null;
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    return null;
  }
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!key) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return file;
}

function findEnvFile(start) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, ".env");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
