import { Hono } from "hono";

import { requireAuth } from "../../middleware/auth";
import adminBlog from "./blog";
import adminEvents from "./events";
import adminGallery from "./gallery";
import adminRanklists from "./ranklists";
import adminSystem from "./system";
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
admin.route("/gallery", adminGallery);
admin.route("/blog", adminBlog);
admin.route("/system", adminSystem);

export default admin;
