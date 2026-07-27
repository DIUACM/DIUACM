import { getContestRank, isAccepted, VjudgeApiError } from "../lib/vjudge";
import {
  computePerformance,
  PERFORMANCE_UPSERT_SQL,
  tallyError,
  throttle,
  toSyncEvent,
  WRITE_CHUNK_SIZE,
  type ErrorTally,
  type Solve,
  type StopReason,
  type SyncEvent,
} from "./runner";

// ---------------------------------------------------------------------------
// VJudge performance sync — the contest-driven half.
//
// The handle-driven runner exists because Codeforces and AtCoder cover a user
// across every contest in one call. VJudge is the mirror image: one call to
// /contest/rank/single/<id> returns every participant of one contest, live
// submissions and upsolves together. So the unit of work here is a contest, and
// one pass over the ~120 in-scope events covers all ~350 handles — against the
// ~480 calls the same work would cost handle-first.
//
// The rest — what counts as a solve, how a row is written — is shared with
// runner.ts, so the two halves can't drift on the parts that matter.
// ---------------------------------------------------------------------------

/**
 * Contests per run. Each costs one call plus a write chunk, so a full batch is
 * well under a minute of wall clock — the cron fires every 15 min.
 */
const BATCH_SIZE = 40;
/**
 * A contest synced more recently than this is skipped. Matches the handle
 * runner's window: ~120 events drain in three ticks, then the job idles until
 * the oldest ages out, so every contest is re-read roughly every 2 hours.
 */
const MIN_RESYNC_SECONDS = 2 * 60 * 60;
/** Wall-clock ceiling for a single run; leftovers are picked up next tick. */
const TIME_BUDGET_MS = 600_000;
/** VJudge publishes no rate limit. One call a second is unhurried. */
const REQUEST_DELAY_MS = 1000;

/**
 * In-scope events plus their sync cursor: published, finished, linked, and on at
 * least one ranklist that is still open — the same scope as `SYNC_EVENTS_SQL`,
 * with `event_sync_state` joined in.
 *
 * Deliberately unfiltered by platform and unlimited: only `detectContestLink`
 * can tell a VJudge row from a Codeforces one, so a SQL `LIMIT` here could
 * return a batch of Codeforces events and leave this run with nothing to do.
 * A few hundred rows is nothing to read, so the batch is cut in JS instead.
 */
export const DUE_CONTESTS_SQL = `
  SELECT DISTINCT e.id AS id, e.event_link AS event_link,
         e.starting_at AS starting_at, e.ending_at AS ending_at,
         COALESCE(s.last_synced_at, 0) AS last_synced_at
  FROM events e
  JOIN ranklist_event re ON re.event_id = e.id
  JOIN ranklists rl ON rl.id = re.ranklist_id AND rl.is_locked = 0
  LEFT JOIN event_sync_state s ON s.event_id = e.id
  WHERE e.status = 'published' AND e.ending_at <= ? AND e.event_link IS NOT NULL
`;

export const VJUDGE_HANDLES_SQL = `
  SELECT user_id, handle FROM user_handles WHERE type = 'vjudge'
`;

export const EVENT_CURSOR_SQL = `
  INSERT INTO event_sync_state (event_id, last_synced_at, last_sync_error)
  VALUES (?, ?, ?)
  ON CONFLICT (event_id) DO UPDATE SET
    last_synced_at = excluded.last_synced_at,
    last_sync_error = excluded.last_sync_error
`;

type EventRow = {
  id: number;
  event_link: string | null;
  starting_at: number;
  ending_at: number;
  last_synced_at: number;
};

type HandleRow = { user_id: number; handle: string };

export type VjudgeSyncSummary = {
  /** In-scope VJudge events, before the freshness window is applied. */
  events: number;
  contestsFetched: number;
  contestsAttempted: number;
  rowsWritten: number;
  errors: number;
  /** True when the batch stopped early (time budget or VJudge pushing back). */
  stoppedEarly: boolean;
  stoppedReason: StopReason;
  /** Distinct failure messages in this run, and how many contests hit each. */
  errorReasons: ErrorTally;
};

export type VjudgeSyncOptions = {
  fetcher?: typeof fetch;
  /** Seconds since the epoch; injectable so tests are not clock-dependent. */
  now?: number;
  limit?: number;
  requestDelayMs?: number;
  timeBudgetMs?: number;
  /** Skip contests synced within this many seconds. 0 forces a re-read. */
  minResyncSeconds?: number;
};

/**
 * Every user credited by this contest's standings, with their accepted
 * submissions flattened into the shape `computePerformance` expects.
 *
 * A user with several VJudge handles — which the schema allows, and only for
 * VJudge — lands in one bucket, so their problems are counted once across all
 * of them rather than the last handle's upsert clobbering the first.
 */
