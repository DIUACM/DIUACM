import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import { verifyAuthToken } from "../lib/jwt";
import type { AppEnv } from "../types";

/** Require a valid `Authorization: Bearer <jwt>`; populates `c.var.user`. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing bearer token" });
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = await verifyAuthToken(token, c.env.JWT_SECRET);
    c.set("user", payload);
  } catch {
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }
  await next();
});
