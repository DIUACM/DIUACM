import type { AuthPayload } from "./lib/jwt";

/** Cloudflare bindings generated from wrangler.jsonc by `wrangler types`. */
export type Bindings = Env;

/** Hono environment: bindings + context variables set by middleware. */
export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    // Set by requireAuth on protected routes.
    user: AuthPayload;
    // Database-backed account state loaded alongside the JWT. This makes bans
    // and deletions take effect immediately, including for existing tokens.
    authAccount: {
      id: number;
      email: string;
      isBanned: boolean;
      banReason: string | null;
    };
    // Set by requirePermission / requireSuperAdmin: whether the caller's email
    // matches SUPER_ADMIN_EMAIL. Only read on routes behind those middlewares.
    callerIsSuperAdmin: boolean;
  };
};
