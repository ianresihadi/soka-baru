import { serve } from "@hono/node-server";
import { auth } from "@soka/auth";
import { getDb } from "@soka/db";
import { createApp } from "./app";

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
