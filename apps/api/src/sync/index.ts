import type { Bindings } from "../types";
import { runCodeforcesSync } from "./codeforces";

// ---------------------------------------------------------------------------
// Cron dispatch. Each platform gets its own expression in wrangler.jsonc so it
// can run on its own cadence; `controller.cron` says which one fired.
// ---------------------------------------------------------------------------

export const CODEFORCES_CRON = "*/5 * * * *";

export const handleScheduled = async (
  controller: ScheduledController,
  env: Bindings,
): Promise<void> => {
  switch (controller.cron) {
    case CODEFORCES_CRON: {
      // Awaited rather than handed to waitUntil: a throw here marks the cron
      // invocation as failed, which is what the dashboard should show.
      const summary = await runCodeforcesSync(env.DB);
      console.log("codeforces sync", JSON.stringify(summary));
      return;
    }
    default:
      console.warn(`No handler for cron "${controller.cron}"`);
  }
};
