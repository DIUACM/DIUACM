import type { Bindings } from "../types";
import { atcoderPlatform } from "./atcoder";
import { codeforcesPlatform } from "./codeforces";
import { runSync } from "./runner";
import { runVjudgeSync } from "./vjudge";

// ---------------------------------------------------------------------------
// Cron dispatch. Each platform gets its own expression in wrangler.jsonc so it
// can run on its own cadence; `controller.cron` says which one fired.
//
// The three are deliberately offset so no two start in the same minute — they
// are independent invocations with independent limits, but staggering keeps
// their D1 write bursts from landing on top of each other.
// ---------------------------------------------------------------------------

export const CODEFORCES_CRON = "*/15 * * * *";
/** :05, :20, :35, :50 — offset from Codeforces to avoid overlapping writes. */
export const ATCODER_CRON = "5,20,35,50 * * * *";
/** :10, :25, :40, :55 — the third slot in the 5-minute stagger. */
export const VJUDGE_CRON = "10,25,40,55 * * * *";

/**
 * Not a map of `SyncPlatform`: VJudge walks contests rather than handles and so
 * runs its own loop (see vjudge.ts). What every entry does share is "run it,
 * log what it did", which is all the handler below needs.
 */
const JOBS: Record<string, { name: string; run: (db: D1Database) => Promise<unknown> }> = {
  [CODEFORCES_CRON]: { name: "codeforces", run: (db) => runSync(db, codeforcesPlatform) },
  [ATCODER_CRON]: { name: "atcoder", run: (db) => runSync(db, atcoderPlatform) },
  [VJUDGE_CRON]: { name: "vjudge", run: (db) => runVjudgeSync(db) },
};

export const handleScheduled = async (
  controller: ScheduledController,
  env: Bindings,
): Promise<void> => {
  const job = JOBS[controller.cron];
  if (!job) {
    console.warn(`No handler for cron "${controller.cron}"`);
    return;
  }

  // Awaited rather than handed to waitUntil: a throw here marks the cron
  // invocation as failed, which is what the dashboard should show.
  const summary = await job.run(env.DB);
  console.log(`${job.name} sync`, JSON.stringify(summary));
};