export const solvesByUser = (
  contestId: string,
  rank: Awaited<ReturnType<typeof getContestRank>>,
  handles: Map<string, number>,
): Map<number, Solve[]> => {
  const beginSeconds = Math.floor(rank.begin / 1000);
  const lengthSeconds = Math.floor(rank.length / 1000);

  const byUser = new Map<number, Solve[]>();
  for (const submission of rank.submissions) {
    if (!isAccepted(submission)) continue;
    const [participantId, problemIndex, , secondsSinceBegin] = submission;

    const name = rank.participants[String(participantId)]?.name;
    if (name === undefined) continue;
    const userId = handles.get(name.toLowerCase());
    if (userId === undefined) continue;

    const solve: Solve = {
      contestId,
      // Unique within the contest, which is all `computePerformance` needs.
      problemId: String(problemIndex),
      solvedAt: beginSeconds + secondsSinceBegin,
      // VJudge keeps recording after the clock runs out; that tail is exactly
      // what an upsolve is.
      inContest: secondsSinceBegin <= lengthSeconds,
    };

    const bucket = byUser.get(userId);
    if (bucket) bucket.push(solve);
    else byUser.set(userId, [solve]);
  }

  return byUser;
};

/** Two events can point at the same VJudge contest; that is still one fetch. */
const groupByContest = (events: SyncEvent[]): Map<string, SyncEvent[]> => {
  const grouped = new Map<string, SyncEvent[]>();
  for (const event of events) {
    const bucket = grouped.get(event.contestId);
    if (bucket) bucket.push(event);
    else grouped.set(event.contestId, [event]);
  }
  return grouped;
};

export const runVjudgeSync = async (
  d1: D1Database,
  options: VjudgeSyncOptions = {},
): Promise<VjudgeSyncSummary> => {
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const limit = options.limit ?? BATCH_SIZE;
  const requestDelayMs = options.requestDelayMs ?? REQUEST_DELAY_MS;
  const timeBudgetMs = options.timeBudgetMs ?? TIME_BUDGET_MS;
  const minResyncSeconds = options.minResyncSeconds ?? MIN_RESYNC_SECONDS;
  const startedAt = Date.now();

  const summary: VjudgeSyncSummary = {
    events: 0,
    contestsFetched: 0,
    contestsAttempted: 0,
    rowsWritten: 0,
    errors: 0,
    stoppedEarly: false,
    stoppedReason: null,
    errorReasons: {},
  };

  const eventRows = await d1.prepare(DUE_CONTESTS_SQL).bind(now).all<EventRow>();

  const cursors = new Map<number, number>();
  const inScope: SyncEvent[] = [];
  for (const row of eventRows.results ?? []) {
    const event = toSyncEvent(row, (contest) => contest.platform === "vjudge");
    if (!event) continue;
    cursors.set(event.eventId, row.last_synced_at);
    inScope.push(event);
  }
  summary.events = inScope.length;
  if (inScope.length === 0) return summary;

  // Least recently synced first, so every contest gets its turn, and never one
  // read within the freshness window.
  const due = inScope
    .filter((event) => (cursors.get(event.eventId) ?? 0) <= now - minResyncSeconds)
    .sort(
      (a, b) =>
        (cursors.get(a.eventId) ?? 0) - (cursors.get(b.eventId) ?? 0) || a.eventId - b.eventId,
    )
    .slice(0, limit);
  if (due.length === 0) return summary;

  const handleRows = await d1.prepare(VJUDGE_HANDLES_SQL).all<HandleRow>();
  const handles = new Map<string, number>();
  for (const row of handleRows.results ?? []) handles.set(row.handle.toLowerCase(), row.user_id);
  if (handles.size === 0) return summary;

  const fetcher = throttle(options.fetcher ?? fetch, requestDelayMs);

  for (const [contestId, events] of groupByContest(due)) {
    if (Date.now() - startedAt > timeBudgetMs) {
      summary.stoppedEarly = true;
      summary.stoppedReason = "time-budget";
      break;
    }
    summary.contestsAttempted += 1;

    let error: string | null = null;
    let rateLimited = false;
    let upserts: D1PreparedStatement[] = [];

    try {
      const rank = await getContestRank(contestId, fetcher);
      summary.contestsFetched += 1;

      const upsert = d1.prepare(PERFORMANCE_UPSERT_SQL);
      for (const [userId, solves] of solvesByUser(contestId, rank, handles)) {
        // Only this contest's events: `computePerformance` skips the rest
        // anyway, and passing them would make that an accident rather than intent.
        for (const [eventId, { solveCount, upsolveCount }] of computePerformance(events, solves)) {
          // A 0/0 row carries no information and would pull the user into every
          // auto-add ranklist attached to the event.
          if (solveCount + upsolveCount === 0) continue;
          upserts.push(upsert.bind(eventId, userId, solveCount, upsolveCount));
        }
      }
    } catch (cause) {
      upserts = [];
      error = cause instanceof Error ? cause.message : String(cause);
      // Backing off is the only useful response; the rest of the batch would
      // fail the same way.
      rateLimited = cause instanceof VjudgeApiError && cause.kind === "rate-limited";
    }

    // Chunked for the same reason as the handle runner: the score triggers turn
    // a single upsert into a whole-ranklist re-rank, and a contest can credit
    // dozens of users at once. Each chunk is independently idempotent.
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

    // Always last: the cursor has to advance even when the fetch or the writes
    // failed, or a contest VJudge has hidden wedges the queue behind it forever.
    const cursor = d1.prepare(EVENT_CURSOR_SQL);
    await d1.batch(events.map((event) => cursor.bind(event.eventId, now, error)));

    if (error) {
      summary.errors += 1;
      tallyError(summary.errorReasons, error);
    }
    if (rateLimited) {
      summary.stoppedEarly = true;
      summary.stoppedReason = "rate-limit";
      break;
    }
  }

  return summary;
};
