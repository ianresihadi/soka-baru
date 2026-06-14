import { z } from "zod";
import { ROLES } from "./roles";

export const roleSchema = z.enum(ROLES);

/**
 * Input for binding a user to a school via school_code.
 *
 * Note: there is intentionally no school_id field. The server derives school_id
 * from the school_code lookup, never from client-supplied tenant identifiers.
 */
export const schoolBindingSchema = z.object({
  schoolCode: z.string().min(1, "school_code wajib diisi"),
  roles: z.array(roleSchema).min(1, "minimal satu role"),
});
export type SchoolBindingInput = z.infer<typeof schoolBindingSchema>;

/**
 * Input for the tenant-check write route.
 *
 * Intentionally has no schoolId: the tenant scope comes only from the
 * authenticated session/membership on the server.
 */
export const tenantCheckUpdateSchema = z.object({
  name: z.string().min(1),
});
export type TenantCheckUpdateInput = z.infer<typeof tenantCheckUpdateSchema>;

// --- Sprint 003: Admin onboarding --------------------------------------------

export const createSchoolSchema = z.object({
  name: z.string().min(1),
  schoolCode: z.string().min(1),
  // Optional: bind an existing user as admin_sekolah of the new school.
  adminUserId: z.string().min(1).optional(),
});
export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;

export const createClassSchema = z.object({
  name: z.string().min(1),
  gradeLevel: z.string().min(1).optional(),
  academicYear: z.string().min(1).optional(),
});
export type CreateClassInput = z.infer<typeof createClassSchema>;

export const createStudentSchema = z.object({
  fullName: z.string().min(1),
  nisn: z.string().min(1).optional(),
  classId: z.string().uuid().optional(),
});
export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const bulkStudentsSchema = z.object({
  students: z.array(createStudentSchema).min(1),
});
export type BulkStudentsInput = z.infer<typeof bulkStudentsSchema>;

export const assignClassSchema = z.object({
  classId: z.string().uuid(),
});
export type AssignClassInput = z.infer<typeof assignClassSchema>;

export const roleInClassSchema = z.enum(["wali_kelas", "guru"]);

export const assignTeacherSchema = z.object({
  membershipId: z.string().uuid(),
  roleInClass: roleInClassSchema,
  subject: z.string().min(1).optional(),
});
export type AssignTeacherInput = z.infer<typeof assignTeacherSchema>;

export const createLinkCodeSchema = z.object({
  studentId: z.string().uuid(),
  expiresInDays: z.number().int().positive().max(365).optional(),
});
export type CreateLinkCodeInput = z.infer<typeof createLinkCodeSchema>;

export const redeemLinkCodeSchema = z.object({
  code: z.string().min(1),
  relationship: z.string().min(1).optional(),
});
export type RedeemLinkCodeInput = z.infer<typeof redeemLinkCodeSchema>;

// --- Sprint 004: Guru daily loop ---------------------------------------------

export const ATTENDANCE_STATUSES = [
  "hadir",
  "sakit",
  "izin",
  "alpa",
  "terlambat",
] as const;
export const attendanceStatusSchema = z.enum(ATTENDANCE_STATUSES);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

/** Statuses that create parent notification records (hadir excluded). */
export const NOTIFY_ATTENDANCE_STATUSES: readonly AttendanceStatus[] = [
  "sakit",
  "izin",
  "alpa",
  "terlambat",
];

/** ISO date string YYYY-MM-DD. */
export const attendanceDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "format tanggal harus YYYY-MM-DD");

/** HH:mm 24-hour wall-clock time. */
export const cutoffTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "format jam harus HH:mm");

/** True when the runtime accepts the IANA timezone (rejects bad Intl input). */
export function isValidTimeZone(tz: string): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const timezoneSchema = z
  .string()
  .min(1)
  .refine(isValidTimeZone, "timezone tidak valid");

export const submitAttendanceSchema = z.object({
  records: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        status: attendanceStatusSchema,
        note: z.string().min(1).optional(),
      }),
    )
    .min(1),
  correctionReason: z.string().min(1).optional(),
});
export type SubmitAttendanceInput = z.infer<typeof submitAttendanceSchema>;

export const papanPagiQuerySchema = z.object({
  date: attendanceDateSchema.optional(),
  classId: z.string().uuid().optional(),
});
export type PapanPagiQuery = z.infer<typeof papanPagiQuerySchema>;

export const schoolSettingsUpdateSchema = z.object({
  attendanceCutoffTime: cutoffTimeSchema.optional(),
  schoolTimezone: timezoneSchema.optional(),
  // Default KKM is a 0-100 percentage threshold, matching per-grade KKM rules.
  defaultKkm: z.number().int().min(0).max(100).optional(),
});
export type SchoolSettingsUpdateInput = z.infer<
  typeof schoolSettingsUpdateSchema
>;

export const parentMessageSchema = z.object({
  studentId: z.string().uuid(),
  body: z.string().min(1),
});
export type ParentMessageInput = z.infer<typeof parentMessageSchema>;

