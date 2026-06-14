import { and, eq } from "drizzle-orm";
import type { MembershipSummary, Role, TenantContext } from "@soka/shared";
import type { Database } from "./client";
import { membershipRoles, schoolMemberships, schools } from "./schema";

/**
 * Raised when a request targets a school_id that is not the caller's tenant.
 * This is the guard that makes "client supplies school_id" safe.
 */
export class TenantViolationError extends Error {
  constructor(
    public readonly tenantSchoolId: string,
    public readonly requestedSchoolId: string,
  ) {
    super("Cross-tenant access denied");
    this.name = "TenantViolationError";
  }
}

/**
 * Resolve a user's active membership. This is the ONLY trusted source of
 * school_id for a request — it is derived from membership rows, never from the
 * client. Returns null when the user has no active membership.
 *
 * MVP picks the first active membership. Multi-school selection is a later
 * concern; the model already supports more than one membership per user.
 */
export async function getActiveTenantContext(
  db: Database,
  userId: string,
): Promise<TenantContext | null> {
  const memberships = await db
    .select({
      membershipId: schoolMemberships.id,
      schoolId: schoolMemberships.schoolId,
    })
    .from(schoolMemberships)
    .where(
      and(
        eq(schoolMemberships.userId, userId),
        eq(schoolMemberships.status, "active"),
      ),
    );

  const membership = memberships[0];
  if (!membership) return null;

  const roleRows = await db
    .select({ role: membershipRoles.role })
    .from(membershipRoles)
    .where(eq(membershipRoles.membershipId, membership.membershipId));

  return {
    userId,
    membershipId: membership.membershipId,
    schoolId: membership.schoolId,
    roles: roleRows.map((r) => r.role as Role),
  };
}

/** List every membership a user has, with school info and roles. */
export async function listUserMemberships(
  db: Database,
  userId: string,
): Promise<MembershipSummary[]> {
  const rows = await db
    .select({
      membershipId: schoolMemberships.id,
      schoolId: schools.id,
      schoolCode: schools.schoolCode,
      schoolName: schools.name,
      status: schoolMemberships.status,
    })
    .from(schoolMemberships)
    .innerJoin(schools, eq(schoolMemberships.schoolId, schools.id))
    .where(eq(schoolMemberships.userId, userId));

  const result: MembershipSummary[] = [];
  for (const row of rows) {
    const roleRows = await db
      .select({ role: membershipRoles.role })
      .from(membershipRoles)
      .where(eq(membershipRoles.membershipId, row.membershipId));
    result.push({ ...row, roles: roleRows.map((r) => r.role as Role) });
  }
  return result;
}

export type BindResult =
  | { ok: true; schoolId: string; membershipId: string; created: boolean }
  | { ok: false; reason: "school_not_found" };

/**
 * Bind a user to a school via school_code.
 *
 * school_id is taken from the looked-up `schools` row, never from client input.
 * Idempotent: a repeated bind does not duplicate the membership, and roles use
 * onConflictDoNothing against the (membership_id, role) unique index.
 */
export async function bindUserToSchoolByCode(
  db: Database,
  userId: string,
  schoolCode: string,
  roles: Role[],
): Promise<BindResult> {
  const found = await db
    .select()
    .from(schools)
    .where(eq(schools.schoolCode, schoolCode));
  const school = found[0];
  if (!school) return { ok: false, reason: "school_not_found" };

  const existing = await db
    .select()
    .from(schoolMemberships)
    .where(
      and(
        eq(schoolMemberships.userId, userId),
        eq(schoolMemberships.schoolId, school.id),
      ),
    );

  let membershipId: string;
  let created = false;
  const existingMembership = existing[0];
  if (existingMembership) {
    membershipId = existingMembership.id;
  } else {
    const inserted = await db
      .insert(schoolMemberships)
      .values({ schoolId: school.id, userId })
      .returning();
    membershipId = inserted[0]!.id;
    created = true;
  }

  for (const role of roles) {
    await db
      .insert(membershipRoles)
      .values({ membershipId, role })
      .onConflictDoNothing();
  }

  return { ok: true, schoolId: school.id, membershipId, created };
}

// ---------------------------------------------------------------------------
// Tenant-scoped reads/writes.
//
// Each function takes a server-resolved TenantContext and uses ctx.schoolId.
// The unsafe path (passing a client school_id straight into a query) is not
// offered by these helpers.
// ---------------------------------------------------------------------------

export async function getSchoolForTenant(db: Database, ctx: TenantContext) {
  const rows = await db
    .select()
    .from(schools)
    .where(eq(schools.id, ctx.schoolId));
  return rows[0] ?? null;
}

export async function listMembershipsForTenant(db: Database, ctx: TenantContext) {
  return db
    .select()
    .from(schoolMemberships)
    .where(eq(schoolMemberships.schoolId, ctx.schoolId));
}

export async function updateSchoolNameForTenant(
  db: Database,
  ctx: TenantContext,
  name: string,
) {
  const updated = await db
    .update(schools)
    .set({ name, updatedAt: new Date() })
    .where(eq(schools.id, ctx.schoolId))
    .returning();
  return updated[0] ?? null;
}

/**
 * Safe pattern when a client *does* supply a target school_id: only proceed
 * when it matches the server-resolved tenant. Throws TenantViolationError
 * otherwise. This proves client-supplied school_id cannot widen access.
 */
export function assertSameTenant(ctx: TenantContext, requestedSchoolId: string) {
  if (requestedSchoolId !== ctx.schoolId) {
    throw new TenantViolationError(ctx.schoolId, requestedSchoolId);
  }
}
