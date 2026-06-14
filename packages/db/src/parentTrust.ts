import { and, asc, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import {
  PARENT_LIMITS,
  clampLimit,
  type AttendanceStatus,
} from "@soka/shared";
import type { Database } from "./client";
import { localDateString } from "./dailyLoop";
import {
  attendanceRecords,
  classes,
  messageThreads,
  messages,
  notifications,
  parentStudentLinks,
  schoolMemberships,
  schoolSettings,
  schools,
  students,
} from "./schema";

const DEFAULT_TZ = "Asia/Jakarta";
const DEFAULT_CUTOFF = "07:30";
const RECENT_ATTENDANCE = 14;

export interface LinkedChild {
  studentId: string;
  fullName: string;
  objectiveStatus: string;
  schoolId: string;
  schoolName: string;
  classId: string | null;
  className: string | null;
  relationship: string | null;
  parentMembershipId: string;
}

async function parentMembershipIds(db: Database, userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: schoolMemberships.id })
    .from(schoolMemberships)
    .where(eq(schoolMemberships.userId, userId));
  return rows.map((r) => r.id);
}

/**
 * Linked children for a parent, derived only from parent_student_links connected
 * to the caller's memberships. Deterministic order: link creation time, then
 * student name (never relies on implicit DB ordering).
 */
export async function listLinkedChildrenForParent(
  db: Database,
  userId: string,
): Promise<LinkedChild[]> {
  const memberships = await parentMembershipIds(db, userId);
  if (memberships.length === 0) return [];
  return db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      objectiveStatus: students.objectiveStatus,
      schoolId: students.schoolId,
      schoolName: schools.name,
      classId: students.classId,
      className: classes.name,
      relationship: parentStudentLinks.relationship,
      parentMembershipId: parentStudentLinks.parentMembershipId,
    })
    .from(parentStudentLinks)
    .innerJoin(students, eq(parentStudentLinks.studentId, students.id))
    .innerJoin(schools, eq(students.schoolId, schools.id))
    .leftJoin(classes, eq(students.classId, classes.id))
    .where(inArray(parentStudentLinks.parentMembershipId, memberships))
    .orderBy(asc(parentStudentLinks.createdAt), asc(students.fullName));
}

/** Resolve a single linked child for the caller, or null if not accessible. */
export async function assertParentCanAccessStudent(
  db: Database,
  userId: string,
  studentId: string,
): Promise<LinkedChild | null> {
  const children = await listLinkedChildrenForParent(db, userId);
  return children.find((c) => c.studentId === studentId) ?? null;
}

async function getSettingsBySchoolId(db: Database, schoolId: string) {
  const rows = await db
    .select()
    .from(schoolSettings)
    .where(eq(schoolSettings.schoolId, schoolId));
  return {
    attendanceCutoffTime: rows[0]?.attendanceCutoffTime ?? DEFAULT_CUTOFF,
    schoolTimezone: rows[0]?.schoolTimezone ?? DEFAULT_TZ,
  };
}

export type ParentHomeResult =
  | { ok: false; reason: "not_linked" }
  | {
      ok: true;
      children: LinkedChild[];
      selectedChild: LinkedChild | null;
      today: {
        date: string;
        attendanceStatus: AttendanceStatus | null;
        attendanceRecordedAt: Date | null;
        attendanceNote: string | null;
      } | null;
      reassurance: { headline: string; needsAction: boolean; reasons: string[] } | null;
      latestNotification: typeof notifications.$inferSelect | null;
      latestMessageThread: typeof messageThreads.$inferSelect | null;
      recentAttendance: (typeof attendanceRecords.$inferSelect)[];
    };

