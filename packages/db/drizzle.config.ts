import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Used only by commands that touch a live database (push/migrate).
    // `drizzle-kit generate` diffs the schema offline and does not connect.
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/soka",
  },
});
