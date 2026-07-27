import { detectContestLink, type DetectedContest } from "@diuacm/contest-link";

import type { HandleType } from "../schemas/handles";

// ---------------------------------------------------------------------------
// Scheduled performance sync — the platform-neutral half.
//
// Keeps `event_performance.solve_count` / `upsolve_count` current for every user
// who has a handle on the platform, on every event whose `event_link` points at
// a contest that platform owns. Ranklist scores follow for free through the
// existing score triggers.
//
// One API call covers a user across *all* tracked contests, so the unit of work
// is a handle, not an (event, user) pair. Handles are processed a batch at a
// time, oldest cursor first, so successive cron ticks walk the whole table and
// start over.
//
// Everything judge-specific lives behind `SyncPlatform` (see codeforces.ts and
// atcoder.ts). This file owns the batching, throttling, cursor, and writes.
//
// VJudge does not fit that shape — one call there returns every participant of
// one contest, so its unit of work is a contest, not a handle. It runs its own
// loop in vjudge.ts and borrows the pieces that are genuinely shared:
// `computePerformance`, `toSyncEvent`, `throttle`, and the write SQL.
// ---------------------------------------------------------------------------

/**
 * Handles per run. A full batch costs about BATCH_SIZE × the platform's request
 * delay of wall clock — a few minutes, against Cloudflare's 15 min ceiling for a
 * scheduled invocation.
 */
const BATCH_SIZE = 100;
/**
 * A handle synced more recently than this is skipped. Upsolves trickle in over
 * days, so re-reading the same account every tick burns API calls and CPU to
 * rediscover the same numbers. With ~275 handles at 100 per tick the queue
 * drains in ~45 min, then idles until the oldest handle ages past this.
 */
const MIN_RESYNC_SECONDS = 2 * 60 * 60;
/**
 * Wall-clock ceiling for a single run; leftovers are picked up next tick. Set
 * well under the platform's 15 min so even a slow judge leaves room for the
 * in-flight handle to finish and its cursor to land.
 */
const TIME_BUDGET_MS = 600_000;
/**
 * Upserts per D1 transaction. Bounds how much trigger cascade one statement
 * batch can set off (see the write loop) against D1's 30s query limit.
 */
export const WRITE_CHUNK_SIZE = 50;

// Kept as module constants rather than wrangler `vars`: vars are typed as
// string literals in worker-configuration.d.ts, so every tweak would force a
// `pnpm cf-typegen`.
//
// Budget for one run, against the Workers Paid limits: ~600 subrequests of
// 10,000 (one fetch plus a few batches per handle), a couple of seconds of CPU
// of 30s (JSON parsing dominates; waiting on the network does not count), and a
// few minutes of wall clock of 15 min. Free-plan crons get 10ms CPU and 50
// subrequests, which this cannot fit under at any batch size.

export type SyncEvent = {
  eventId: number;
  contestId: string;
  startingAt: number;
  endingAt: number;
};

export type PerformanceCounts = { solveCount: number; upsolveCount: number };

/**
 * One accepted submission, flattened to what the counter needs. Each judge maps
 * its own submission shape onto this so `computePerformance` never has to know
 * which one it came from.
 */
export type Solve = {
  contestId: string;
  /** Unique within its contest — an index ("A") or a slug ("abc300_a"). */
  problemId: string;
  solvedAt: number;
  /** The platform itself says this landed during the live contest. */
  inContest: boolean;
};

export type SolvePage = {
  solves: Solve[];
  /**
   * The judge's paging cap was reached with history still to read, so these
   * solves are incomplete and the counts derived from them are too low. The
   * runner collects these handles and the dispatcher alerts on them.
   */
  truncated: boolean;
};

/** What one judge has to supply for the runner to sync it. */
export type SyncPlatform = {
  /** Which `user_handles.type` rows this platform owns. */
  handleType: HandleType;
  /** Which detected event links this platform will sync. */
  accepts: (contest: DetectedContest) => boolean;
  /** Spacing between every call to this judge, paging included. */
  requestDelayMs: number;
  /** Whether a thrown error means the whole batch should back off. */
  isRateLimit: (cause: unknown) => boolean;
  /**
   * Called once per run, before any handle — the place to load whatever shared
   * metadata the judge needs (contest windows, for instance). The returned
   * reader is then called once per handle.
   */
  start: (ctx: {
    events: SyncEvent[];
    since: number;
    fetcher: typeof fetch;
  }) => Promise<{ fetchSolves: (handle: string) => Promise<SolvePage> }>;
};

/**
 * Solve / upsolve counts per event, from one user's accepted submissions.
 *
 * Solved = accepted during the contest, meaning either the judge marks it as a
 * live participation or it landed inside the event's own window — the second
 * branch is what counts club-run replays, where members take part virtually or
 * in practice mode during a scheduled session. Upsolved = accepted at any other
 * time, on a problem not already solved during the contest.
 *
 * Counted per event rather than per contest, because two events can point at the
 * same contest with different windows.
 */
