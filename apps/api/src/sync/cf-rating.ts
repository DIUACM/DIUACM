import {
  CodeforcesApiError,
  getCodeforcesUsers,
  type ResolvedCodeforcesUser,
} from "../lib/codeforces";
import { codeforcesPlatform } from "./codeforces";
import {
  sleep,
  tallyError,
  throttle,
  WRITE_CHUNK_SIZE,
  type ErrorTally,
  type StopReason,
} from "./runner";

// ---------------------------------------------------------------------------
// Daily Codeforces rating and handle refresh.
//
// `users.max_cf_rating` is otherwise only written when a person saves a handle,
// so it is stale from the moment it lands. This re-reads it once a day.
//
// The handle half matters more than it looks. `user.status` — the endpoint the
// 15-minute solve sync uses — has no historic-handle resolution, so when a
// member renames on Codeforces their stored handle starts failing and their
// solve counts freeze silently and permanently. `user.info` with
// `checkHistoricHandles=true` is the only call that maps an old handle to its
// current one, so writing that answer back here is what un-wedges the solve sync.
//
// Deliberately not a `SyncPlatform`: that interface is one handle per call
// because a submission history is per-account, whereas `user.info` takes up to
// 10,000 handles at once. A few hundred handles is three requests, not three
// hundred, which is why this job has no cursor and no outage breaker — there is
// not enough work in a run for either to pay for itself.
// ---------------------------------------------------------------------------

/**
 * Handles per `user.info` call. Far below the documented 10,000 ceiling: the
 * whole list travels in the query string, and a smaller chunk also means less to
 * re-probe when one dead handle poisons a call (see `resolveChunk`).
 */
const CHUNK_SIZE = 100;
/** Wall-clock ceiling, matching the solve sync's. Never reached at this size. */
const TIME_BUDGET_MS = 600_000;
/**
 * Retries of a chunk Codeforces failed to answer.
 *
 * The 15-minute syncs have no retry — the next tick is the retry. This one runs
 * once a day, so a blip that lasts two seconds would otherwise leave a hundred
 * handles unchecked for twenty-four hours.
 */
const CHUNK_RETRIES = 1;
const RETRY_DELAY_MS = 5_000;

/** A handle Codeforces says does not exist, with enough context to act on it. */
export type InvalidHandle = {
  handleId: number;
  handle: string;
  userId: number;
  userName: string;
  userEmail: string;
};

/** A rename that could not be written because another row already holds it. */
export type RenameConflict = {
  from: string;
  to: string;
  userId: number;
  userName: string;
  /** The user whose row already holds `to`, when it is one of ours. */
  heldBy: string | null;
};

export type CfRatingSummary = {
  /** Codeforces handle rows in the table. */
  handles: number;
  /** Handles Codeforces actually answered for. */
  checked: number;
  ratingsUpdated: number;
  /** Handles pointing at a renamed account, now rewritten. */
  handlesRenamed: number;
  /** Handles that only differed from Codeforces' canonical form in case. */
  handlesRecased: number;
  invalid: InvalidHandle[];
  renameConflicts: RenameConflict[];
  /** Chunks Codeforces never answered, so their handles went unchecked. */
  chunksFailed: number;
  errorReasons: ErrorTally;
  stoppedReason: StopReason;
};

export type CfRatingOptions = {
  fetcher?: typeof fetch;
  /** Seconds since the epoch; injectable so tests are not clock-dependent. */
  now?: number;
  chunkSize?: number;
  requestDelayMs?: number;
  timeBudgetMs?: number;
  retryDelayMs?: number;
};

export const CF_HANDLES_SQL = `
  SELECT h.id, h.user_id, h.handle, u.max_cf_rating, u.name, u.email
  FROM user_handles h
  JOIN users u ON u.id = h.user_id
  WHERE h.type = 'codeforces'
  ORDER BY h.id
`;

/**
 * Deliberately does not touch `users.updated_at`: that column means "a person
 * edited this profile", and bumping every row nightly would erase the meaning.
 */
export const RATING_UPDATE_SQL = `UPDATE users SET max_cf_rating = ? WHERE id = ?`;

/** A case-only correction. Nothing was broken, so the sync cursor is left alone. */
export const HANDLE_RECASE_SQL = `
  UPDATE user_handles SET handle = ?, updated_at = ? WHERE id = ?
`;

