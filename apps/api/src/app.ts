import { Hono, type Context, type Next } from "hono";
import { cors } from "hono/cors";
import {
  assignStudentToClass,
  assignTeacherToClass,
  bindUserToSchoolByCode,
  createClass,
  createParentLinkCode,
  createSchool,
  createStudent,
  createStudents,
  getActiveTenantContext,
  getSchoolForTenant,
  listChildrenForParent,
  listClasses,
  listMembershipsForTenant,
  listParentLinkCodes,
  listStudents,
  listUserMemberships,
  redeemParentLinkCode,
  revokeParentLinkCode,
  updateSchoolNameForTenant,
  TenantViolationError,
  type Database,
} from "@soka/db";
import {
  assignClassSchema,
  assignTeacherSchema,
  bulkStudentsSchema,
  createClassSchema,
  createLinkCodeSchema,
  createSchoolSchema,
  createStudentSchema,
  redeemLinkCodeSchema,
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

  // --- Sprint 003: Admin onboarding ----------------------------------------

  const requireAdmin = requireRole("admin_sekolah", "soka_internal");

  const readJson = async (c: Ctx) => c.req.json().catch(() => null);

  // Platform-level: only soka_internal may create schools.
  app.post(
    "/admin/schools",
    requireAuth,
    requireMembership,
    requireRole("soka_internal"),
    async (c) => {
      const parsed = createSchoolSchema.safeParse(await readJson(c));
      if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
      // School creation + admin binding happen in one transaction; an invalid
      // adminUserId aborts before any school row is created.
      const result = await createSchool(deps.db, {
        name: parsed.data.name,
        schoolCode: parsed.data.schoolCode,
        adminUserId: parsed.data.adminUserId,
      });
      if (!result.ok) {
        const status = result.reason === "admin_user_not_found" ? 404 : 409;
        return c.json({ error: result.reason }, status);
      }
      return c.json(result, 201);
    },
  );

  app.post("/admin/classes", requireAuth, requireMembership, requireAdmin, async (c) => {
    const parsed = createClassSchema.safeParse(await readJson(c));
    if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
    const created = await createClass(deps.db, c.get("tenant"), parsed.data);
    return c.json({ class: created }, 201);
  });

  app.get("/admin/classes", requireAuth, requireMembership, requireAdmin, async (c) => {
    return c.json({ classes: await listClasses(deps.db, c.get("tenant")) });
  });

  app.post("/admin/students", requireAuth, requireMembership, requireAdmin, async (c) => {
    const parsed = createStudentSchema.safeParse(await readJson(c));
    if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
    try {
      const created = await createStudent(deps.db, c.get("tenant"), parsed.data);
      return c.json({ student: created }, 201);
    } catch (err) {
      if (err instanceof TenantViolationError)
        return c.json({ error: "class_not_found" }, 404);
      throw err;
    }
  });

  app.post("/admin/students/bulk", requireAuth, requireMembership, requireAdmin, async (c) => {
    const parsed = bulkStudentsSchema.safeParse(await readJson(c));
    if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
    try {
      const created = await createStudents(deps.db, c.get("tenant"), parsed.data.students);
      return c.json({ students: created, count: created.length }, 201);
    } catch (err) {
      if (err instanceof TenantViolationError)
        return c.json({ error: "class_not_found" }, 404);
      throw err;
    }
  });

  app.get("/admin/students", requireAuth, requireMembership, requireAdmin, async (c) => {
    return c.json({ students: await listStudents(deps.db, c.get("tenant")) });
  });

  app.post(
    "/admin/students/:id/assign-class",
    requireAuth,
    requireMembership,
    requireAdmin,
    async (c) => {
      const studentId = c.req.param("id");
      if (!studentId) return c.json({ error: "invalid_input" }, 400);
      const parsed = assignClassSchema.safeParse(await readJson(c));
      if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
      const result = await assignStudentToClass(
        deps.db,
        c.get("tenant"),
        studentId,
        parsed.data.classId,
      );
      if (!result.ok) return c.json({ error: result.reason }, 404);
      return c.json({ ok: true });
    },
  );

  app.post(
    "/admin/classes/:id/teachers",
    requireAuth,
    requireMembership,
    requireAdmin,
    async (c) => {
      const classId = c.req.param("id");
      if (!classId) return c.json({ error: "invalid_input" }, 400);
      const parsed = assignTeacherSchema.safeParse(await readJson(c));
      if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
      const result = await assignTeacherToClass(
        deps.db,
        c.get("tenant"),
        classId,
        parsed.data.membershipId,
        parsed.data.roleInClass,
        parsed.data.subject,
      );
      if (!result.ok) {
        const status = result.reason === "membership_not_teacher" ? 422 : 404;
        return c.json({ error: result.reason }, status);
      }
      return c.json({ ok: true }, 201);
    },
  );

  app.post(
    "/admin/parent-link-codes",
    requireAuth,
    requireMembership,
    requireAdmin,
    async (c) => {
      const parsed = createLinkCodeSchema.safeParse(await readJson(c));
      if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
      const result = await createParentLinkCode(
        deps.db,
        c.get("tenant"),
        parsed.data.studentId,
        parsed.data.expiresInDays,
      );
      if (!result.ok) return c.json({ error: result.reason }, 404);
      return c.json({ code: result.code }, 201);
    },
  );

  app.get(
    "/admin/parent-link-codes",
    requireAuth,
    requireMembership,
    requireAdmin,
    async (c) => {
      return c.json({ codes: await listParentLinkCodes(deps.db, c.get("tenant")) });
    },
  );

  app.post(
    "/admin/parent-link-codes/:id/revoke",
    requireAuth,
    requireMembership,
    requireAdmin,
    async (c) => {
      const codeId = c.req.param("id");
      if (!codeId) return c.json({ error: "invalid_input" }, 400);
      const result = await revokeParentLinkCode(
        deps.db,
        c.get("tenant"),
        codeId,
      );
      if (!result.ok) return c.json({ error: result.reason }, 404);
      return c.json({ ok: true });
    },
  );

  // --- Sprint 003: Parent redemption + children ----------------------------

  // Redeem only needs auth: a parent may not have a membership yet. The school
  // and student are derived from the code, never from the client.
  app.post("/parent-links/redeem", requireAuth, async (c) => {
    const parsed = redeemLinkCodeSchema.safeParse(await readJson(c));
    if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
    const result = await redeemParentLinkCode(
      deps.db,
      c.get("userId"),
      parsed.data.code,
      parsed.data.relationship,
    );
    if (!result.ok) return c.json({ error: result.reason }, 400);
    return c.json(result, 201);
  });

  app.get("/me/children", requireAuth, async (c) => {
    return c.json({ children: await listChildrenForParent(deps.db, c.get("userId")) });
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
