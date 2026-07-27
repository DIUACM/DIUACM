import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../../db/client";
import { adminNotices, cronRuns } from "../../db/schema";
import { buildMeta } from "../../lib/pagination";
import { validate } from "../../lib/validator";
import { requirePermission } from "../../middleware/auth";
import { adminNoticeKeyParam, adminSystemRunsQuery } from "../../schemas/admin";
import {
  LIVENESS_WINDOW_SECONDS,
  livenessIsMeaningful,
  loadLiveness,
  RUN_RETENTION_DAYS,
} from "../../sync/runs";
import type { AppEnv } from "../../types";

// ---------------------------------------------------------------------------
// What the crons have been doing, for anyone holding `manage_system`.
//
// Until this existed the answer lived in three places none of which an admin
// could reach: a mailbox belonging to one person, `console.log` behind a
// Cloudflare login, and an `admin_notices` table nothing ever read. These
// endpoints make the same state pullable instead of pushed, which is also what
// lets more than one person be responsible for it.
// ---------------------------------------------------------------------------

const manageSystem = requirePermission("manage_system");

/** Runs charted per job on the health page — about a day of the busiest one. */
const RECENT_RUNS_PER_JOB = 24;

const DAY_SECONDS = 24 * 60 * 60;

/**
 * The last N runs of every job in one pass. A correlated LIMIT per job would be
 * five round trips through D1 for a page that is already one request; the window
 * function does it in one.
 */
const RECENT_RUNS_SQL = `
  SELECT job, started_at, duration_ms, status, faults, rows_written, errors
  FROM (
    SELECT job, started_at, duration_ms, status, faults, rows_written, errors,
           ROW_NUMBER() OVER (PARTITION BY job ORDER BY started_at DESC, id DESC) AS rank
    FROM cron_runs
  )
  WHERE rank <= ?
  ORDER BY job ASC, started_at ASC
`;

/** Totals over the last 24h, which is the window the numbers are labelled with. */
const JOB_TOTALS_SQL = `
  SELECT job,
         COUNT(*) AS runs,
         SUM(CASE WHEN status = 'ok' THEN 1 ELSE 0 END) AS ok,
         SUM(CASE WHEN status = 'degraded' THEN 1 ELSE 0 END) AS degraded,
         SUM(CASE WHEN status = 'crashed' THEN 1 ELSE 0 END) AS crashed,
         COALESCE(SUM(rows_written), 0) AS rows_written,
         COALESCE(SUM(errors), 0) AS errors,
         COALESCE(MAX(duration_ms), 0) AS slowest_ms
  FROM cron_runs
  WHERE started_at >= ?
  GROUP BY job
`;

type RecentRun = {
  job: string;
  started_at: number;
  duration_ms: number;
  status: "ok" | "degraded" | "crashed";
  faults: string | null;
  rows_written: number | null;
  errors: number | null;
};

type JobTotals = {
  job: string;
  runs: number;
  ok: number;
  degraded: number;
  crashed: number;
  rows_written: number;
  errors: number;
  slowest_ms: number;
};

/**
 * Stored as text and returned parsed, so the client never has to know it was a
 * string. Malformed JSON cannot come from our own writer, but a null is a better
 * answer than a 500 if it ever does.
 */
