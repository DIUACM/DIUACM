import { reportNotice } from "../lib/notify";
import type { Bindings } from "../types";
import { atcoderPlatform } from "./atcoder";
import { codeforcesPlatform } from "./codeforces";
import { runDigest } from "./digest";
import { collectFaults, runFailedFault, type RunOutcome } from "./faults";
import { runSync } from "./runner";
import { runVjudgeSync } from "./vjudge";

// ---------------------------------------------------------------------------
// Cron dispatch. Each platform gets its own expression in wrangler.jsonc so it
// can run on its own cadence; `controller.cron` says which one fired.
//
// The three syncs are deliberately offset so no two start in the same minute —
// they are independent invocations with independent limits, but staggering
// keeps their D1 write bursts from landing on top of each other.
//
// Every run is also inspected for the handful of outcomes worth mailing the
// super admin about (see faults.ts); the digest cron mails once a day
// regardless, so silence can be read as health rather than as a dead job.
// ---------------------------------------------------------------------------

export const CODEFORCES_CRON = "*/15 * * * *";
/** :05, :20, :35, :50 — offset from Codeforces to avoid overlapping writes. */
export const ATCODER_CRON = "5,20,35,50 * * * *";
/** :10, :25, :40, :55 — the third slot in the 5-minute stagger. */
export const VJUDGE_CRON = "10,25,40,55 * * * *";
/** 01:12 UTC (07:12 Dhaka), on a minute no sync uses. */
export const DIGEST_CRON = "12 1 * * *";

type Job = {
  name: string;
  /** The run, plus what to inspect afterwards. Null means "nothing to check". */
  run: (env: Bindings) => Promise<{ summary: unknown; outcome: RunOutcome | null }>;
};

/**
 * Not a map of `SyncPlatform`: VJudge walks contests rather than handles and so
 * runs its own loop (see vjudge.ts), and the digest is not a sync at all. What
 * they share is "run it, log it, alert if it went badly".
 */
const JOBS: Record<string, Job> = {
  [CODEFORCES_CRON]: {
    name: "codeforces",
    run: async (env) => {
      const summary = await runSync(env.DB, codeforcesPlatform);
      return {
        summary,
        outcome: {
          platform: "codeforces",
          unit: "handle",
          processed: summary.handlesProcessed,
          errors: summary.errors,
          stoppedReason: summary.stoppedReason,
          truncated: summary.truncatedHandles,
          errorReasons: summary.errorReasons,
        },
      };
    },
  },
  [ATCODER_CRON]: {
    name: "atcoder",
    run: async (env) => {
      const summary = await runSync(env.DB, atcoderPlatform);
      return {
        summary,
        outcome: {
          platform: "atcoder",
          unit: "handle",
          processed: summary.handlesProcessed,
          errors: summary.errors,
          stoppedReason: summary.stoppedReason,
          truncated: summary.truncatedHandles,
          errorReasons: summary.errorReasons,
        },
      };
    },
  },
  [VJUDGE_CRON]: {
    name: "vjudge",
    run: async (env) => {
      const summary = await runVjudgeSync(env.DB);
      return {
        summary,
        outcome: {
          platform: "vjudge",
          unit: "contest",
          processed: summary.contestsAttempted,
          errors: summary.errors,
          stoppedReason: summary.stoppedReason,
          errorReasons: summary.errorReasons,
        },
      };
    },
  },
  [DIGEST_CRON]: {
    name: "digest",
    run: async (env) => {
      await runDigest(env);
      return { summary: { sent: true }, outcome: null };
    },
  },
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

  const now = Math.floor(Date.now() / 1000);

  let result: Awaited<ReturnType<Job["run"]>>;
  try {
    // Awaited rather than handed to waitUntil: a throw here marks the cron
    // invocation as failed, which is what the dashboard should show.
    result = await job.run(env);
  } catch (cause) {
    // Mail first, then rethrow: the dashboard still records the failure, but a
    // crash that would otherwise only exist in the logs reaches a person.
    await reportNotice(env, env.DB, runFailedFault(job.name, cause), now);
    throw cause;
  }

  console.log(`${job.name} sync`, JSON.stringify(result.summary));

  if (!result.outcome) return;
  for (const fault of collectFaults(result.outcome)) {
    // Logged at error level as well as mailed. A bad run is deliberately not a
    // thrown exception — the invocation succeeded, it just got nothing done —
    // so Workers Observability records it as a healthy tick and its error charts
    // stay flat. Without this line the mail is the only signal that exists, and
    // a run where every unit failed is indistinguishable from a perfect one in
    // the dashboard. It still will not colour the invocation red; it does make
    // the run findable by filtering logs to level=error.
    console.error(`${fault.key} ${fault.detail}`);
    await reportNotice(env, env.DB, fault, now);
  }
};
