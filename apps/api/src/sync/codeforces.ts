import { detectContestLink } from "@diuacm/contest-link";

import {
  CodeforcesApiError,
  getUserSubmissions,
  type CodeforcesSubmission,
} from "../lib/codeforces";

// ---------------------------------------------------------------------------
// Scheduled Codeforces performance sync.
//
// Keeps `event_performance.solve_count` / `upsolve_count` current for every
// user who has a Codeforces handle, on every event whose `event_link` points at
// a public Codeforces contest. Ranklist scores follow for free through the
// existing score triggers.
//
// One `user.status` call covers a user across *all* tracked contests, so the
// unit of work is a handle, not an (event, user) pair. Handles are processed a
// batch at a time, oldest cursor first, so successive cron ticks walk the whole
// table and start over.
// ---------------------------------------------------------------------------

/**
 * Handles per run. A full batch costs about BATCH_SIZE × REQUEST_DELAY_MS of
 * wall clock — ~3.5 min here, against Cloudflare's 15 min ceiling for a
 * scheduled invocation.
 */
const BATCH_SIZE = 100;
/** Codeforces documents roughly one request per two seconds. Stay there. */
const REQUEST_DELAY_MS = 2000;
/**
 * Wall-clock ceiling for a single run; leftovers are picked up next tick. Set
 * well under the platform's 15 min so even a slow Codeforces leaves room for
 * the in-flight handle to finish and its cursor to land.
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
// of 30s (JSON parsing dominates; waiting on the network does not count), and
// ~3.5 min of wall clock of 15 min. Free-plan crons get 10ms CPU and 50
// subrequests, which this cannot fit under at any batch size.

export type SyncEvent = {
  eventId: number;
  contestId: string;
  startingAt: number;
  endingAt: number;
};

export type PerformanceCounts = { solveCount: number; upsolveCount: number };

/** Codeforces' own word for "this was the live contest". */
const IN_CONTEST_PARTICIPANT_TYPES = new Set(["CONTESTANT", "OUT_OF_COMPETITION"]);

const submissionContestId = (submission: CodeforcesSubmission): string | null => {
  const id = submission.problem.contestId ?? submission.contestId;
  return id === undefined ? null : String(id);
};

/**
 * Solve / upsolve counts per event, from one user's submissions.
 *
 * Solved = accepted during the contest, meaning either Codeforces marks it as a
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
  submissions: CodeforcesSubmission[],
): Map<number, PerformanceCounts> => {
  const accepted = submissions.filter((s) => s.verdict === "OK");
  const byContest = new Map<string, CodeforcesSubmission[]>();
  for (const submission of accepted) {
    const contestId = submissionContestId(submission);
    if (contestId === null) continue;
    const bucket = byContest.get(contestId);
    if (bucket) bucket.push(submission);
    else byContest.set(contestId, [submission]);
  }

  const result = new Map<number, PerformanceCounts>();
  for (const event of events) {
    const relevant = byContest.get(event.contestId);
    if (!relevant) continue;

    const solved = new Set<string>();
    const upsolved = new Set<string>();
    for (const submission of relevant) {
      const inContest =
        IN_CONTEST_PARTICIPANT_TYPES.has(submission.author.participantType) ||
        (submission.creationTimeSeconds >= event.startingAt &&
          submission.creationTimeSeconds <= event.endingAt);
      if (inContest) solved.add(submission.problem.index);
      else upsolved.add(submission.problem.index);
    }
    for (const index of solved) upsolved.delete(index);

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

/** Least recently synced first, so every handle gets its turn. */
export const DUE_HANDLES_SQL = `
  SELECT id, user_id, handle
  FROM user_handles
  WHERE type = 'codeforces'
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

export type CodeforcesSyncSummary = {
  events: number;
  handlesProcessed: number;
  rowsWritten: number;
  errors: number;
  /** True when the batch stopped early (time budget or Codeforces rate limit). */
  stoppedEarly: boolean;
};

export type CodeforcesSyncOptions = {
  fetcher?: typeof fetch;
  /** Seconds since the epoch; injectable so tests are not clock-dependent. */
  now?: number;
  limit?: number;
  requestDelayMs?: number;
  timeBudgetMs?: number;
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Spaces out every Codeforces call, paging included. Wrapping the fetcher
 * rather than sleeping between handles is what keeps a user with a long
 * submission history — several pages in a row — from tripping the rate limit.
 */
const throttle = (fetcher: typeof fetch, delayMs: number): typeof fetch => {
  let previousCallAt = 0;
  return (async (...args: Parameters<typeof fetch>) => {
    const wait = previousCallAt + delayMs - Date.now();
    if (wait > 0) await sleep(wait);
    previousCallAt = Date.now();
    return fetcher(...args);
  }) as typeof fetch;
};

/**
 * Public Codeforces contests only. Gym and group contests are private to the
 * API — anonymous calls get "You have to be authenticated to use this method" —
 * so they stay manual.
 */
export const toSyncEvent = (row: EventRow): SyncEvent | null => {
  if (!row.event_link) return null;
  const detected = detectContestLink(row.event_link);
  if (!detected || detected.platform !== "codeforces" || detected.kind !== "contest") return null;
  return {
    eventId: row.id,
    contestId: detected.contestId,
    startingAt: row.starting_at,
    endingAt: row.ending_at,
  };
};

export const runCodeforcesSync = async (
  d1: D1Database,
  options: CodeforcesSyncOptions = {},
): Promise<CodeforcesSyncSummary> => {
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const limit = options.limit ?? BATCH_SIZE;
  const requestDelayMs = options.requestDelayMs ?? REQUEST_DELAY_MS;
  const timeBudgetMs = options.timeBudgetMs ?? TIME_BUDGET_MS;
  const startedAt = Date.now();

  const summary: CodeforcesSyncSummary = {
    events: 0,
    handlesProcessed: 0,
    rowsWritten: 0,
    errors: 0,
    stoppedEarly: false,
  };

  const eventRows = await d1.prepare(SYNC_EVENTS_SQL).bind(now).all<EventRow>();
  const events = (eventRows.results ?? [])
    .map(toSyncEvent)
    .filter((event): event is SyncEvent => event !== null);
  summary.events = events.length;
  if (events.length === 0) return summary;

  // Nothing before the earliest contest can be a solve or an upsolve.
  const since = Math.min(...events.map((event) => event.startingAt));

  const handleRows = await d1.prepare(DUE_HANDLES_SQL).bind(limit).all<HandleRow>();
  const handles = handleRows.results ?? [];
  const fetcher = throttle(options.fetcher ?? fetch, requestDelayMs);

  for (const row of handles) {
    if (Date.now() - startedAt > timeBudgetMs) {
      summary.stoppedEarly = true;
      break;
    }

    let error: string | null = null;
    let callLimited = false;
    let upserts: D1PreparedStatement[] = [];

    try {
      const submissions = await getUserSubmissions(row.handle, { since, fetcher });
      const counts = computePerformance(events, submissions);
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
      callLimited = cause instanceof CodeforcesApiError && cause.kind === "call-limit";
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
    if (callLimited) {
      summary.stoppedEarly = true;
      break;
    }
  }

  return summary;
};
