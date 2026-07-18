import type { AuthPayload } from "./lib/jwt";

/** Cloudflare bindings generated from wrangler.jsonc by `wrangler types`. */
export type Bindings = Env;

/** Hono environment: bindings + context variables set by middleware. */
export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    // Set by requireAuth on protected routes.
    user: AuthPayload;
  };
};
