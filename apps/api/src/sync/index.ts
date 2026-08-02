import { logError, logInfo, logWarn } from "../lib/log";
import { reportNotice, type Notice } from "../lib/notify";
import type { Bindings } from "../types";
import { atcoderPlatform } from "./atcoder";
import { runCfRatingSync } from "./cf-rating";
import { codeforcesPlatform } from "./codeforces";
import { runDigest } from "./digest";
import { collectCfRatingFaults, collectFaults, runFailedFault } from "./faults";
import { runSync } from "./runner";
import { recordRun, type RunStatus } from "./runs";
import { JOB_CRONS, type JobName } from "./schedule";
import { runVjudgeSync } from "./vjudge";

// ---------------------------------------------------------------------------
// Cron dispatch. Each platform gets its own expression in wrangler.jsonc so it
// can run on its own cadence; `controller.cron` says which one fired. The
// expressions themselves live in schedule.ts, which is also what the liveness
// check measures against.
//
// The three solve syncs are deliberately offset so no two start in the same
// minute — they are independent invocations with independent limits, but
// staggering keeps their D1 write bursts from landing on top of each other. The
// two daily jobs sit on minutes none of those staggers uses.
//
// Every run also reports the handful of outcomes worth mailing the super admin
// about (see faults.ts); the digest cron mails once a day regardless, so silence
// can be read as health rather than as a dead job. And every run, good or bad,
// appends a row to `cron_runs` (see runs.ts) — the only record that survives the
// log retention, and the only way a job that stops firing is ever noticed.
// ---------------------------------------------------------------------------

export {
  ATCODER_CRON,
  CF_RATING_CRON,
  CODEFORCES_CRON,
  DIGEST_CRON,
  VJUDGE_CRON,
} from "./schedule";

/** What the health page charts per run, pulled out of each job's own summary. */
type Metrics = { rowsWritten: number | null; errors: number | null };

type Job = {
  name: JobName;
  /** The run, plus whatever about it is worth mailing the super admin. */
  run: (env: Bindings) => Promise<{ summary: unknown; faults: Notice[]; metrics: Metrics }>;
};

/**
 * Not a map of `SyncPlatform`: VJudge walks contests rather than handles and so
 * runs its own loop (see vjudge.ts), the rating refresh reads a batched endpoint
 * no solve sync can use (see cf-rating.ts), and the digest is not a sync at all.
 * What they share is "run it, log it, alert if it went badly" — so each job
 * decides its own faults and metrics, and the dispatcher below only delivers and
 * records them. Metrics are extracted here, where the summary's concrete type is
 * still known, rather than guessed at from an `unknown` further down.
 */
const JOBS: Record<string, Job> = {
  [JOB_CRONS.codeforces]: {
    name: "codeforces",
    run: async (env) => {
      const summary = await runSync(env.DB, codeforcesPlatform);
      return {
        summary,
        metrics: { rowsWritten: summary.rowsWritten, errors: summary.errors },
        faults: collectFaults({
          platform: "codeforces",
          unit: "handle",
          processed: summary.handlesProcessed,
          errors: summary.errors,
          stoppedReason: summary.stoppedReason,
          truncated: summary.truncatedHandles,
          errorReasons: summary.errorReasons,
        }),
      };
    },
  },
  [JOB_CRONS.atcoder]: {
    name: "atcoder",
    run: async (env) => {
      const summary = await runSync(env.DB, atcoderPlatform);
      return {
        summary,
        metrics: { rowsWritten: summary.rowsWritten, errors: summary.errors },
        faults: collectFaults({
          platform: "atcoder",
          unit: "handle",
          processed: summary.handlesProcessed,
          errors: summary.errors,
          stoppedReason: summary.stoppedReason,
          truncated: summary.truncatedHandles,
          errorReasons: summary.errorReasons,
        }),
      };
    },
  },
  [JOB_CRONS.vjudge]: {
    name: "vjudge",
    run: async (env) => {
      const summary = await runVjudgeSync(env.DB);
      return {
        summary,
        metrics: { rowsWritten: summary.rowsWritten, errors: summary.errors },
        faults: collectFaults({
          platform: "vjudge",
          unit: "contest",
          processed: summary.contestsAttempted,
          errors: summary.errors,
          stoppedReason: summary.stoppedReason,
          errorReasons: summary.errorReasons,
        }),
      };
    },
  },
  [JOB_CRONS["codeforces-rating"]]: {
    name: "codeforces-rating",
    run: async (env) => {
      const summary = await runCfRatingSync(env.DB);
      return {
        summary,
        // Its unit of work is a chunk of a hundred handles, so `chunksFailed` is
        // the closest thing it has to an error count.
        metrics: { rowsWritten: summary.ratingsUpdated, errors: summary.chunksFailed },
        faults: collectCfRatingFaults(summary),
      };
    },
  },
  [JOB_CRONS.digest]: {
    name: "digest",
    run: async (env) => {
      const { faults } = await runDigest(env);
      return { summary: { sent: true }, metrics: { rowsWritten: null, errors: null }, faults };
    },
  },
};

export const handleScheduled = async (
  controller: ScheduledController,
  env: Bindings,
): Promise<void> => {
  const job = JOBS[controller.cron];
  if (!job) {
    logWarn("cron.unknown_schedule", { cron: controller.cron });
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const startedAtMs = Date.now();

  let result: Awaited<ReturnType<Job["run"]>>;
  try {
    // Awaited rather than handed to waitUntil: a throw here marks the cron
    // invocation as failed, which is what the dashboard should show.
    result = await job.run(env);
  } catch (cause) {
    const fault = runFailedFault(job.name, cause);
    // Recorded before the mail, so a crash is in the ledger even if the send
    // hangs or the mailbox is unreachable.
    await recordRun(env.DB, {
      job: job.name,
      startedAt: now,
      durationMs: Date.now() - startedAtMs,
      status: "crashed",
      faults: [fault.key],
      rowsWritten: null,
      errors: null,
      summary: { error: cause instanceof Error ? cause.message : String(cause) },
    });
    // Mail, then rethrow: the dashboard still records the failure, but a crash
    // that would otherwise only exist in the logs reaches a person.
    await reportNotice(env, env.DB, fault, now);
    throw cause;
  }

  logInfo("cron.completed", { job: job.name, summary: result.summary });

  // `degraded` is the state nothing else can show. The invocation succeeded, so
  // Workers Observability counts it as healthy and its error charts stay flat —
  // even for a run where every single unit failed. Recording the faults against
  // the run is what makes those two cases distinguishable after the fact.
  const status: RunStatus = result.faults.length > 0 ? "degraded" : "ok";
  await recordRun(env.DB, {
    job: job.name,
    startedAt: now,
    durationMs: Date.now() - startedAtMs,
    status,
    faults: result.faults.map((fault) => fault.key),
    rowsWritten: result.metrics.rowsWritten,
    errors: result.metrics.errors,
    summary: result.summary,
  });

  for (const fault of result.faults) {
    // Logged at error level as well as mailed, so the run is findable by
    // filtering logs to level=error even though the invocation itself is green.
    logError("cron.degraded", fault.detail, {
      job: job.name,
      faultKey: fault.key,
    });
    await reportNotice(env, env.DB, fault, now);
  }
};
