import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import type { AppEnv } from "../types";

export const enforceRateLimit = async (
  c: Context<AppEnv>,
  key: string,
  message = "Too many attempts — please wait a minute and try again",
): Promise<void> => {
  const { success } = await c.env.AUTH_RATE_LIMITER.limit({ key });
  if (!success) {
    c.header("Retry-After", "60");
    throw new HTTPException(429, { message });
  }
};

/**
 * Per-IP throttle for credential endpoints, backed by the Workers rate
 * limiting binding (see `ratelimits` in wrangler.jsonc: 10 requests / 60s).
 * Keyed on CF-Connecting-IP, which Cloudflare sets from the real client IP
 * and strips from inbound requests, so it cannot be spoofed.
 */
export const authRateLimit = createMiddleware<AppEnv>(async (c, next) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  await enforceRateLimit(c, `auth:${ip}`);
  await next();
});
