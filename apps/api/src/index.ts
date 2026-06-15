import { serve } from "@hono/node-server";
import { loadEnv } from "@soka/db";

// Load .env (without overwriting real env vars) before anything reads env/DB.
loadEnv();

const { auth } = await import("@soka/auth");
const { getDb } = await import("@soka/db");
const { createApp } = await import("./app");

const webOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:5173").split(",");

const app = createApp({
  db: getDb(),
  webOrigins,
  resolveUserId: async (req) => {
    const session = await auth.api.getSession({ headers: req.headers });
    return session?.user.id ?? null;
  },
});

// Mount Better Auth's email/password endpoints.
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port });
console.log(`SOKA API listening on http://localhost:${port}`);
