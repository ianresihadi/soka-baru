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
  createParentMessage,
  createGrade,
  updateGrade,
  publishGrade,
  listGradesForTeacher,
  listPublishedGradesForParent,
  getParentGradeSummary,
  createStudentNote,
  updateStudentNote,
  publishStudentNote,
  unpublishStudentNote,
  listStudentNotesForTeacher,
  listPublishedStudentNotesForParent,
  getParentAttendanceHistory,
  getParentHome,
  getParentMessageThread,
  listLinkedChildrenForParent,
  listParentMessageThreads,
  listParentNotifications,
  markParentNotificationsRead,
  getActiveTenantContext,
  getOrCreateSchoolSettings,
  getPapanPagi,
  getSchoolForTenant,
  listChildrenForParent,
  listClasses,
  listMembershipsForTenant,
  listNotificationsForUser,
  listParentLinkCodes,
  listStudents,
  listTeacherClasses,
  listUnrepliedParentThreads,
  listUserMemberships,
  redeemParentLinkCode,
  replyToParentThread,
  revokeParentLinkCode,
  submitClassAttendance,
  updateSchoolNameForTenant,
  updateSchoolSettings,
  TenantViolationError,
  type Database,
} from "@soka/db";
import {
  assignClassSchema,
  assignTeacherSchema,
  attendanceDateSchema,
  bulkStudentsSchema,
  createClassSchema,
  createLinkCodeSchema,
  createSchoolSchema,
  createStudentSchema,
  papanPagiQuerySchema,
  parentMessageSchema,
  parentAttendanceQuerySchema,
  parentChildQuerySchema,
  parentNotificationsQuerySchema,
  parentThreadsQuerySchema,
  markNotificationsReadSchema,
  createGradeSchema,
  updateGradeSchema,
  gradeListQuerySchema,
  parentGradesQuerySchema,
  createStudentNoteSchema,
  updateStudentNoteSchema,
  studentNotesQuerySchema,
  parentStudentNotesQuerySchema,
  redeemLinkCodeSchema,
  schoolBindingSchema,
  schoolSettingsUpdateSchema,
  submitAttendanceSchema,
  teacherReplySchema,
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

  // --- Sprint 004: Guru daily loop -----------------------------------------

  const requireTeacher = requireRole(
    "guru",
    "wali_kelas",
    "admin_sekolah",
    "soka_internal",
  );

  app.get("/guru/classes", requireAuth, requireMembership, requireTeacher, async (c) => {
    return c.json({ classes: await listTeacherClasses(deps.db, c.get("tenant")) });
  });

  app.get("/guru/settings", requireAuth, requireMembership, requireTeacher, async (c) => {
    return c.json({ settings: await getOrCreateSchoolSettings(deps.db, c.get("tenant")) });
  });

  app.get("/guru/papan-pagi", requireAuth, requireMembership, requireTeacher, async (c) => {
    const parsed = papanPagiQuerySchema.safeParse({
      date: c.req.query("date"),
      classId: c.req.query("classId"),
    });
    if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
    const result = await getPapanPagi(deps.db, c.get("tenant"), parsed.data);
    if (!result.ok) {
      const status = result.reason === "forbidden_class" ? 403 : 404;
      return c.json({ error: result.reason }, status);
    }
    return c.json(result);
  });

  app.put(
    "/guru/classes/:classId/attendance/:date",
    requireAuth,
    requireMembership,
    requireTeacher,
    async (c) => {
      const classId = c.req.param("classId");
      const date = c.req.param("date");
      if (!classId || !date || !attendanceDateSchema.safeParse(date).success)
        return c.json({ error: "invalid_input" }, 400);
      const parsed = submitAttendanceSchema.safeParse(await readJson(c));
      if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
      const result = await submitClassAttendance(
        deps.db,
        c.get("tenant"),
        classId,
        date,
        parsed.data,
      );
      if (!result.ok) {
        const status =
          result.reason === "forbidden_class"
            ? 403
            : result.reason === "correction_reason_required" ||
                result.reason === "duplicate_student" ||
                result.reason === "student_not_in_class"
              ? 422
              : 404;
        return c.json({ error: result.reason }, status);
      }
      return c.json(result);
    },
  );

  app.get(
    "/guru/messages/unreplied",
    requireAuth,
    requireMembership,
    requireTeacher,
    async (c) => {
      const classId = c.req.query("classId");
      const threads = await listUnrepliedParentThreads(
        deps.db,
        c.get("tenant"),
        classId,
      );
      return c.json({ count: threads.length, threads });
    },
  );

  app.post(
    "/guru/messages/:threadId/reply",
    requireAuth,
    requireMembership,
    requireTeacher,
    async (c) => {
      const threadId = c.req.param("threadId");
      if (!threadId) return c.json({ error: "invalid_input" }, 400);
      const parsed = teacherReplySchema.safeParse(await readJson(c));
      if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
      const result = await replyToParentThread(
        deps.db,
        c.get("tenant"),
        threadId,
        parsed.data,
      );
      if (!result.ok) {
        const status = result.reason === "forbidden_class" ? 403 : 404;
        return c.json({ error: result.reason }, status);
      }
      return c.json(result, 201);
    },
  );

  app.patch(
    "/admin/school-settings",
    requireAuth,
    requireMembership,
    requireAdmin,
    async (c) => {
      const parsed = schoolSettingsUpdateSchema.safeParse(await readJson(c));
      if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
      const settings = await updateSchoolSettings(
        deps.db,
        c.get("tenant"),
        parsed.data,
      );
      return c.json({ settings });
    },
  );

  // Parent-support routes.
  app.post("/parent/messages", requireAuth, async (c) => {
    const parsed = parentMessageSchema.safeParse(await readJson(c));
    if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
    const result = await createParentMessage(
      deps.db,
      c.get("userId"),
      parsed.data,
    );
    if (!result.ok) {
      const status = result.reason === "student_not_found" ? 404 : 403;
      return c.json({ error: result.reason }, status);
    }
    return c.json(result, 201);
  });

  app.get("/me/notifications", requireAuth, async (c) => {
    return c.json({
      notifications: await listNotificationsForUser(deps.db, c.get("userId")),
    });
  });

  // --- Sprint 005: Parent trust loop ---------------------------------------
  // Parent routes require only an authenticated session. Data access is derived
  // from parent_student_links + the caller's memberships (never an active tenant
  // or a client-supplied school_id).

  app.get("/parent/children", requireAuth, async (c) => {
    return c.json({
      children: await listLinkedChildrenForParent(deps.db, c.get("userId")),
    });
  });

  app.get("/parent/home", requireAuth, async (c) => {
    const parsed = parentChildQuerySchema.safeParse({
      studentId: c.req.query("studentId"),
    });
    if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
    const result = await getParentHome(deps.db, c.get("userId"), parsed.data);
    if (!result.ok) return c.json({ error: result.reason }, 403);
    return c.json(result);
  });

  app.get("/parent/attendance", requireAuth, async (c) => {
    const parsed = parentAttendanceQuerySchema.safeParse({
      studentId: c.req.query("studentId"),
      from: c.req.query("from"),
      to: c.req.query("to"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
    const result = await getParentAttendanceHistory(
      deps.db,
      c.get("userId"),
      parsed.data,
    );
    if (!result.ok) {
      return c.json({ error: result.reason }, result.reason === "no_child" ? 404 : 403);
    }
    return c.json(result);
  });

  app.get("/parent/notifications", requireAuth, async (c) => {
    const parsed = parentNotificationsQuerySchema.safeParse({
      studentId: c.req.query("studentId"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
    const result = await listParentNotifications(
      deps.db,
      c.get("userId"),
      parsed.data,
    );
    if (!result.ok) return c.json({ error: result.reason }, 403);
    return c.json({ notifications: result.items });
  });

  app.post("/parent/notifications/read", requireAuth, async (c) => {
    const parsed = markNotificationsReadSchema.safeParse(await readJson(c));
    if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
    const result = await markParentNotificationsRead(
      deps.db,
      c.get("userId"),
      parsed.data,
    );
    return c.json(result);
  });

  app.get("/parent/messages/threads", requireAuth, async (c) => {
    const parsed = parentThreadsQuerySchema.safeParse({
      studentId: c.req.query("studentId"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
    const result = await listParentMessageThreads(
      deps.db,
      c.get("userId"),
      parsed.data,
    );
    if (!result.ok) return c.json({ error: result.reason }, 403);
    return c.json({ threads: result.items });
  });

  app.get("/parent/messages/threads/:threadId", requireAuth, async (c) => {
    const threadId = c.req.param("threadId");
    if (!threadId) return c.json({ error: "invalid_input" }, 400);
    const result = await getParentMessageThread(
      deps.db,
      c.get("userId"),
      threadId,
    );
    if (!result.ok) return c.json({ error: result.reason }, 404);
    return c.json(result);
  });

  // --- Sprint 006: Nilai & Catatan -----------------------------------------

  // Map teacher service reasons to HTTP statuses.
  const teacherStatus = (reason: string): 403 | 404 | 422 => {
    if (reason === "forbidden_class") return 403;
    if (reason === "student_not_in_class" || reason === "score_exceeds_max") return 422;
    return 404; // class_not_found / grade_not_found / note_not_found
  };
  const parentStatus = (reason: string): 403 | 404 =>
    reason === "no_child" ? 404 : 403;

  // Grades (teacher/admin)
  app.get(
    "/guru/classes/:classId/grades",
    requireAuth,
    requireMembership,
    requireTeacher,
    async (c) => {
      const classId = c.req.param("classId");
      if (!classId) return c.json({ error: "invalid_input" }, 400);
      const parsed = gradeListQuerySchema.safeParse({
        studentId: c.req.query("studentId"),
        subject: c.req.query("subject"),
        visibility: c.req.query("visibility"),
        limit: c.req.query("limit"),
      });
      if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
      const result = await listGradesForTeacher(deps.db, c.get("tenant"), classId, parsed.data);
      if (!result.ok) return c.json({ error: result.reason }, teacherStatus(result.reason));
      return c.json({ grades: result.grades });
    },
  );

  app.post(
    "/guru/classes/:classId/grades",
    requireAuth,
    requireMembership,
    requireTeacher,
    async (c) => {
      const classId = c.req.param("classId");
      if (!classId) return c.json({ error: "invalid_input" }, 400);
      const parsed = createGradeSchema.safeParse(await readJson(c));
      if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
      const result = await createGrade(deps.db, c.get("tenant"), classId, parsed.data);
      if (!result.ok) return c.json({ error: result.reason }, teacherStatus(result.reason));
      return c.json({ grade: result.grade }, 201);
    },
  );

  app.patch(
    "/guru/grades/:gradeId",
    requireAuth,
    requireMembership,
    requireTeacher,
    async (c) => {
      const gradeId = c.req.param("gradeId");
      if (!gradeId) return c.json({ error: "invalid_input" }, 400);
      const parsed = updateGradeSchema.safeParse(await readJson(c));
      if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
      const result = await updateGrade(deps.db, c.get("tenant"), gradeId, parsed.data);
      if (!result.ok) return c.json({ error: result.reason }, teacherStatus(result.reason));
      return c.json({ grade: result.grade });
    },
  );

  app.post(
    "/guru/grades/:gradeId/publish",
    requireAuth,
    requireMembership,
    requireTeacher,
    async (c) => {
      const gradeId = c.req.param("gradeId");
      if (!gradeId) return c.json({ error: "invalid_input" }, 400);
      const result = await publishGrade(deps.db, c.get("tenant"), gradeId);
      if (!result.ok) return c.json({ error: result.reason }, teacherStatus(result.reason));
      return c.json(result);
    },
  );

  // Student notes (teacher/admin)
  app.get(
    "/guru/classes/:classId/student-notes",
    requireAuth,
    requireMembership,
    requireTeacher,
    async (c) => {
      const classId = c.req.param("classId");
      if (!classId) return c.json({ error: "invalid_input" }, 400);
      const parsed = studentNotesQuerySchema.safeParse({
        studentId: c.req.query("studentId"),
        visibility: c.req.query("visibility"),
        limit: c.req.query("limit"),
      });
      if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
      const result = await listStudentNotesForTeacher(deps.db, c.get("tenant"), classId, parsed.data);
      if (!result.ok) return c.json({ error: result.reason }, teacherStatus(result.reason));
      return c.json({ notes: result.notes });
    },
  );

  app.post(
    "/guru/classes/:classId/student-notes",
    requireAuth,
    requireMembership,
    requireTeacher,
    async (c) => {
      const classId = c.req.param("classId");
      if (!classId) return c.json({ error: "invalid_input" }, 400);
      const parsed = createStudentNoteSchema.safeParse(await readJson(c));
      if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
      const result = await createStudentNote(deps.db, c.get("tenant"), classId, parsed.data);
      if (!result.ok) return c.json({ error: result.reason }, teacherStatus(result.reason));
      return c.json({ note: result.note }, 201);
    },
  );

  app.patch(
    "/guru/student-notes/:noteId",
    requireAuth,
    requireMembership,
    requireTeacher,
    async (c) => {
      const noteId = c.req.param("noteId");
      if (!noteId) return c.json({ error: "invalid_input" }, 400);
      const parsed = updateStudentNoteSchema.safeParse(await readJson(c));
      if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
      const result = await updateStudentNote(deps.db, c.get("tenant"), noteId, parsed.data);
      if (!result.ok) return c.json({ error: result.reason }, teacherStatus(result.reason));
      return c.json({ note: result.note });
    },
  );

  app.post(
    "/guru/student-notes/:noteId/publish",
    requireAuth,
    requireMembership,
    requireTeacher,
    async (c) => {
      const noteId = c.req.param("noteId");
      if (!noteId) return c.json({ error: "invalid_input" }, 400);
      const result = await publishStudentNote(deps.db, c.get("tenant"), noteId);
      if (!result.ok) return c.json({ error: result.reason }, teacherStatus(result.reason));
      return c.json(result);
    },
  );

  app.post(
    "/guru/student-notes/:noteId/unpublish",
    requireAuth,
    requireMembership,
    requireTeacher,
    async (c) => {
      const noteId = c.req.param("noteId");
      if (!noteId) return c.json({ error: "invalid_input" }, 400);
      const result = await unpublishStudentNote(deps.db, c.get("tenant"), noteId);
      if (!result.ok) return c.json({ error: result.reason }, teacherStatus(result.reason));
      return c.json(result);
    },
  );

  // Parent grade/note views (session only; published-only)
  app.get("/parent/grades", requireAuth, async (c) => {
    const parsed = parentGradesQuerySchema.safeParse({
      studentId: c.req.query("studentId"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
    const result = await listPublishedGradesForParent(deps.db, c.get("userId"), parsed.data);
    if (!result.ok) return c.json({ error: result.reason }, parentStatus(result.reason));
    return c.json({ studentId: result.studentId, grades: result.grades });
  });

  app.get("/parent/grades/summary", requireAuth, async (c) => {
    const parsed = parentGradesQuerySchema.safeParse({
      studentId: c.req.query("studentId"),
    });
    if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
    const result = await getParentGradeSummary(deps.db, c.get("userId"), parsed.data);
    if (!result.ok) return c.json({ error: result.reason }, parentStatus(result.reason));
    return c.json(result);
  });

  app.get("/parent/student-notes", requireAuth, async (c) => {
    const parsed = parentStudentNotesQuerySchema.safeParse({
      studentId: c.req.query("studentId"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) return c.json({ error: "invalid_input" }, 400);
    const result = await listPublishedStudentNotesForParent(deps.db, c.get("userId"), parsed.data);
    if (!result.ok) return c.json({ error: result.reason }, parentStatus(result.reason));
    return c.json({ studentId: result.studentId, notes: result.notes });
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