/**
 * A real rename. The cursor is cleared as well as the handle: this row has been
 * failing `user.status` ever since the rename, so its solve counts are stale and
 * its `last_sync_error` now names a cause that no longer exists. A null cursor
 * puts it at the front of the solve sync's queue instead of behind the two-hour
 * freshness window.
 */
export const HANDLE_RENAME_SQL = `
  UPDATE user_handles
  SET handle = ?, updated_at = ?, last_synced_at = NULL, last_sync_error = NULL
  WHERE id = ?
`;

type HandleRow = {
  id: number;
  user_id: number;
  handle: string;
  max_cf_rating: number | null;
  name: string;
  email: string;
};

type Pairing = { row: HandleRow; user: ResolvedCodeforcesUser };
type ChunkResult = { resolved: Pairing[]; invalid: HandleRow[] };

const toInvalidHandle = (row: HandleRow): InvalidHandle => ({
  handleId: row.id,
  handle: row.handle,
  userId: row.user_id,
  userName: row.name,
  userEmail: row.email,
});

const isUniqueViolation = (cause: unknown): boolean =>
  cause instanceof Error && /unique constraint/i.test(cause.message);

/**
 * Pair each requested row with the account Codeforces returned for it.
 *
 * Codeforces answers in request order — verified against the live API — but a
 * rating written against the wrong user is silent corruption, so position is
 * only trusted where nothing else can be. Handles that came back unchanged,
 * which is every handle that was not renamed and so very nearly all of them, are
 * matched by name and stay correct even if that ordering ever changes. Only the
 * renamed remainder falls back to position, and both sides are still in request
 * order there.
 */
export const pairResults = (rows: HandleRow[], users: ResolvedCodeforcesUser[]): Pairing[] => {
  const byHandle = new Map<string, ResolvedCodeforcesUser>();
  for (const user of users) byHandle.set(user.handle.toLowerCase(), user);

  const paired: Pairing[] = [];
  const unmatched: HandleRow[] = [];
  const claimed = new Set<ResolvedCodeforcesUser>();

  for (const row of rows) {
    const user = byHandle.get(row.handle.toLowerCase());
    if (user && !claimed.has(user)) {
      claimed.add(user);
      paired.push({ row, user });
    } else {
      unmatched.push(row);
    }
  }

  const leftovers = users.filter((user) => !claimed.has(user));
  unmatched.forEach((row, index) => {
    const user = leftovers[index];
    if (user) paired.push({ row, user });
  });

  return paired;
};

/**
 * Resolve one chunk, isolating any dead handles inside it.
 *
 * Codeforces fails the whole call if a single handle is unknown, so a chunk that
 * throws `invalid-handle` says nothing about which handle is to blame. Halving
 * costs about 2k·log₂(n) calls for k bad handles — a dozen requests for a chunk
 * of a hundred, against a hundred for asking one at a time.
 *
 * Only `invalid-handle` splits. Everything else is the judge's fault and applies
 * to the whole chunk equally, so it propagates rather than fanning out.
 */
export const resolveChunk = async (
  rows: HandleRow[],
  fetcher: typeof fetch,
): Promise<ChunkResult> => {
  if (rows.length === 0) return { resolved: [], invalid: [] };

  try {
    const users = await getCodeforcesUsers(
      rows.map((row) => row.handle),
      fetcher,
    );
    return { resolved: pairResults(rows, users), invalid: [] };
  } catch (cause) {
    if (!(cause instanceof CodeforcesApiError) || cause.kind !== "invalid-handle") throw cause;
    if (rows.length === 1) return { resolved: [], invalid: rows };

    // Sequential, not parallel: `throttle` shares one timestamp across calls, so
    // two in flight at once would both wait and then fire together.
    const middle = Math.floor(rows.length / 2);
    const left = await resolveChunk(rows.slice(0, middle), fetcher);
    const right = await resolveChunk(rows.slice(middle), fetcher);
    return {
      resolved: [...left.resolved, ...right.resolved],
      invalid: [...left.invalid, ...right.invalid],
    };
  }
};

