import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDb, getPool } from "./client";
import { loadEnv } from "./loadEnv";

async function main() {
  // Load .env (without overwriting real env vars) before reading DATABASE_URL.
  loadEnv();
  await migrate(getDb(), { migrationsFolder: "./migrations" });
  await getPool().end();
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
