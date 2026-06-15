import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Dependency-free `.env` loader for the live entrypoints (API server, migrate,
 * seed). Behavior:
 *
 * - Searches upward from the current working directory for a `.env` file (the
 *   workspace runs package scripts from each package's own directory, while
 *   `.env` lives at the repo root).
 * - Parses simple `KEY=VALUE` lines (ignores blanks/`#` comments, strips one
 *   layer of surrounding quotes).
 * - Does NOT overwrite variables already present in the real environment, so
 *   shell/CI-provided values always win over `.env`.
 * - No-ops silently when no `.env` exists (offline tests never need it).
 *
 * This is intentionally tiny and avoids a dotenv dependency. It never logs
 * values, so it cannot leak secrets.
 */
export function loadEnv(): void {
  const file = findEnvFile(process.cwd());
  if (!file) return;
  let content: string;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    return;
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
    // Never overwrite a real, already-set environment variable.
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function findEnvFile(start: string): string | null {
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
