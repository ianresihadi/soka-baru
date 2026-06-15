import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type {
  AttendanceCompletion,
  AttendanceStatus,
  Role,
  TenantContext,
} from "@soka/shared";
import { NOTIFY_ATTENDANCE_STATUSES } from "@soka/shared";
import type { Database } from "./client";
import {
  attendanceRecords,
  auditEvents,
  classes,
  messageThreads,
  messages,
  notifications,
  parentStudentLinks,
  schoolMemberships,
  schoolSettings,
  students,
  teacherAssignments,
} from "./schema";

// ---------------------------------------------------------------------------
// Timezone helpers — the attendance cutoff is school-local wall-clock time.
// We never hardcode UTC as a business rule; the school timezone comes from
// school_settings (default Asia/Jakarta).
// ---------------------------------------------------------------------------

/** Offset (ms) between the given timezone's wall-clock and UTC at an instant. */
function tzOffsetMs(instant: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const m: Record<string, string> = {};
  for (const p of dtf.formatToParts(instant)) {
    if (p.type !== "literal") m[p.type] = p.value;
  }
  let hour = Number(m.hour);
  if (hour === 24) hour = 0; // some engines render midnight as 24
  const asUTC = Date.UTC(
    Number(m.year),
    Number(m.month) - 1,
    Number(m.day),
    hour,
    Number(m.minute),
    Number(m.second),
  );
  return asUTC - instant.getTime();
}

/** The school-local calendar date (YYYY-MM-DD) for an instant. */
export function localDateString(instant: Date, tz: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** The UTC instant corresponding to a local wall-clock cutoff on a given date. */
export function cutoffInstant(
  dateStr: string,
  cutoff: string,
  tz: string,
): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = cutoff.split(":").map(Number);
  const guess = Date.UTC(y!, mo! - 1, d!, h!, mi!, 0);
  const offset = tzOffsetMs(new Date(guess), tz);
  return new Date(guess - offset);
}

function isAdminLike(tenant: TenantContext): boolean {
  return tenant.roles.some(
    (r) => r === "admin_sekolah" || r === "soka_internal",
  );
}

function teacherReplyRole(tenant: TenantContext): Role {
  return tenant.roles.includes("wali_kelas") ? "wali_kelas" : "guru";
}

// ---------------------------------------------------------------------------
// School settings
// ---------------------------------------------------------------------------

export async function getOrCreateSchoolSettings(
  db: Database,
  tenant: TenantContext,
) {
  const rows = await db
    .select()
    .from(schoolSettings)
    .where(eq(schoolSettings.schoolId, tenant.schoolId));
  if (rows[0]) return rows[0];
  const inserted = await db
    .insert(schoolSettings)
    .values({ schoolId: tenant.schoolId })
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) return inserted[0];
  // Lost a race; read the existing row.
  const again = await db
    .select()
    .from(schoolSettings)
    .where(eq(schoolSettings.schoolId, tenant.schoolId));
  return again[0]!;
}

export async function updateSchoolSettings(
  db: Database,
  tenant: TenantContext,
  input: {
    attendanceCutoffTime?: string;
    schoolTimezone?: string;
    defaultKkm?: number;
  },
) {
  await getOrCreateSchoolSettings(db, tenant);
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (input.attendanceCutoffTime !== undefined)
    set.attendanceCutoffTime = input.attendanceCutoffTime;
  if (input.schoolTimezone !== undefined)
    set.schoolTimezone = input.schoolTimezone;
  if (input.defaultKkm !== undefined) set.defaultKkm = input.defaultKkm;
  const updated = await db
    .update(schoolSettings)
    .set(set)
    .where(eq(schoolSettings.schoolId, tenant.schoolId))
    .returning();
  return updated[0]!;
}

// ---------------------------------------------------------------------------
// Class access
// ---------------------------------------------------------------------------

export async function listTeacherClasses(db: Database, tenant: TenantContext) {
  if (isAdminLike(tenant)) {
    return db
      .select()
      .from(classes)
      .where(eq(classes.schoolId, tenant.schoolId));
  }
  return db
    .select({
      id: classes.id,
      schoolId: classes.schoolId,
      name: classes.name,
      gradeLevel: classes.gradeLevel,
      academicYear: classes.academicYear,
      createdAt: classes.createdAt,
      updatedAt: classes.updatedAt,
    })
    .from(teacherAssignments)
    .innerJoin(classes, eq(teacherAssignments.classId, classes.id))
    .where(
      and(
        eq(teacherAssignments.schoolId, tenant.schoolId),
        eq(teacherAssignments.membershipId, tenant.membershipId),
      ),
    );
}