export async function getParentHome(
  db: Database,
  userId: string,
  input: { studentId?: string },
  now: Date = new Date(),
): Promise<ParentHomeResult> {
  const children = await listLinkedChildrenForParent(db, userId);

  if (children.length === 0) {
    return {
      ok: true,
      children: [],
      selectedChild: null,
      today: null,
      reassurance: null,
      latestNotification: null,
      latestMessageThread: null,
      recentAttendance: [],
    };
  }

  const selected = input.studentId
    ? children.find((c) => c.studentId === input.studentId)
    : children[0];
  if (!selected) return { ok: false, reason: "not_linked" };

  const settings = await getSettingsBySchoolId(db, selected.schoolId);
  const todayStr = localDateString(now, settings.schoolTimezone);

  const todayRows = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.studentId, selected.studentId),
        eq(attendanceRecords.attendanceDate, todayStr),
      ),
    );
  const todayRec = todayRows[0] ?? null;

  const recentAttendance = await db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.studentId, selected.studentId))
    .orderBy(desc(attendanceRecords.attendanceDate))
    .limit(RECENT_ATTENDANCE);

  const latestNotifRows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientMembershipId, selected.parentMembershipId),
        eq(notifications.studentId, selected.studentId),
      ),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(1);
  const latestNotification = latestNotifRows[0] ?? null;

  // Detect ANY unread notification for this child (not just the latest one):
  // a newer read notification must not hide an older unread one.
  const unreadRows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientMembershipId, selected.parentMembershipId),
        eq(notifications.studentId, selected.studentId),
        isNull(notifications.readAt),
      ),
    )
    .limit(1);
  const hasUnreadNotification = unreadRows.length > 0;

  const threadRows = await db
    .select()
    .from(messageThreads)
    .where(
      and(
        eq(messageThreads.studentId, selected.studentId),
        eq(messageThreads.parentMembershipId, selected.parentMembershipId),
      ),
    )
    .orderBy(desc(messageThreads.lastMessageAt))
    .limit(1);
  const latestMessageThread = threadRows[0] ?? null;

  const todayStatus = (todayRec?.status as AttendanceStatus | undefined) ?? null;

  // Simple, non-scoring reassurance. Never a risk engine.
  const reasons: string[] = [];
  let needsAction = false;
  let headline: string;
  if (!todayStatus) {
    headline = "Absensi hari ini belum tercatat.";
  } else if (todayStatus === "hadir") {
    headline = "Anak Anda hadir hari ini.";
  } else if (todayStatus === "terlambat") {
    headline = "Anak Anda tercatat terlambat hari ini.";
    reasons.push("terlambat_today");
    needsAction = true;
  } else if (todayStatus === "alpa") {
    headline = "Anak Anda tercatat alpa hari ini.";
    reasons.push("alpa_today");
    needsAction = true;
  } else {
    headline = `Anak Anda tercatat ${todayStatus} hari ini.`;
    reasons.push(`status_${todayStatus}`);
  }
  if (hasUnreadNotification) {
    reasons.push("unread_notification");
    needsAction = true;
  }

  return {
    ok: true,
    children,
    selectedChild: selected,
    today: {
      date: todayStr,
      attendanceStatus: todayStatus,
      attendanceRecordedAt: todayRec?.createdAt ?? null,
      attendanceNote: todayRec?.note ?? null,
    },
    reassurance: { headline, needsAction, reasons },
    latestNotification,
    latestMessageThread,
    recentAttendance,
  };
}

export type ParentAttendanceResult =
  | { ok: false; reason: "not_linked" | "no_child" }
  | { ok: true; studentId: string; records: (typeof attendanceRecords.$inferSelect)[] };

