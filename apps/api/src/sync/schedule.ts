// ---------------------------------------------------------------------------
// The schedule itself: which jobs exist and how often each is meant to fire.
//
// Split out of index.ts so both the dispatcher and the liveness check can read
// it without importing each other. `firesPerDay` derives the expected tick count
// from the same expression wrangler.jsonc registers, so changing a cadence there
// and here cannot leave the monitoring measuring the old one.
// ---------------------------------------------------------------------------

export const CODEFORCES_CRON = "*/15 * * * *";
/** :05, :20, :35, :50 — offset from Codeforces to avoid overlapping writes. */
export const ATCODER_CRON = "5,20,35,50 * * * *";
/** :10, :25, :40, :55 — the third slot in the 5-minute stagger. */
export const VJUDGE_CRON = "10,25,40,55 * * * *";
/** 01:12 UTC (07:12 Dhaka), on a minute no sync uses. */
export const DIGEST_CRON = "12 1 * * *";
/**
 * 00:42 UTC (06:42 Dhaka) — the daily rating and handle refresh (cf-rating.ts).
 * Half an hour ahead of the digest, so anything it raises is already in
 * `admin_notices` when the digest reports the last 24 hours. Minute 42 belongs
 * to none of the three sync staggers.
 */
export const CF_RATING_CRON = "42 0 * * *";

/**
 * Every job, by the name it records runs and raises faults under. The single
 * source of truth for both the dispatch table in index.ts and the set of jobs
 * the liveness check expects to see ticking.
 */
export const JOB_CRONS = {
  codeforces: CODEFORCES_CRON,
  atcoder: ATCODER_CRON,
  vjudge: VJUDGE_CRON,
  "codeforces-rating": CF_RATING_CRON,
  digest: DIGEST_CRON,
} as const;

export type JobName = keyof typeof JOB_CRONS;

export const JOB_NAMES = Object.keys(JOB_CRONS) as JobName[];

/**
 * The distinct values one cron field takes, or null if it uses syntax this does
 * not handle. Supports `*`, `a`, `a-b`, and a `/step` on any of them — which
 * covers every expression in wrangler.jsonc.
 */
const expandField = (field: string, min: number, max: number): number[] | null => {
  const values = new Set<number>();

  for (const part of field.split(",")) {
    const [range, rawStep, ...rest] = part.split("/");
    if (rest.length > 0) return null;

    const step = rawStep === undefined ? 1 : Number(rawStep);
    if (!Number.isInteger(step) || step < 1) return null;

    let from: number;
    let to: number;
    if (range === "*") {
      from = min;
      to = max;
    } else if (range.includes("-")) {
      const [start, end] = range.split("-").map(Number);
      from = start;
      to = end;
    } else {
      from = Number(range);
      to = from;
    }

    if (!Number.isInteger(from) || !Number.isInteger(to)) return null;
    if (from < min || to > max || from > to) return null;
    for (let value = from; value <= to; value += step) values.add(value);
  }

  return values.size > 0 ? [...values] : null;
};

/**
 * How many times an expression fires in a day, or null when that cannot be
 * answered from the expression alone.
 *
 * A day-of-month, month, or day-of-week restriction makes the answer depend on
 * the calendar. None of our crons use one, and a guess would be worse than no
 * check at all — a wrong expectation means either a daily false alarm or a dead
 * job that never trips the threshold. So those return null and the liveness
 * check skips the job rather than measuring it against a number it invented.
 */
export const firesPerDay = (cron: string): number | null => {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) return null;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;
  if (dayOfMonth !== "*" || month !== "*" || dayOfWeek !== "*") return null;

  const minutes = expandField(minute, 0, 59);
  const hours = expandField(hour, 0, 23);
  if (!minutes || !hours) return null;

  return minutes.length * hours.length;
};