export type AccessResult =
  | { ok: true }
  | { ok: false; reason: "class_not_found" | "forbidden_class" };

export async function assertCanOperateClass(
  db: Database,
  tenant: TenantContext,
  classId: string,
): Promise<AccessResult> {
  const cls = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.schoolId, tenant.schoolId)));
  if (!cls[0]) return { ok: false, reason: "class_not_found" };
  if (isAdminLike(tenant)) return { ok: true };
  const assignment = await db
    .select({ id: teacherAssignments.id })
    .from(teacherAssignments)
    .where(
      and(
        eq(teacherAssignments.classId, classId),
        eq(teacherAssignments.membershipId, tenant.membershipId),
      ),
    );
  return assignment[0] ? { ok: true } : { ok: false, reason: "forbidden_class" };
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export type SubmitAttendanceResult =
  | { ok: true; recorded: number; corrected: number; notified: number }
  | {
      ok: false;
      reason:
        | "class_not_found"
        | "forbidden_class"
        | "student_not_in_class"
        | "duplicate_student"
        | "correction_reason_required";
    };

export async function submitClassAttendance(
  db: Database,
  tenant: TenantContext,
  classId: string,
  date: string,
  input: {
    records: { studentId: string; status: AttendanceStatus; note?: string }[];
    correctionReason?: string;
  },
  now: Date = new Date(),
): Promise<SubmitAttendanceResult> {
  const access = await assertCanOperateClass(db, tenant, classId);
  if (!access.ok) return access;

  // Reject duplicate students in the same submission.
  const ids = input.records.map((r) => r.studentId);
  if (new Set(ids).size !== ids.length)
    return { ok: false, reason: "duplicate_student" };

  // Every submitted student must belong to this class + school.
  const classStudents = await db
    .select({ id: students.id })
    .from(students)
    .where(
      and(eq(students.classId, classId), eq(students.schoolId, tenant.schoolId)),
    );
  const classStudentIds = new Set(classStudents.map((s) => s.id));
  for (const id of ids) {
    if (!classStudentIds.has(id))
      return { ok: false, reason: "student_not_in_class" };
  }

  const settings = await getOrCreateSchoolSettings(db, tenant);
  const todayLocal = localDateString(now, settings.schoolTimezone);
  const isPostDay = date < todayLocal;

  return db.transaction(async (tx) => {
    // Existing rows for these students/date, to detect changes.
    const existing = await tx
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.schoolId, tenant.schoolId),
          eq(attendanceRecords.attendanceDate, date),
          inArray(attendanceRecords.studentId, ids),
        ),
      );
    const existingByStudent = new Map(existing.map((r) => [r.studentId, r]));

    // Post-day changes to an existing row require a correction reason.
    if (isPostDay && !input.correctionReason) {
      const changesExisting = input.records.some((r) => {
        const prev = existingByStudent.get(r.studentId);
        return prev && (prev.status !== r.status || (prev.note ?? undefined) !== r.note);
      });
      if (changesExisting)
        return { ok: false, reason: "correction_reason_required" as const };
    }

    let corrected = 0;
    let notified = 0;

    for (const r of input.records) {
      const prev = existingByStudent.get(r.studentId);
      await tx
        .insert(attendanceRecords)
        .values({
          schoolId: tenant.schoolId,
          classId,
          studentId: r.studentId,
          attendanceDate: date,
          status: r.status,
          recordedByMembershipId: tenant.membershipId,
          note: r.note ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            attendanceRecords.schoolId,
            attendanceRecords.studentId,
            attendanceRecords.attendanceDate,
          ],
          set: { status: r.status, note: r.note ?? null, updatedAt: now },
        });

      const statusChanged = !prev || prev.status !== r.status;

      // Post-day correction audit (only when an existing row actually changed).
      if (
        isPostDay &&
        prev &&
        (prev.status !== r.status || (prev.note ?? undefined) !== r.note)
      ) {
        corrected++;
        await tx.insert(auditEvents).values({
          schoolId: tenant.schoolId,
          actorUserId: tenant.userId,
          action: "attendance_record.corrected",
          entityType: "attendance_record",
          entityId: r.studentId,
          metadata: {
            date,
            from: prev.status,
            to: r.status,
            reason: input.correctionReason,
          },
        });
      }

      // Notifications for non-present/late statuses.
      if (
        NOTIFY_ATTENDANCE_STATUSES.includes(r.status) &&
        (statusChanged || !prev)
      ) {
        notified += await createAttendanceNotifications(
          tx,
          tenant.schoolId,
          r.studentId,
          date,
          r.status,
        );
      }
    }

    const recordedNow = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.schoolId, tenant.schoolId),
          eq(attendanceRecords.classId, classId),
          eq(attendanceRecords.attendanceDate, date),
        ),
      );

    return {
      ok: true as const,
      recorded: recordedNow[0]?.count ?? 0,
      corrected,
      notified,
    };
  });
}