export const computePerformance = (
  events: SyncEvent[],
  solves: Solve[],
): Map<number, PerformanceCounts> => {
  const byContest = new Map<string, Solve[]>();
  for (const solve of solves) {
    const bucket = byContest.get(solve.contestId);
    if (bucket) bucket.push(solve);
    else byContest.set(solve.contestId, [solve]);
  }

  const result = new Map<number, PerformanceCounts>();
  for (const event of events) {
    const relevant = byContest.get(event.contestId);
    if (!relevant) continue;

    const solved = new Set<string>();
    const upsolved = new Set<string>();
    for (const solve of relevant) {
      const inContest =
        solve.inContest ||
        (solve.solvedAt >= event.startingAt && solve.solvedAt <= event.endingAt);
      if (inContest) solved.add(solve.problemId);
      else upsolved.add(solve.problemId);
    }
    for (const problemId of solved) upsolved.delete(problemId);

    result.set(event.eventId, { solveCount: solved.size, upsolveCount: upsolved.size });
  }

  return result;
};

// ---------------------------------------------------------------------------
// SQL. Written out rather than expressed through Drizzle so the exact
// statements the worker runs can be replayed against the test database, real
// triggers included — the same approach as lib/vjudge-handles.ts.
// ---------------------------------------------------------------------------

/**
 * Events worth syncing: published, finished, linked, and attached to at least
 * one ranklist that is still open. Locking a ranklist at the end of a semester
 * is what freezes its events.
 */
export const SYNC_EVENTS_SQL = `
  SELECT DISTINCT e.id AS id, e.event_link AS event_link,
         e.starting_at AS starting_at, e.ending_at AS ending_at
  FROM events e
  JOIN ranklist_event re ON re.event_id = e.id
  JOIN ranklists rl ON rl.id = re.ranklist_id AND rl.is_locked = 0
  WHERE e.status = 'published' AND e.ending_at <= ? AND e.event_link IS NOT NULL
`;

/**
 * Least recently synced first, so every handle gets its turn, and never one
 * that was read within the freshness window.
 */
export const DUE_HANDLES_SQL = `
  SELECT id, user_id, handle
  FROM user_handles
  WHERE type = ? AND COALESCE(last_synced_at, 0) <= ?
  ORDER BY COALESCE(last_synced_at, 0) ASC, id ASC
  LIMIT ?
`;

/**
 * `position` is deliberately absent from the SET list: it is admin-entered and
 * must survive a sync. The trailing WHERE turns an unchanged run into a no-op,
 * which keeps the score/rank triggers from firing on every tick.
 *
 * RETURNING is how the run counts its own work: a skipped no-op returns no row,
 * whereas `meta.changes` would also fold in every row the score and count
 * triggers touch downstream.
 */
export const PERFORMANCE_UPSERT_SQL = `
  INSERT INTO event_performance (event_id, user_id, solve_count, upsolve_count)
  VALUES (?, ?, ?, ?)
  ON CONFLICT (event_id, user_id) DO UPDATE SET
    solve_count = excluded.solve_count,
    upsolve_count = excluded.upsolve_count,
    updated_at = (unixepoch())
  WHERE solve_count <> excluded.solve_count OR upsolve_count <> excluded.upsolve_count
  RETURNING event_id
`;

export const HANDLE_CURSOR_SQL = `
  UPDATE user_handles SET last_synced_at = ?, last_sync_error = ? WHERE id = ?
`;

type EventRow = {
  id: number;
  event_link: string | null;
  starting_at: number;
  ending_at: number;
};

type HandleRow = { id: number; user_id: number; handle: string };

/**
 * Why a batch ended before its last handle. `time-budget` is routine — the
 * leftovers go on the next tick. `rate-limit` means the judge pushed back and
 * is worth telling someone about, so the two are kept apart.
 */
export type StopReason = "time-budget" | "rate-limit" | null;

export type SyncSummary = {
  events: number;
  handlesProcessed: number;
  rowsWritten: number;
  errors: number;
  /** True when the batch stopped early (time budget or the judge's rate limit). */
  stoppedEarly: boolean;
  stoppedReason: StopReason;
  /** Handles whose submission history hit the judge's paging cap. */
  truncatedHandles: string[];
};

