import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { and, eq } from "drizzle-orm";

import { getDb } from "../db/client";
import { userPermissions, users, type Permission } from "../db/schema";
import { verifyAuthToken, type AuthPayload } from "../lib/jwt";
import { isSuperAdminEmail } from "../lib/permissions";
import type { AppEnv } from "../types";

const authenticate = async (c: Context<AppEnv>): Promise<AuthPayload> => {
  const header = c.req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing bearer token" });
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    return await verifyAuthToken(token, c.env.JWT_SECRET);
  } catch {
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }
};

// Reuse the payload set by an earlier middleware in the chain (e.g. the
// blanket requireAuth on /admin) instead of verifying the token twice.
const ensureAuthenticated = async (c: Context<AppEnv>): Promise<AuthPayload> => {
  const existing = c.var.user as AuthPayload | undefined;
  if (existing) return existing;
  const payload = await authenticate(c);
  c.set("user", payload);
  return payload;
};

// The caller's email, read from the database (not the token) so account
// changes take effect immediately.
const loadEmail = async (c: Context<AppEnv>, userId: number): Promise<string> => {
  const db = getDb(c.env.DB);
  const [row] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) throw new HTTPException(401, { message: "Account no longer exists" });
  return row.email;
};

/** Require a valid `Authorization: Bearer <jwt>`; populates `c.var.user`. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  await ensureAuthenticated(c);
  await next();
});

/**
 * Require the given admin permission. The super admin (email matches
 * SUPER_ADMIN_EMAIL) passes every check; everyone else needs a
 * `user_permissions` row. Both are read from the database per request so
 * grants and revocations take effect immediately.
 */
export const requirePermission = (permission: Permission) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const payload = await ensureAuthenticated(c);
    const email = await loadEmail(c, payload.sub);
    if (!isSuperAdminEmail(email, c.env.SUPER_ADMIN_EMAIL)) {
      const db = getDb(c.env.DB);
      const [row] = await db
        .select({ permission: userPermissions.permission })
        .from(userPermissions)
        .where(
          and(
            eq(userPermissions.userId, payload.sub),
            eq(userPermissions.permission, permission),
          ),
        )
        .limit(1);
      if (!row) {
        throw new HTTPException(403, { message: `Missing permission: ${permission}` });
      }
    }
    await next();
  });

/** Require the super admin (email matches SUPER_ADMIN_EMAIL). */
export const requireSuperAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const payload = await ensureAuthenticated(c);
  const email = await loadEmail(c, payload.sub);
  if (!isSuperAdminEmail(email, c.env.SUPER_ADMIN_EMAIL)) {
    throw new HTTPException(403, { message: "Super admin access required" });
  }
  await next();
});
