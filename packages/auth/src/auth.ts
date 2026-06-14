import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb, schema } from "@soka/db";

/**
 * Better Auth instance for SOKA Baru.
 *
 * - Email/password only (no social providers in MVP).
 * - Uses the Drizzle adapter pointed at the shared Neon Postgres database, so
 *   Better Auth's user/session/account/verification tables live in the same DB
 *   as the SOKA membership tables and foreign keys stay valid.
 */
export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-only-insecure-secret-change-me",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8787",
  trustedOrigins: (process.env.WEB_ORIGIN ?? "http://localhost:5173").split(","),
});

export type Auth = typeof auth;