/** Create dedup-safe notifications for a student's linked parents. */
async function createAttendanceNotifications(
  tx: Database,
  schoolId: string,
  studentId: string,
  date: string,
  status: AttendanceStatus,
): Promise<number> {
  const student = await tx
    .select({ fullName: students.fullName })
    .from(students)
    .where(eq(students.id, studentId));
  const studentName = student[0]?.fullName ?? "Siswa";

  const parents = await tx
    .select({ membershipId: parentStudentLinks.parentMembershipId })
    .from(parentStudentLinks)
    .where(
      and(
        eq(parentStudentLinks.studentId, studentId),
        eq(parentStudentLinks.schoolId, schoolId),
      ),
    );

  let created = 0;
  for (const p of parents) {
    // Dedup: skip if a notification already exists for this
    // student/date/status and recipient.
    const dup = await tx
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientMembershipId, p.membershipId),
          eq(notifications.studentId, studentId),
          sql`(${notifications.payload}->>'date') = ${date}`,
          sql`(${notifications.payload}->>'status') = ${status}`,
        ),
      );
    if (dup[0]) continue;

    await tx.insert(notifications).values({
      schoolId,
      recipientMembershipId: p.membershipId,
      studentId,
      type: "attendance",
      title: "Absensi diperbarui",
      body: `${studentName} tercatat ${status} hari ini.`,
      payload: { date, status },
    });
    created++;
  }
  return created;
}

// ---------------------------------------------------------------------------
// Papan Pagi
// ---------------------------------------------------------------------------

export type PapanPagiResult =
  | { ok: false; reason: "no_class" | "class_not_found" | "forbidden_class" }
  | {
      ok: true;
      classId: string;
      date: string;
      attendance: {
        total: number;
        recorded: number;
        missing: number;
        byStatus: Record<string, number>;
        completion: AttendanceCompletion;
        cutoffTime: string;
        timezone: string;
      };
      roster: { studentId: string; fullName: string; status: string | null }[];
      unrepliedMessages: {
        count: number;
        oldestWaitingAt: Date | null;
        threads: { threadId: string; studentId: string; lastParentMessageAt: Date | null }[];
      };
      attentionStudents: {
        studentId: string;
        fullName: string;
        reasons: string[];
      }[];
      schedule: { classId: string; subject: string | null; roleInClass: string }[];
    };

