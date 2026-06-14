import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * The application database type. Repository functions accept a `Database` so
 * the same code can run against the production Pool or an in-process test db.
 */
export type Database = NodePgDatabase<typeof schema>;

let _pool: Pool | undefined;
let _db: Database | undefined;

export function getPool(): Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    _pool = new Pool({ connectionString });
  }
  return _pool;
}

export function getDb(): Database {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}
