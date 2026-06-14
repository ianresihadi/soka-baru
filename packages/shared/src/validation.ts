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
