import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";

import { getDb } from "../db/client";
import { users } from "../db/schema";
import { verifyAuthToken, type AuthPayload } from "../lib/jwt";
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

/** Require a valid `Authorization: Bearer <jwt>`; populates `c.var.user`. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  c.set("user", await authenticate(c));
  await next();
});

/**
 * Like `requireAuth`, but additionally requires the user's `role` to be
 * `admin`. The role is read from the database (not the token) so promotions
 * and demotions take effect immediately.
 */
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  const payload = await authenticate(c);
  c.set("user", payload);

  const db = getDb(c.env.DB);
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);
  if (!row || row.role !== "admin") {
    throw new HTTPException(403, { message: "Admin access required" });
  }
  await next();
});
