import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDb, getPool } from "./client";

async function main() {
  await migrate(getDb(), { migrationsFolder: "./migrations" });
  await getPool().end();
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
