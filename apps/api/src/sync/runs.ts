import { logError } from "../lib/log";
import { firesPerDay, JOB_CRONS, JOB_NAMES, type JobName } from "./schedule";

// ---------------------------------------------------------------------------
// The cron run ledger.
//
// Every other signal the crons produce is derived from a run that happened: a
// fault needs a summary to inspect, a log line needs code to reach it. The one
// failure that produces none of those is a cron that stops firing — no error, no
// mail, nothing but `last_synced_at` quietly ageing. Recording each invocation
// is what turns that into something observable, because absence becomes a row
// that isn't there.
//
// Nothing here may break a job: a run whose ledger write fails is still a run
// that worked, so every failure path logs and returns.
// ---------------------------------------------------------------------------

/**
 * How much history the ledger keeps. Long enough to see a weekly pattern and to
 * answer "when did this start" for something noticed a few days late; short
 * enough that the sub-hourly jobs (about 290 rows a day between them) stay a
 * few thousand rows rather than growing without bound.
 */
export const RUN_RETENTION_DAYS = 14;

/**
 * The window the liveness check counts ticks over — an hour wider than the day
 * of ticks it compares against.
 *
 * The slack exists for the daily jobs. Their previous run sits almost exactly
 * one day back, so an exact 24h window would include or exclude it depending on
 * a few seconds of scheduler jitter, and the digest would accuse itself of
 * having missed a tick roughly whenever the wind changed. An extra hour makes
 * the check unambiguous for them and barely more forgiving for the rest.
 */
export const LIVENESS_WINDOW_SECONDS = 25 * 60 * 60;

export type RunStatus = "ok" | "degraded" | "crashed";

export const RECORD_RUN_SQL = `
  INSERT INTO cron_runs (job, started_at, duration_ms, status, faults, rows_written, errors, summary)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

export const PRUNE_RUNS_SQL = `DELETE FROM cron_runs WHERE started_at < ?`;

export type RunRecord = {
  job: string;
  startedAt: number;
  durationMs: number;
  status: RunStatus;
  /** Fault keys behind a non-`ok` status, joined for display. */
  faults: string[];
  rowsWritten: number | null;
  errors: number | null;
  summary: unknown;
};

/** Appends one run to the ledger. Never throws — see the note at the top. */
export const recordRun = async (d1: D1Database, run: RunRecord): Promise<void> => {
  try {
    await d1
      .prepare(RECORD_RUN_SQL)
      .bind(
        run.job,
        run.startedAt,
        run.durationMs,
        run.status,
        run.faults.length > 0 ? run.faults.join(",") : null,
        run.rowsWritten,
        run.errors,
        JSON.stringify(run.summary ?? null),
      )
      .run();
  } catch (cause) {
    logError("cron.ledger_write_failed", cause, { job: run.job });
  }
};

/** Drops runs older than the retention window. Never throws. */
export const pruneRuns = async (d1: D1Database, now: number): Promise<void> => {
  try {
    await d1
      .prepare(PRUNE_RUNS_SQL)
      .bind(now - RUN_RETENTION_DAYS * 24 * 60 * 60)
      .run();
  } catch (cause) {
    logError("cron.ledger_prune_failed", cause);
  }
};

// ---------------------------------------------------------------------------
// Liveness
// ---------------------------------------------------------------------------

export const RUN_COUNTS_SQL = `
  SELECT job, COUNT(*) AS observed
  FROM cron_runs
  WHERE started_at >= ?
  GROUP BY job
`;

/** The newest row per job, all-time — so a long-dead job still reports its age. */
export const LAST_RUNS_SQL = `
  SELECT job, started_at, status
  FROM cron_runs
  WHERE id IN (SELECT MAX(id) FROM cron_runs GROUP BY job)
`;

export const RECORDING_SINCE_SQL = `SELECT MIN(started_at) AS since FROM cron_runs`;

export type JobLiveness = {
  job: JobName;
  cron: string;
  /** Ticks a full day should contain, or null if the expression is not countable. */
  expected: number | null;
  /** Ticks actually recorded in `LIVENESS_WINDOW_SECONDS`. */
  observed: number;
  lastRunAt: number | null;
  lastStatus: RunStatus | null;
};

export type Liveness = {
  /**
   * The oldest run on record. Until this is a full window old the counts below
   * are measuring the ledger's own age rather than the jobs', so the fault check
   * stays quiet — otherwise every deploy of this feature would alert on all five
   * jobs at once.
   */
  recordingSince: number | null;
  jobs: JobLiveness[];
};

export const loadLiveness = async (d1: D1Database, now: number): Promise<Liveness> => {
  const since = now - LIVENESS_WINDOW_SECONDS;

  const [counts, last, recording] = await Promise.all([
    d1.prepare(RUN_COUNTS_SQL).bind(since).all<{ job: string; observed: number }>(),
    d1.prepare(LAST_RUNS_SQL).all<{ job: string; started_at: number; status: RunStatus }>(),
    d1.prepare(RECORDING_SINCE_SQL).first<{ since: number | null }>(),
  ]);

  const observed = new Map((counts.results ?? []).map((row) => [row.job, row.observed]));
  const latest = new Map((last.results ?? []).map((row) => [row.job, row]));

  return {
    recordingSince: recording?.since ?? null,
    // Driven by the known job list rather than by what the table contains, so a
    // job that has never run once appears with observed: 0 instead of vanishing.
    jobs: JOB_NAMES.map((job) => ({
      job,
      cron: JOB_CRONS[job],
      expected: firesPerDay(JOB_CRONS[job]),
      observed: observed.get(job) ?? 0,
      lastRunAt: latest.get(job)?.started_at ?? null,
      lastStatus: latest.get(job)?.status ?? null,
    })),
  };
};

/** True once the ledger has a full window of history to judge against. */
export const livenessIsMeaningful = (liveness: Liveness, now: number): boolean =>
  liveness.recordingSince !== null &&
  liveness.recordingSince <= now - LIVENESS_WINDOW_SECONDS;