export async function getPapanPagi(
  db: Database,
  tenant: TenantContext,
  input: { classId?: string; date?: string },
  now: Date = new Date(),
): Promise<PapanPagiResult> {
  const settings = await getOrCreateSchoolSettings(db, tenant);
  const tz = settings.schoolTimezone;
  const date = input.date ?? localDateString(now, tz);

  let classId = input.classId;
  if (!classId) {
    const teacherClasses = await listTeacherClasses(db, tenant);
    if (!teacherClasses[0]) return { ok: false, reason: "no_class" };
    classId = teacherClasses[0].id;
  }
  const access = await assertCanOperateClass(db, tenant, classId);
  if (!access.ok) return access;

  // 1. Status Absensi Hari Ini
  const classStudents = await db
    .select({ id: students.id, status: students.status })
    .from(students)
    .where(
      and(eq(students.classId, classId), eq(students.schoolId, tenant.schoolId)),
    );
  const activeIds = classStudents.filter((s) => s.status === "active").map((s) => s.id);

  const records = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.schoolId, tenant.schoolId),
        eq(attendanceRecords.classId, classId),
        eq(attendanceRecords.attendanceDate, date),
      ),
    );
  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

  const recordedActive = activeIds.filter((id) =>
    records.some((r) => r.studentId === id),
  );
  let completion: AttendanceCompletion;
  if (records.length === 0) {
    completion = "not_started";
  } else if (recordedActive.length < activeIds.length) {
    completion = "in_progress";
  } else {
    // All active students recorded: compare completion time to the cutoff.
    const completedAt = records.reduce(
      (max, r) => (r.createdAt > max ? r.createdAt : max),
      records[0]!.createdAt,
    );
    const cutoff = cutoffInstant(date, settings.attendanceCutoffTime, tz);
    completion =
      completedAt.getTime() <= cutoff.getTime()
        ? "completed_on_time"
        : "completed_late";
  }

  // 2. Pesan Ortu Belum Dibalas
  const unreplied = await listUnrepliedParentThreads(db, tenant, classId);
  const oldestWaitingAt = unreplied.reduce<Date | null>((oldest, t) => {
    if (!t.lastParentMessageAt) return oldest;
    if (!oldest || t.lastParentMessageAt < oldest) return t.lastParentMessageAt;
    return oldest;
  }, null);

  // 3. Siswa Perlu Perhatian
  const attentionMap = new Map<string, { fullName: string; reasons: string[] }>();
  const studentMeta = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      objectiveStatus: students.objectiveStatus,
    })
    .from(students)
    .where(
      and(eq(students.classId, classId), eq(students.schoolId, tenant.schoolId)),
    );
  const metaById = new Map(studentMeta.map((s) => [s.id, s]));
  const addReason = (id: string, reason: string) => {
    const meta = metaById.get(id);
    if (!meta) return;
    const entry = attentionMap.get(id) ?? { fullName: meta.fullName, reasons: [] };
    entry.reasons.push(reason);
    attentionMap.set(id, entry);
  };
  for (const r of records) {
    if (r.status === "alpa") addReason(r.studentId, "alpa_today");
    if (r.status === "terlambat") addReason(r.studentId, "terlambat_today");
  }
  for (const s of studentMeta) {
    if (s.objectiveStatus === "perhatian" || s.objectiveStatus === "kritis")
      addReason(s.id, `status_${s.objectiveStatus}`);
  }
  const attentionStudents = [...attentionMap.entries()].map(([studentId, v]) => ({
    studentId,
    fullName: v.fullName,
    reasons: v.reasons,
  }));

  // 4. Jadwal Mengajar Hari Ini (placeholder from assignments)
  const schedule = await db
    .select({
      classId: teacherAssignments.classId,
      subject: teacherAssignments.subject,
      roleInClass: teacherAssignments.roleInClass,
    })
    .from(teacherAssignments)
    .where(
      and(
        eq(teacherAssignments.schoolId, tenant.schoolId),
        eq(teacherAssignments.classId, classId),
      ),
    );

  return {
    ok: true,
    classId,
    date,
    attendance: {
      total: activeIds.length,
      recorded: recordedActive.length,
      missing: activeIds.length - recordedActive.length,
      byStatus,
      completion,
      cutoffTime: settings.attendanceCutoffTime,
      timezone: tz,
    },
    roster: studentMeta.map((s) => {
      const cs = classStudents.find((c) => c.id === s.id);
      return { studentId: s.id, fullName: s.fullName, status: cs?.status ?? null };
    }),
    unrepliedMessages: {
      count: unreplied.length,
      oldestWaitingAt,
      threads: unreplied.slice(0, 5).map((t) => ({
        threadId: t.id,
        studentId: t.studentId,
        lastParentMessageAt: t.lastParentMessageAt,
      })),
    },
    attentionStudents,
    schedule,
  };
}

// ---------------------------------------------------------------------------
// Parent messages
// ---------------------------------------------------------------------------

export type CreateMessageResult =
  | { ok: true; threadId: string; messageId: string }
  | { ok: false; reason: "student_not_found" | "not_linked" };

