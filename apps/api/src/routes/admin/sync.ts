import { Hono } from "hono";

import { requirePermission } from "../../middleware/auth";
import { runCodeforcesSync } from "../../sync/codeforces";
import type { AppEnv } from "../../types";

// Manual trigger for the scheduled platform syncs — the cron runs one batch
// every few minutes, this runs one on demand.
const adminSyncRoutes = new Hono<AppEnv>();

const manageEvents = requirePermission("manage_events");

adminSyncRoutes.post("/codeforces", manageEvents, async (c) => {
  const summary = await runCodeforcesSync(c.env.DB);
  return c.json(summary);
});

export default adminSyncRoutes;
