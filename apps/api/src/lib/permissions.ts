import { eq, inArray } from "drizzle-orm";

import type { getDb } from "../db/client";
import { PERMISSIONS, userPermissions, type Permission } from "../db/schema";

type Db = ReturnType<typeof getDb>;

/**
 * The super admin is identified by email (SUPER_ADMIN_EMAIL in wrangler.jsonc),
 * compared case-insensitively. They implicitly hold every permission and are
 * exempt from the Google sign-in email-domain restriction.
 */
export const isSuperAdminEmail = (email: string, superAdminEmail: string): boolean =>
  email.trim().toLowerCase() === superAdminEmail.trim().toLowerCase();

/** Granted permissions for one user (does not include the super admin's implicit grant). */
export const loadPermissions = async (db: Db, userId: number): Promise<Permission[]> => {
  const rows = await db
    .select({ permission: userPermissions.permission })
    .from(userPermissions)
    .where(eq(userPermissions.userId, userId));
  return rows.map((r) => r.permission);
};

/** Batch variant for list endpoints: userId → granted permissions (missing ids map to []). */
export const loadPermissionsMap = async (
  db: Db,
  userIds: number[],
): Promise<Map<number, Permission[]>> => {
  const map = new Map<number, Permission[]>(userIds.map((id) => [id, []]));
  if (userIds.length === 0) return map;
  const rows = await db
    .select({ userId: userPermissions.userId, permission: userPermissions.permission })
    .from(userPermissions)
    .where(inArray(userPermissions.userId, userIds));
  for (const row of rows) map.get(row.userId)?.push(row.permission);
  return map;
};

/**
 * The permissions a user effectively holds: everything for the super admin,
 * otherwise exactly what was granted. This is what API responses expose, so
 * frontends only ever need to check the `permissions` array.
 */
export const effectivePermissions = (
  granted: Permission[],
  isSuperAdmin: boolean,
): Permission[] => (isSuperAdmin ? [...PERMISSIONS] : granted);