export const teacherReplySchema = z.object({
  body: z.string().min(1),
});
export type TeacherReplyInput = z.infer<typeof teacherReplySchema>;

export type AttendanceCompletion =
  | "not_started"
  | "in_progress"
  | "completed_on_time"
  | "completed_late";

// --- Sprint 005: Parent trust loop -------------------------------------------

/** Shared limit bounds for parent list endpoints. */
export const PARENT_LIMITS = {
  attendance: { default: 30, max: 100 },
  notifications: { default: 50, max: 100 },
  threads: { default: 50, max: 100 },
} as const;

export function clampLimit(
  value: number | undefined,
  bounds: { default: number; max: number },
): number {
  if (value === undefined || Number.isNaN(value)) return bounds.default;
  return Math.min(Math.max(1, Math.trunc(value)), bounds.max);
}

export const parentChildQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
});
export type ParentChildQuery = z.infer<typeof parentChildQuerySchema>;

export const parentAttendanceQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  from: attendanceDateSchema.optional(),
  to: attendanceDateSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
export type ParentAttendanceQuery = z.infer<typeof parentAttendanceQuerySchema>;

export const parentNotificationsQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
export type ParentNotificationsQuery = z.infer<
  typeof parentNotificationsQuerySchema
>;

export const markNotificationsReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1).max(100),
});
export type MarkNotificationsReadInput = z.infer<
  typeof markNotificationsReadSchema
>;

export const parentThreadsQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
export type ParentThreadsQuery = z.infer<typeof parentThreadsQuerySchema>;

// --- Sprint 006: Nilai & Catatan ---------------------------------------------

export const GRADE_VISIBILITY_STATUSES = ["draft", "published"] as const;
export const gradeVisibilitySchema = z.enum(GRADE_VISIBILITY_STATUSES);
export type GradeVisibility = z.infer<typeof gradeVisibilitySchema>;

export const STUDENT_NOTE_VISIBILITY_STATUSES = ["internal", "published"] as const;
export const studentNoteVisibilitySchema = z.enum(STUDENT_NOTE_VISIBILITY_STATUSES);
export type StudentNoteVisibility = z.infer<typeof studentNoteVisibilitySchema>;

export const STUDENT_NOTE_CATEGORIES = [
  "general",
  "academic",
  "attendance",
  "wellbeing",
] as const;
export const studentNoteCategorySchema = z.enum(STUDENT_NOTE_CATEGORIES);
export type StudentNoteCategory = z.infer<typeof studentNoteCategorySchema>;

const score0to100 = z.number().int().min(0).max(100);

export const createGradeSchema = z.object({
  studentId: z.string().uuid(),
  subject: z.string().min(1),
  assessmentName: z.string().min(1),
  assessmentDate: attendanceDateSchema,
  score: score0to100,
  maxScore: z.number().int().min(1).max(100).optional(),
  kkm: score0to100.optional(),
});
export type CreateGradeInput = z.infer<typeof createGradeSchema>;

export const updateGradeSchema = z.object({
  subject: z.string().min(1).optional(),
  assessmentName: z.string().min(1).optional(),
  assessmentDate: attendanceDateSchema.optional(),
  score: score0to100.optional(),
  maxScore: z.number().int().min(1).max(100).optional(),
  kkm: score0to100.optional(),
});
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;

export const gradeListQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  subject: z.string().min(1).optional(),
  visibility: gradeVisibilitySchema.optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});
export type GradeListQuery = z.infer<typeof gradeListQuerySchema>;

export const parentGradesQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});
export type ParentGradesQuery = z.infer<typeof parentGradesQuerySchema>;

export const createStudentNoteSchema = z.object({
  studentId: z.string().uuid(),
  category: studentNoteCategorySchema,
  body: z.string().min(1),
});
export type CreateStudentNoteInput = z.infer<typeof createStudentNoteSchema>;

export const updateStudentNoteSchema = z.object({
  category: studentNoteCategorySchema.optional(),
  body: z.string().min(1).optional(),
});
export type UpdateStudentNoteInput = z.infer<typeof updateStudentNoteSchema>;

export const studentNotesQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  visibility: studentNoteVisibilitySchema.optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});
export type StudentNotesQuery = z.infer<typeof studentNotesQuerySchema>;

export const parentStudentNotesQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});
export type ParentStudentNotesQuery = z.infer<
  typeof parentStudentNotesQuerySchema
>;

export const GRADE_LIMITS = { default: 50, max: 200 } as const;
export const NOTE_LIMITS = { default: 50, max: 200 } as const;

/**
 * KKM is a 0-100 threshold. Because maxScore may differ from 100, compare the
 * percentage score against the KKM threshold — never raw score vs kkm.
 */
export function scorePercent(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0;
  return (score / maxScore) * 100;
}
export function isBelowKkm(score: number, maxScore: number, kkm: number): boolean {
  return scorePercent(score, maxScore) < kkm;
}
