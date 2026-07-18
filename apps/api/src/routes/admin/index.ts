import { Hono } from "hono";

import { requireAuth } from "../../middleware/auth";
import adminEvents from "./events";
import adminRanklists from "./ranklists";
import adminTrackers from "./trackers";
import adminUsers from "./users";
import type { AppEnv } from "../../types";

// Everything under /admin requires an authenticated user. Each route then
// requires a specific permission (see the per-route middleware in the
// sub-routers); the super admin passes every check.
const admin = new Hono<AppEnv>();
admin.use("*", requireAuth);

admin.route("/users", adminUsers);
admin.route("/events", adminEvents);
admin.route("/trackers", adminTrackers);
admin.route("/ranklists", adminRanklists);

export default admin;
