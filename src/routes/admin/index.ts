import { Hono } from "hono";

import { requireAdmin } from "../../middleware/auth";
import adminEvents from "./events";
import adminRanklists from "./ranklists";
import adminTrackers from "./trackers";
import adminUsers from "./users";
import type { AppEnv } from "../../types";

// Everything under /admin requires an authenticated user with role "admin".
const admin = new Hono<AppEnv>();
admin.use("*", requireAdmin);

admin.route("/users", adminUsers);
admin.route("/events", adminEvents);
admin.route("/trackers", adminTrackers);
admin.route("/ranklists", adminRanklists);

export default admin;
