import { isoish, type Notice } from "../lib/notify";

// ---------------------------------------------------------------------------
// Persistent upstream backoff.
//
// Every scheduled invocation gets a fresh isolate and the Codeforces solve and
// rating jobs are separate cron entries. A module-level timer therefore cannot
// stop the next job from hitting the same call limit. This tiny D1 row is the
// shared circuit breaker both jobs consult.
// ---------------------------------------------------------------------------

export const CODEFORCES_UPSTREAM = "codeforces";

const BACKOFF_DELAYS_SECONDS = [30 * 60, 60 * 60, 2 * 60 * 60, 4 * 60 * 60] as const;
const MAX_BACKOFF_STEP = BACKOFF_DELAYS_SECONDS.length;

export type UpstreamBackoff = {
  upstream: string;
  blockedUntil: number;
  failures: number;
  lastError: string | null;
  updatedAt: number;
};

type BackoffRow = {
  upstream: string;
  blocked_until: number;
  failures: number;
  last_error: string | null;
  updated_at: number;
};

const toBackoff = (row: BackoffRow): UpstreamBackoff => ({
  upstream: row.upstream,
  blockedUntil: row.blocked_until,
  failures: row.failures,
  lastError: row.last_error,
  updatedAt: row.updated_at,
});

export const GET_BACKOFF_SQL = `
  SELECT upstream, blocked_until, failures, last_error, updated_at
  FROM upstream_backoffs
  WHERE upstream = ?
`;

/** Only returns a row while the circuit is actually open. */
export const getActiveBackoff = async (
  d1: D1Database,
  upstream: string,
  now: number,
): Promise<UpstreamBackoff | null> => {
  const row = await d1.prepare(GET_BACKOFF_SQL).bind(upstream).first<BackoffRow>();
  return row && row.blocked_until > now ? toBackoff(row) : null;
};

/**
 * Atomically advances 30m -> 1h -> 2h -> 4h, saturating at four hours.
 * Keeping the calculation in one statement prevents the solve and rating crons
 * from losing an increment if they happen to fail together.
 */
export const EXTEND_BACKOFF_SQL = `
  INSERT INTO upstream_backoffs (upstream, blocked_until, failures, last_error, updated_at)
  VALUES (?, ? + 1800, 1, ?, ?)
  ON CONFLICT (upstream) DO UPDATE SET
    failures = MIN(upstream_backoffs.failures + 1, ${MAX_BACKOFF_STEP}),
    blocked_until = ? + CASE MIN(upstream_backoffs.failures + 1, ${MAX_BACKOFF_STEP})
      WHEN 1 THEN 1800
      WHEN 2 THEN 3600
      WHEN 3 THEN 7200
      ELSE 14400
    END,
    last_error = excluded.last_error,
    updated_at = excluded.updated_at
  RETURNING upstream, blocked_until, failures, last_error, updated_at
`;

export const extendBackoff = async (
  d1: D1Database,
  upstream: string,
  now: number,
  error: string,
): Promise<UpstreamBackoff> => {
  const row = await d1
    .prepare(EXTEND_BACKOFF_SQL)
    .bind(upstream, now, error, now, now)
    .first<BackoffRow>();
  if (!row) throw new Error(`Failed to persist ${upstream} backoff`);
  return toBackoff(row);
};

export const clearBackoff = async (
  d1: D1Database,
  upstream: string,
): Promise<boolean> => {
  const result = await d1
    .prepare("DELETE FROM upstream_backoffs WHERE upstream = ?")
    .bind(upstream)
    .run();
  return (result.meta.changes ?? 0) > 0;
};

export const codeforcesBackoffNotice = (state: UpstreamBackoff): Notice => ({
  key: "codeforces:blocked",
  subject: "[DIU ACM] Codeforces API is rate-limiting sync",
  detail:
    `Codeforces refused an API request with "Call limit exceeded". The shared circuit ` +
    `breaker is now pausing both the solve and rating jobs until ${isoish(state.blockedUntil)} ` +
    `(backoff step ${state.failures}/${MAX_BACKOFF_STEP}).\n\n` +
    `Last error: ${state.lastError ?? "Codeforces call limit exceeded."}\n\n` +
    `No Codeforces requests will be made during this window. A successful request after it ` +
    `expires will close the incident and send one recovery message.`,
});

export const codeforcesBackoffSkippedNotice = (state: UpstreamBackoff): Notice => ({
  ...codeforcesBackoffNotice(state),
  detail:
    `The Codeforces circuit breaker is open until ${isoish(state.blockedUntil)}, so this ` +
    `scheduled run was skipped without contacting Codeforces.\n\n` +
    `Last error: ${state.lastError ?? "Codeforces call limit exceeded."}`,
});