export async function getParentAttendanceHistory(
  db: Database,
  userId: string,
  input: { studentId?: string; from?: string; to?: string; limit?: number },
): Promise<ParentAttendanceResult> {
  let child: LinkedChild | null;
  if (input.studentId) {
    child = await assertParentCanAccessStudent(db, userId, input.studentId);
    if (!child) return { ok: false, reason: "not_linked" };
  } else {
    const children = await listLinkedChildrenForParent(db, userId);
    child = children[0] ?? null;
    if (!child) return { ok: false, reason: "no_child" };
  }

  const conds = [eq(attendanceRecords.studentId, child.studentId)];
  if (input.from) conds.push(gte(attendanceRecords.attendanceDate, input.from));
  if (input.to) conds.push(lte(attendanceRecords.attendanceDate, input.to));

  const records = await db
    .select()
    .from(attendanceRecords)
    .where(and(...conds))
    .orderBy(desc(attendanceRecords.attendanceDate))
    .limit(clampLimit(input.limit, PARENT_LIMITS.attendance));

  return { ok: true, studentId: child.studentId, records };
}

export type ParentListResult<T> =
  | { ok: false; reason: "not_linked" }
  | { ok: true; items: T[] };

export async function listParentNotifications(
  db: Database,
  userId: string,
  input: { studentId?: string; limit?: number } = {},
): Promise<ParentListResult<typeof notifications.$inferSelect>> {
  const memberships = await parentMembershipIds(db, userId);
  if (memberships.length === 0) return { ok: true, items: [] };

  const conds = [inArray(notifications.recipientMembershipId, memberships)];
  if (input.studentId) {
    const child = await assertParentCanAccessStudent(db, userId, input.studentId);
    if (!child) return { ok: false, reason: "not_linked" };
    conds.push(eq(notifications.studentId, input.studentId));
  }

  const items = await db
    .select()
    .from(notifications)
    .where(and(...conds))
    .orderBy(desc(notifications.createdAt))
    .limit(clampLimit(input.limit, PARENT_LIMITS.notifications));
  return { ok: true, items };
}

/** Mark caller-owned notifications read. Returns the count actually updated. */
export async function markParentNotificationsRead(
  db: Database,
  userId: string,
  input: { notificationIds: string[] },
): Promise<{ updated: number }> {
  const memberships = await parentMembershipIds(db, userId);
  if (memberships.length === 0) return { updated: 0 };

  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        inArray(notifications.id, input.notificationIds),
        inArray(notifications.recipientMembershipId, memberships),
      ),
    )
    .returning({ id: notifications.id });
  return { updated: updated.length };
}

export async function listParentMessageThreads(
  db: Database,
  userId: string,
  input: { studentId?: string; limit?: number } = {},
): Promise<ParentListResult<typeof messageThreads.$inferSelect>> {
  const memberships = await parentMembershipIds(db, userId);
  if (memberships.length === 0) return { ok: true, items: [] };

  const conds = [inArray(messageThreads.parentMembershipId, memberships)];
  if (input.studentId) {
    const child = await assertParentCanAccessStudent(db, userId, input.studentId);
    if (!child) return { ok: false, reason: "not_linked" };
    conds.push(eq(messageThreads.studentId, input.studentId));
  }

  const items = await db
    .select()
    .from(messageThreads)
    .where(and(...conds))
    .orderBy(desc(messageThreads.lastMessageAt))
    .limit(clampLimit(input.limit, PARENT_LIMITS.threads));
  return { ok: true, items };
}

export type ParentThreadDetail =
  | { ok: false; reason: "thread_not_found" }
  | {
      ok: true;
      thread: typeof messageThreads.$inferSelect;
      messages: (typeof messages.$inferSelect)[];
    };

export async function getParentMessageThread(
  db: Database,
  userId: string,
  threadId: string,
): Promise<ParentThreadDetail> {
  const memberships = await parentMembershipIds(db, userId);
  if (memberships.length === 0) return { ok: false, reason: "thread_not_found" };

  const threadRows = await db
    .select()
    .from(messageThreads)
    .where(
      and(
        eq(messageThreads.id, threadId),
        inArray(messageThreads.parentMembershipId, memberships),
      ),
    );
  const thread = threadRows[0];
  if (!thread) return { ok: false, reason: "thread_not_found" };

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.createdAt));
  return { ok: true, thread, messages: msgs };
}
