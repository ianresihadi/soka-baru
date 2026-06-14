import { Hono, type Context, type Next } from "hono";
import { cors } from "hono/cors";
import {
  bindUserToSchoolByCode,
  getActiveTenantContext,
  getSchoolForTenant,
  listMembershipsForTenant,
  listUserMemberships,
  updateSchoolNameForTenant,
  type Database,
} from "@soka/db";
import {
  schoolBindingSchema,
  tenantCheckUpdateSchema,
  isSelfBindableRole,
  type Role,
  type TenantContext,
} from "@soka/shared";

export interface AppDeps {
  db: Database;
  /**
   * Resolve the authenticated user id from the request. In production this is
   * backed by Better Auth's session; tests inject a stub. Either way, the user
   * id is server-resolved and never read from the request body.
   */
  resolveUserId: (req: Request) => Promise<string | null>;
  /** Allowed CORS origins for the validation UI. */
  webOrigins?: string[];
}

type Variables = {
  userId: string;
  tenant: TenantContext;
};

export function createApp(deps: AppDeps) {
  const app = new Hono<{ Variables: Variables }>();

  app.use(
    "*",
    cors({
      origin: deps.webOrigins ?? ["http://localhost:5173"],
      credentials: true,
    }),
  );

  app.get("/health", (c) => c.json({ status: "ok" }));

  // --- Middleware -----------------------------------------------------------

  type Ctx = Context<{ Variables: Variables }>;

  const requireAuth = async (c: Ctx, next: Next) => {
    const userId = await deps.resolveUserId(c.req.raw);
    if (!userId) return c.json({ error: "unauthorized" }, 401);
    c.set("userId", userId);
    await next();
  };

  const requireMembership = async (c: Ctx, next: Next) => {
    const userId = c.get("userId");
    const tenant = await getActiveTenantContext(deps.db, userId);
    if (!tenant) return c.json({ error: "no_active_membership" }, 403);
    c.set("tenant", tenant);
    await next();
  };

  const requireRole =
    (...allowed: Role[]) =>
    async (c: Ctx, next: Next) => {
      const tenant = c.get("tenant");
      if (!tenant.roles.some((r) => allowed.includes(r))) {
        return c.json({ error: "forbidden_role" }, 403);
      }
      await next();
    };

  // --- Routes ---------------------------------------------------------------

  app.get("/me", requireAuth, (c) => {
    return c.json({ userId: c.get("userId") });
  });

  app.get("/me/memberships", requireAuth, async (c) => {
    const memberships = await listUserMemberships(deps.db, c.get("userId"));
    return c.json({ memberships });
  });

  app.post("/school-bindings/by-code", requireAuth, async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = schoolBindingSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "invalid_input", issues: parsed.error.issues }, 400);
    }
    // SECURITY: this is a public, session-only endpoint. A client must not be
    // able to self-assign privileged roles just by knowing the school_code.
    // Privileged/multi-role assignment stays in seed/internal code (which calls
    // the repository directly) until an admin-controlled onboarding path exists.
    const forbidden = parsed.data.roles.filter((r) => !isSelfBindableRole(r));
    if (forbidden.length > 0) {
      return c.json({ error: "forbidden_role", forbidden }, 403);
    }
    const result = await bindUserToSchoolByCode(
      deps.db,
      c.get("userId"),
      parsed.data.schoolCode,
      parsed.data.roles,
    );
    if (!result.ok) return c.json({ error: result.reason }, 404);
    return c.json(result, 201);
  });

  // Scoped read: school_id comes from the server-resolved tenant only.
  app.get("/tenant-check/school", requireAuth, requireMembership, async (c) => {
    const tenant = c.get("tenant");
    const school = await getSchoolForTenant(deps.db, tenant);
    const memberships = await listMembershipsForTenant(deps.db, tenant);
    return c.json({
      schoolId: tenant.schoolId,
      school,
      membershipCount: memberships.length,
    });
  });

  // Scoped write: any school_id in the body is ignored; scope is server-side.
  app.post(
    "/tenant-check/school",
    requireAuth,
    requireMembership,
    requireRole("guru", "wali_kelas", "admin_sekolah", "soka_internal"),
    async (c) => {
      const body = await c.req.json().catch(() => ({}));
      const parsed = tenantCheckUpdateSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
      // NOTE: body.schoolId (if present) is never read. Scope = tenant only.
      const updated = await updateSchoolNameForTenant(
        deps.db,
        c.get("tenant"),
        parsed.data.name,
      );
      return c.json({ updated });
    },
  );

  return app;
}

export type App = ReturnType<typeof createApp>;