const parseSummary = (raw: string | null): unknown => {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const EMPTY_TOTALS = {
  runs: 0,
  ok: 0,
  degraded: 0,
  crashed: 0,
  rowsWritten: 0,
  errors: 0,
  slowestMs: 0,
};

const adminSystemRoutes = new Hono<AppEnv>();

/**
 * Everything the health page needs in one request: per-job liveness, the last
 * day's totals, a run strip to chart, and the open faults.
 */
adminSystemRoutes.get("/health", manageSystem, async (c) => {
  const now = Math.floor(Date.now() / 1000);
  const db = getDb(c.env.DB);

  const [liveness, recent, totals, notices] = await Promise.all([
    loadLiveness(c.env.DB, now),
    c.env.DB.prepare(RECENT_RUNS_SQL).bind(RECENT_RUNS_PER_JOB).all<RecentRun>(),
    c.env.DB.prepare(JOB_TOTALS_SQL).bind(now - DAY_SECONDS).all<JobTotals>(),
    db.select().from(adminNotices).orderBy(desc(adminNotices.lastSeenAt)),
  ]);

  const runsByJob = new Map<string, RecentRun[]>();
  for (const row of recent.results ?? []) {
    const bucket = runsByJob.get(row.job);
    if (bucket) bucket.push(row);
    else runsByJob.set(row.job, [row]);
  }
  const totalsByJob = new Map((totals.results ?? []).map((row) => [row.job, row]));

  const jobs = liveness.jobs.map((job) => {
    const runs = runsByJob.get(job.job) ?? [];
    const jobTotals = totalsByJob.get(job.job);
    const last = runs.at(-1) ?? null;

    return {
      job: job.job,
      cron: job.cron,
      /** Ticks a full day should contain; null when not derivable from the cron. */
      expected: job.expected,
      /** Ticks recorded in the liveness window, which is an hour wider than a day. */
      observed: job.observed,
      lastRunAt: job.lastRunAt,
      lastStatus: job.lastStatus,
      lastDurationMs: last?.duration_ms ?? null,
      lastFaults: last?.faults ? last.faults.split(",") : [],
      day: jobTotals
        ? {
            runs: jobTotals.runs,
            ok: jobTotals.ok,
            degraded: jobTotals.degraded,
            crashed: jobTotals.crashed,
            rowsWritten: jobTotals.rows_written,
            errors: jobTotals.errors,
            slowestMs: jobTotals.slowest_ms,
          }
        : EMPTY_TOTALS,
      // Oldest first, so the client can render it left-to-right as-is.
      recent: runs.map((run) => ({
        startedAt: run.started_at,
        durationMs: run.duration_ms,
        status: run.status,
        rowsWritten: run.rows_written,
        errors: run.errors,
      })),
    };
  });

  return c.json({
    now,
    recordingSince: liveness.recordingSince,
    /**
     * False while the ledger is younger than one liveness window. The page has
     * to say so rather than render "0 of 96 ticks" in red at everyone the first
     * day after a deploy.
     */
    livenessReady: livenessIsMeaningful(liveness, now),
    livenessWindowSeconds: LIVENESS_WINDOW_SECONDS,
    retentionDays: RUN_RETENTION_DAYS,
    jobs,
    notices: (notices ?? []).map((notice) => ({
      key: notice.key,
      firstSeenAt: notice.firstSeenAt,
      lastSeenAt: notice.lastSeenAt,
      lastSentAt: notice.lastSentAt,
      occurrences: notice.occurrences,
      lastDetail: notice.lastDetail,
    })),
  });
});

/** The full ledger, filterable, newest first. */
adminSystemRoutes.get("/runs", manageSystem, validate("query", adminSystemRunsQuery), async (c) => {
  const { page, perPage, job, status } = c.req.valid("query");
  const db = getDb(c.env.DB);

  const filters: SQL[] = [];
  if (job) filters.push(eq(cronRuns.job, job));
  if (status) filters.push(eq(cronRuns.status, status));
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select()
      .from(cronRuns)
      .where(where)
      .orderBy(desc(cronRuns.startedAt), desc(cronRuns.id))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(cronRuns).where(where),
  ]);

  return c.json({
    data: rows.map((row) => ({
      id: row.id,
      job: row.job,
      startedAt: row.startedAt,
      durationMs: row.durationMs,
      status: row.status,
      faults: row.faults ? row.faults.split(",") : [],
      rowsWritten: row.rowsWritten,
      errors: row.errors,
      summary: parseSummary(row.summary),
    })),
    meta: buildMeta(page, perPage, total),
  });
});

/**
 * Acknowledge a fault: drop its cooldown ledger row.
 *
 * Deleting rather than flagging is deliberate. The row's only job is to
 * suppress repeat mail for an hour, so removing it means "I have dealt with
 * this" *and* "if it happens again, tell me straight away" rather than leaving
 * the admin inside a cooldown started by the problem they just fixed. The run
 * that raised it stays in `cron_runs` either way, so the history is not lost.
 */
adminSystemRoutes.delete(
  "/notices/:key",
  manageSystem,
  validate("param", adminNoticeKeyParam),
  async (c) => {
    const { key } = c.req.valid("param");
    const db = getDb(c.env.DB);

    const deleted = await db
      .delete(adminNotices)
      .where(eq(adminNotices.key, key))
      .returning({ key: adminNotices.key });
    if (deleted.length === 0) throw new HTTPException(404, { message: "Notice not found" });

    return c.json({ ok: true });
  },
);

export default adminSystemRoutes;