export type SyncOptions = {
  fetcher?: typeof fetch;
  /** Seconds since the epoch; injectable so tests are not clock-dependent. */
  now?: number;
  limit?: number;
  requestDelayMs?: number;
  timeBudgetMs?: number;
  /** Skip handles synced within this many seconds. 0 forces a re-read. */
  minResyncSeconds?: number;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Spaces out every call to the judge, paging included. Wrapping the fetcher
 * rather than sleeping between handles is what keeps a user with a long
 * submission history — several pages in a row — from tripping the rate limit.
 */
export const throttle = (fetcher: typeof fetch, delayMs: number): typeof fetch => {
  let previousCallAt = 0;
  return (async (...args: Parameters<typeof fetch>) => {
    const wait = previousCallAt + delayMs - Date.now();
    if (wait > 0) await sleep(wait);
    previousCallAt = Date.now();
    return fetcher(...args);
  }) as typeof fetch;
};

/** An event row becomes syncable only if this platform claims its link. */
export const toSyncEvent = (
  row: EventRow,
  accepts: SyncPlatform["accepts"],
): SyncEvent | null => {
  if (!row.event_link) return null;
  const detected = detectContestLink(row.event_link);
  if (!detected || !accepts(detected)) return null;
  return {
    eventId: row.id,
    contestId: detected.contestId,
    startingAt: row.starting_at,
    endingAt: row.ending_at,
  };
};

export const runSync = async (
  d1: D1Database,
  platform: SyncPlatform,
  options: SyncOptions = {},
): Promise<SyncSummary> => {
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const limit = options.limit ?? BATCH_SIZE;
  const requestDelayMs = options.requestDelayMs ?? platform.requestDelayMs;
  const timeBudgetMs = options.timeBudgetMs ?? TIME_BUDGET_MS;
  const minResyncSeconds = options.minResyncSeconds ?? MIN_RESYNC_SECONDS;
  const startedAt = Date.now();

  const summary: SyncSummary = {
    events: 0,
    handlesProcessed: 0,
    rowsWritten: 0,
    errors: 0,
    stoppedEarly: false,
    stoppedReason: null,
    truncatedHandles: [],
  };

  const eventRows = await d1.prepare(SYNC_EVENTS_SQL).bind(now).all<EventRow>();
  const events = (eventRows.results ?? [])
    .map((row) => toSyncEvent(row, platform.accepts))
    .filter((event): event is SyncEvent => event !== null);
  summary.events = events.length;
  if (events.length === 0) return summary;

  // Nothing before the earliest contest can be a solve or an upsolve.
  const since = Math.min(...events.map((event) => event.startingAt));

  const handleRows = await d1
    .prepare(DUE_HANDLES_SQL)
    .bind(platform.handleType, now - minResyncSeconds, limit)
    .all<HandleRow>();
  const handles = handleRows.results ?? [];
  if (handles.length === 0) return summary;

  const fetcher = throttle(options.fetcher ?? fetch, requestDelayMs);
  // Deliberately outside the per-handle try/catch: if a platform cannot load its
  // shared metadata there is nothing sensible to sync, and failing the run
  // leaves every cursor untouched so the next tick retries cleanly.
  const reader = await platform.start({ events, since, fetcher });

  for (const row of handles) {
    if (Date.now() - startedAt > timeBudgetMs) {
      summary.stoppedEarly = true;
      summary.stoppedReason = "time-budget";
      break;
    }

    let error: string | null = null;
    let rateLimited = false;
    let upserts: D1PreparedStatement[] = [];

    try {
      const page = await reader.fetchSolves(row.handle);
      // Recorded but not treated as an error: the partial counts are still
      // better than none, and the alert is what gets it looked at.
      if (page.truncated) summary.truncatedHandles.push(row.handle);
      const counts = computePerformance(events, page.solves);
      const upsert = d1.prepare(PERFORMANCE_UPSERT_SQL);
      for (const [eventId, { solveCount, upsolveCount }] of counts) {
        // A 0/0 row carries no information and would pull the user into every
        // auto-add ranklist attached to the event.
        if (solveCount + upsolveCount === 0) continue;
        upserts.push(upsert.bind(eventId, row.user_id, solveCount, upsolveCount));
      }
    } catch (cause) {
      upserts = [];
      error = cause instanceof Error ? cause.message : String(cause);
      // Backing off is the only useful response; the rest of the batch would
      // fail the same way.
      rateLimited = platform.isRateLimit(cause);
    }

    // Chunked rather than one transaction per handle: the score triggers turn a
    // single upsert into a whole-ranklist re-rank, and a first-pass user can
    // touch every in-scope event at once — enough to approach D1's 30s query
    // ceiling. Each chunk is independently idempotent, so a partial write just
    // converges on the next tick.
    try {
      for (let i = 0; i < upserts.length; i += WRITE_CHUNK_SIZE) {
        const results = await d1.batch(upserts.slice(i, i + WRITE_CHUNK_SIZE));
        // Not the statement count: the upsert's trailing WHERE makes an
        // unchanged row a no-op, and those are the majority on a steady system.
        for (const result of results) summary.rowsWritten += result.results?.length ?? 0;
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    }

    // Always last, always on its own statement: the cursor has to advance even
    // when the fetch or the writes failed, or a poison handle wedges the queue
    // behind it forever.
    await d1.prepare(HANDLE_CURSOR_SQL).bind(now, error, row.id).run();

    summary.handlesProcessed += 1;
    if (error) summary.errors += 1;
    if (rateLimited) {
      summary.stoppedEarly = true;
      summary.stoppedReason = "rate-limit";
      break;
    }
  }

  return summary;
};
