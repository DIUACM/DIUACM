import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import type { AppEnv } from "../types";

/**
 * Per-IP throttle for credential endpoints, backed by the Workers rate
 * limiting binding (see `ratelimits` in wrangler.jsonc: 10 requests / 60s).
 * Keyed on CF-Connecting-IP, which Cloudflare sets from the real client IP
 * and strips from inbound requests, so it cannot be spoofed.
 */
export const authRateLimit = createMiddleware<AppEnv>(async (c, next) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const { success } = await c.env.AUTH_RATE_LIMITER.limit({ key: ip });
  if (!success) {
    throw new HTTPException(429, {
      message: "Too many attempts — please wait a minute and try again",
    });
  }
  await next();
});
