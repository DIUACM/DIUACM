import type { Bindings } from "../types";
import { atcoderPlatform } from "./atcoder";
import { codeforcesPlatform } from "./codeforces";
import { runSync, type SyncPlatform } from "./runner";

// ---------------------------------------------------------------------------
// Cron dispatch. Each platform gets its own expression in wrangler.jsonc so it
// can run on its own cadence; `controller.cron` says which one fired.
//
// The two are deliberately offset so they never start in the same minute — they
// are independent invocations with independent limits, but staggering keeps
// their D1 write bursts from landing on top of each other.
// ---------------------------------------------------------------------------

export const CODEFORCES_CRON = "*/15 * * * *";
/** :05, :20, :35, :50 — offset from Codeforces to avoid overlapping writes. */
export const ATCODER_CRON = "5,20,35,50 * * * *";

const PLATFORMS: Record<string, SyncPlatform> = {
  [CODEFORCES_CRON]: codeforcesPlatform,
  [ATCODER_CRON]: atcoderPlatform,
};

export const handleScheduled = async (
  controller: ScheduledController,
  env: Bindings,
): Promise<void> => {
  const platform = PLATFORMS[controller.cron];
  if (!platform) {
    console.warn(`No handler for cron "${controller.cron}"`);
    return;
  }

  // Awaited rather than handed to waitUntil: a throw here marks the cron
  // invocation as failed, which is what the dashboard should show.
  const summary = await runSync(env.DB, platform);
  console.log(`${platform.handleType} sync`, JSON.stringify(summary));
};