export async function createParentMessage(
  db: Database,
  userId: string,
  input: { studentId: string; body: string },
): Promise<CreateMessageResult> {
  const studentRows = await db
    .select()
    .from(students)
    .where(eq(students.id, input.studentId));
  const student = studentRows[0];
  if (!student) return { ok: false, reason: "student_not_found" };

  const membershipRows = await db
    .select()
    .from(schoolMemberships)
    .where(
      and(
        eq(schoolMemberships.userId, userId),
        eq(schoolMemberships.schoolId, student.schoolId),
      ),
    );
  const membership = membershipRows[0];
  if (!membership) return { ok: false, reason: "not_linked" };

  const link = await db
    .select({ id: parentStudentLinks.id })
    .from(parentStudentLinks)
    .where(
      and(
        eq(parentStudentLinks.studentId, student.id),
        eq(parentStudentLinks.parentMembershipId, membership.id),
      ),
    );
  if (!link[0]) return { ok: false, reason: "not_linked" };

  return db.transaction(async (tx) => {
    const existingThread = await tx
      .select()
      .from(messageThreads)
      .where(
        and(
          eq(messageThreads.studentId, student.id),
          eq(messageThreads.parentMembershipId, membership.id),
        ),
      );
    const now = new Date();
    let threadId = existingThread[0]?.id;
    if (!threadId) {
      const inserted = await tx
        .insert(messageThreads)
        .values({
          schoolId: student.schoolId,
          studentId: student.id,
          parentMembershipId: membership.id,
          classId: student.classId,
          lastMessageAt: now,
          lastParentMessageAt: now,
        })
        .returning();
      threadId = inserted[0]!.id;
    } else {
      await tx
        .update(messageThreads)
        .set({ lastMessageAt: now, lastParentMessageAt: now, updatedAt: now })
        .where(eq(messageThreads.id, threadId));
    }

    const msg = await tx
      .insert(messages)
      .values({
        schoolId: student.schoolId,
        threadId,
        studentId: student.id,
        senderMembershipId: membership.id,
        senderRole: "orang_tua",
        body: input.body,
      })
      .returning();

    return { ok: true as const, threadId, messageId: msg[0]!.id };
  });
}

/** Threads still waiting for a teacher reply, scoped to the teacher's classes. */
export async function listUnrepliedParentThreads(
  db: Database,
  tenant: TenantContext,
  classId?: string,
) {
  const conditions = [
    eq(messageThreads.schoolId, tenant.schoolId),
    // unreplied = a parent message exists and there is no later teacher reply
    sql`${messageThreads.lastParentMessageAt} is not null`,
    sql`(${messageThreads.lastTeacherReplyAt} is null or ${messageThreads.lastParentMessageAt} > ${messageThreads.lastTeacherReplyAt})`,
  ];
  if (classId) conditions.push(eq(messageThreads.classId, classId));

  let rows = await db
    .select()
    .from(messageThreads)
    .where(and(...conditions));

  // Non-admin teachers only see threads for classes they can operate.
  if (!isAdminLike(tenant)) {
    const assigned = await db
      .select({ classId: teacherAssignments.classId })
      .from(teacherAssignments)
      .where(
        and(
          eq(teacherAssignments.schoolId, tenant.schoolId),
          eq(teacherAssignments.membershipId, tenant.membershipId),
        ),
      );
    const allowed = new Set(assigned.map((a) => a.classId));
    rows = rows.filter((t) => t.classId && allowed.has(t.classId));
  }
  return rows;
}

export type ReplyResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: "thread_not_found" | "forbidden_class" };

export async function replyToParentThread(
  db: Database,
  tenant: TenantContext,
  threadId: string,
  input: { body: string },
): Promise<ReplyResult> {
  const threadRows = await db
    .select()
    .from(messageThreads)
    .where(
      and(
        eq(messageThreads.id, threadId),
        eq(messageThreads.schoolId, tenant.schoolId),
      ),
    );
  const thread = threadRows[0];
  if (!thread) return { ok: false, reason: "thread_not_found" };

  if (thread.classId) {
    const access = await assertCanOperateClass(db, tenant, thread.classId);
    if (!access.ok) return { ok: false, reason: "forbidden_class" };
  } else if (!isAdminLike(tenant)) {
    return { ok: false, reason: "forbidden_class" };
  }

  return db.transaction(async (tx) => {
    const now = new Date();
    const msg = await tx
      .insert(messages)
      .values({
        schoolId: tenant.schoolId,
        threadId,
        studentId: thread.studentId,
        senderMembershipId: tenant.membershipId,
        senderRole: teacherReplyRole(tenant),
        body: input.body,
      })
      .returning();
    await tx
      .update(messageThreads)
      .set({ lastTeacherReplyAt: now, lastMessageAt: now, updatedAt: now })
      .where(eq(messageThreads.id, threadId));
    return { ok: true as const, messageId: msg[0]!.id };
  });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function listNotificationsForUser(db: Database, userId: string) {
  const memberships = await db
    .select({ id: schoolMemberships.id })
    .from(schoolMemberships)
    .where(eq(schoolMemberships.userId, userId));
  if (memberships.length === 0) return [];
  const ids = memberships.map((m) => m.id);
  return db
    .select()
    .from(notifications)
    .where(inArray(notifications.recipientMembershipId, ids))
    .orderBy(desc(notifications.createdAt));
}
