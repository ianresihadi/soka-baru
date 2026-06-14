import type { Role } from "./roles";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface MembershipSummary {
  membershipId: string;
  schoolId: string;
  schoolCode: string;
  schoolName: string;
  status: string;
  roles: Role[];
}

/**
 * Server-resolved tenant context. school_id here is always derived from
 * membership data, never from client input.
 */
export interface TenantContext {
  userId: string;
  membershipId: string;
  schoolId: string;
  roles: Role[];
}
