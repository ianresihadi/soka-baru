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