export const runCfRatingSync = async (
  d1: D1Database,
  options: CfRatingOptions = {},
): Promise<CfRatingSummary> => {
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const chunkSize = options.chunkSize ?? CHUNK_SIZE;
  const timeBudgetMs = options.timeBudgetMs ?? TIME_BUDGET_MS;
  const retryDelayMs = options.retryDelayMs ?? RETRY_DELAY_MS;
  const fetcher = throttle(
    options.fetcher ?? fetch,
    // One source of truth for how hard this codebase leans on Codeforces.
    options.requestDelayMs ?? codeforcesPlatform.requestDelayMs,
  );
  const startedAt = Date.now();

  const summary: CfRatingSummary = {
    handles: 0,
    checked: 0,
    ratingsUpdated: 0,
    handlesRenamed: 0,
    handlesRecased: 0,
    invalid: [],
    renameConflicts: [],
    chunksFailed: 0,
    errorReasons: {},
    stoppedReason: null,
  };

  const handleRows = await d1.prepare(CF_HANDLES_SQL).all<HandleRow>();
  const rows = handleRows.results ?? [];
  summary.handles = rows.length;
  if (rows.length === 0) return summary;

  /** One chunk, retried while the failure still looks like a passing blip. */
  const attempt = async (chunk: HandleRow[]): Promise<ChunkResult> => {
    for (let tries = 0; ; tries += 1) {
      try {
        return await resolveChunk(chunk, fetcher);
      } catch (cause) {
        const retryable = cause instanceof CodeforcesApiError && cause.kind === "unavailable";
        if (!retryable || tries >= CHUNK_RETRIES) throw cause;
        await sleep(retryDelayMs);
      }
    }
  };

  const ratingUpdates: D1PreparedStatement[] = [];
  const renames: Array<{ row: HandleRow; canonical: string }> = [];

  for (let start = 0; start < rows.length; start += chunkSize) {
    if (Date.now() - startedAt > timeBudgetMs) {
      summary.stoppedReason = "time-budget";
      break;
    }

    let result: ChunkResult;
    try {
      result = await attempt(rows.slice(start, start + chunkSize));
    } catch (cause) {
      if (cause instanceof CodeforcesApiError && cause.kind === "call-limit") {
        // Every later chunk would be refused the same way.
        summary.stoppedReason = "rate-limit";
        break;
      }
      // One chunk's handles go unchecked until tomorrow; the rest are still
      // worth reading, so the run continues rather than giving up on all of them.
      summary.chunksFailed += 1;
      tallyError(summary.errorReasons, cause instanceof Error ? cause.message : String(cause));
      continue;
    }

    summary.checked += result.resolved.length;
    summary.invalid.push(...result.invalid.map(toInvalidHandle));

    for (const { row, user } of result.resolved) {
      if (user.maxRating !== row.max_cf_rating) {
        ratingUpdates.push(d1.prepare(RATING_UPDATE_SQL).bind(user.maxRating, row.user_id));
      }
      if (user.handle !== row.handle) {
        renames.push({ row, canonical: user.handle });
      }
    }
  }

  // Chunked for the same reason the solve sync chunks: bounds how much trigger
  // cascade one statement batch can set off against D1's 30s query limit.
  for (let start = 0; start < ratingUpdates.length; start += WRITE_CHUNK_SIZE) {
    const batch = ratingUpdates.slice(start, start + WRITE_CHUNK_SIZE);
    await d1.batch(batch);
    summary.ratingsUpdated += batch.length;
  }

  // One statement each, never batched: a rename can collide with a stale row
  // held by someone else, and inside a batch that single conflict would roll
  // back every other rename with it.
  for (const { row, canonical } of renames) {
    const renamed = row.handle.toLowerCase() !== canonical.toLowerCase();
    const sql = renamed ? HANDLE_RENAME_SQL : HANDLE_RECASE_SQL;
    try {
      await d1.prepare(sql).bind(canonical, now, row.id).run();
      if (renamed) summary.handlesRenamed += 1;
      else summary.handlesRecased += 1;
    } catch (cause) {
      // unique(type, handle COLLATE NOCASE): two rows now point at one account.
      // Reported rather than thrown — every other handle's work is already done
      // and correct. Anything else is D1 failing, which is a crashed run.
      if (!isUniqueViolation(cause)) throw cause;
      const holder = rows.find(
        (other) => other.id !== row.id && other.handle.toLowerCase() === canonical.toLowerCase(),
      );
      summary.renameConflicts.push({
        from: row.handle,
        to: canonical,
        userId: row.user_id,
        userName: row.name,
        heldBy: holder ? `${holder.name} <${holder.email}>` : null,
      });
    }
  }

  return summary;
};
