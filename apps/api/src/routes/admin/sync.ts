import { Hono } from "hono";

import { requirePermission } from "../../middleware/auth";
import { runCodeforcesSync } from "../../sync/codeforces";
import type { AppEnv } from "../../types";

// Manual trigger for the scheduled platform syncs — the cron runs one batch
// every few minutes, this runs one on demand.
const adminSyncRoutes = new Hono<AppEnv>();

const manageEvents = requirePermission("manage_events");

adminSyncRoutes.post("/codeforces", manageEvents, async (c) => {
  // Bypasses the freshness window the cron respects: asking for a sync by hand
  // means now, not "whenever the batch next comes round".
  const summary = await runCodeforcesSync(c.env.DB, { minResyncSeconds: 0 });
  return c.json(summary);
});

export default adminSyncRoutes;
