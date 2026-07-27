import { isoish, type Notice } from "../lib/notify";
import type { CfRatingSummary } from "./cf-rating";
import type { ErrorTally, StopReason } from "./runner";
import { LIVENESS_WINDOW_SECONDS, livenessIsMeaningful, type Liveness } from "./runs";

// ---------------------------------------------------------------------------
// Which sync outcomes are worth waking the super admin for.
//
// Kept pure and separate from both the runners and the mail layer: the runners
// stay testable without an env, and the rule for "is this bad enough to send"
// lives in one readable place instead of scattered across three loops.
//
// The bar is deliberately high. Two things qualify: the numbers are silently
// wrong, or the sync has stopped working. Individual failures do not — those
// are recorded per row in `last_sync_error` and summarised in the daily digest.
// ---------------------------------------------------------------------------

/**
 * Below this many units of work, an error ratio means nothing — one failure out
 * of two is 50% and is usually just one dead handle.
 *
 * Must stay ≤ `OUTAGE_STREAK` in runner.ts: a run the outage breaker cut short
 * has processed exactly that many units, all of them failed, and if that did not
 * clear this bar an outage would stop the sync without mailing anyone.
 */
const MIN_SAMPLE = 5;
/** Above this share of a batch failing, assume the judge broke rather than the data. */
const ERROR_RATE_THRESHOLD = 1 / 3;
/** Truncated handles listed in the mail before it starts saying "and N more". */
const MAX_LISTED = 20;

export type RunOutcome = {
  /** "codeforces" | "atcoder" | "vjudge" — also the notice key prefix. */
  platform: string;
  /** What the platform counts: handles for two of them, contests for VJudge. */
  unit: "handle" | "contest";
  processed: number;
  errors: number;
  stoppedReason: StopReason;
  /** Handles whose history hit the judge's paging cap. Empty for VJudge. */
  truncated?: string[];
  /** What the failures said, counted per distinct message (see `tallyError`). */
  errorReasons?: ErrorTally;
};

const list = (values: string[]): string => {
  const shown = values.slice(0, MAX_LISTED).join(", ");
  return values.length > MAX_LISTED ? `${shown}, and ${values.length - MAX_LISTED} more` : shown;
};

/** Same truncation as `list`, one entry per line — for rows too wide to comma-join. */
const block = (values: string[]): string => {
  const lines = values.slice(0, MAX_LISTED).map((value) => `  ${value}`);
  if (values.length > MAX_LISTED) lines.push(`  ...and ${values.length - MAX_LISTED} more`);
  return lines.join("\n");
};

/**
 * The failure messages as an indented block, commonest first — the part of the
 * mail that says *why*, rather than pointing at a column that a later successful
 * sync will have cleared by the time it is read.
 */
const reasonBlock = (tally: ErrorTally | undefined): string => {
  const entries = Object.entries(tally ?? {}).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return "";
  const lines = entries.map(([reason, count]) => `  ${count}× ${reason}`).join("\n");
  return `Reasons:\n${lines}\n\n`;
};

/**
 * The faults in one run, in descending order of how wrong things are.
 * An empty array is the normal, healthy result.
 */
export const collectFaults = (outcome: RunOutcome): Notice[] => {
  const { platform, unit, processed, errors, stoppedReason } = outcome;
  const truncated = outcome.truncated ?? [];
  const faults: Notice[] = [];

  // 1. Silently wrong numbers. The worst kind: the sync reports success and
  //    writes counts that are too low, and nothing else would ever show it.
  if (truncated.length > 0) {
    faults.push({
      key: `${platform}:paging-truncated`,
      subject: `[DIU ACM] ${platform} sync is dropping submissions`,
      detail:
        `${truncated.length} ${platform} handle(s) hit the API's paging cap, so part of their ` +
        `submission history was never read. Their solve/upsolve counts are too low, and will ` +
        `stay too low until the cap is raised.\n\n` +
        `Handles: ${list(truncated)}\n\n` +
        `Fix: raise MAX_PAGES in src/lib/${platform}.ts, or narrow the sync window by locking ` +
        `older ranklists so the earliest in-scope contest is more recent.`,
    });
  }

  // 2. The judge is refusing us. Nothing syncs until it stops, and for VJudge
  //    this is also how a Cloudflare bot challenge shows up.
  if (stoppedReason === "rate-limit") {
    faults.push({
      key: `${platform}:blocked`,
      subject: `[DIU ACM] ${platform} sync is being rate-limited`,
      detail:
        `The ${platform} sync stopped early because the judge refused a request (rate limit, ` +
        `or for VJudge a Cloudflare bot challenge). It got through ${processed} ${unit}(s) ` +
        `before backing off.\n\n` +
        `Until this clears, ${platform} performance counts stop updating. If it persists, the ` +
        `request spacing in src/sync/${platform}.ts is too aggressive, or the caller is being ` +
        `blocked outright.`,
    });
  }

  // 3. Most of the batch failing means the API changed shape or went down —
  //    a handful of dead handles is normal and deliberately excluded.
  if (processed >= MIN_SAMPLE && errors / processed > ERROR_RATE_THRESHOLD) {
    const percent = Math.round((errors / processed) * 100);
    // The breaker aborts after a short run of judge-side failures, so the counts
    // here are small by design. Saying so keeps "5 of 5" from reading as a
    // rounding error, and says the rest of the batch was not thrown away.
    const aborted =
      stoppedReason === "judge-down"
        ? `\n\nThe run was stopped after ${processed} consecutive failures rather than spending ` +
          `the whole batch on a judge that is not answering. The untouched ${unit}s keep their ` +
          `cursor and are retried on the next tick, not in two hours.`
        : "";
    faults.push({
      key: `${platform}:error-rate`,
      subject: `[DIU ACM] ${platform} sync is failing on most ${unit}s`,
      detail:
        `${errors} of ${processed} ${unit}(s) failed in the last ${platform} run (${percent}%). ` +
        `A few failures are normal — a deleted account, a hidden contest — but this many at once ` +
        `usually means the API changed or is down.\n\n` +
        reasonBlock(outcome.errorReasons) +
        `Which ${unit}s: ${unit === "handle" ? "user_handles.last_sync_error" : "event_sync_state.last_sync_error"}, ` +
        `until the next successful sync clears them (~2h).` +
        aborted,
    });
  }

  return faults;
};

// ---------------------------------------------------------------------------
// The daily rating refresh (see cf-rating.ts) needs its own rules rather than
// `collectFaults`. Its unit of work is a chunk of a hundred handles, so a whole
// run is three units — far under `MIN_SAMPLE`, which makes the error-rate test
// meaningless — and it never pages, so `paging-truncated` can never fire.
//
// What it does have is a fault the syncs do not: a handle that no longer exists.
// That is a data problem, not an outage. It is reported and nothing else, per
// the deliberate rule that a Codeforces failure misread as `invalid-handle` must
// never be able to delete anything.
//
// The `codeforces-rating:` prefix keeps these keys distinct from the solve
// sync's `codeforces:` ones, so their cooldowns never suppress each other.
// ---------------------------------------------------------------------------

export const collectCfRatingFaults = (summary: CfRatingSummary): Notice[] => {
  const faults: Notice[] = [];

  if (summary.invalid.length > 0) {
    const entries = summary.invalid.map(
      (row) => `${row.handle} — ${row.userName} <${row.userEmail}> (user ${row.userId})`,
    );
    faults.push({
      key: "codeforces-rating:invalid-handles",
      subject: `[DIU ACM] ${summary.invalid.length} Codeforces handle(s) no longer exist`,
      detail:
        `Codeforces does not recognise these handles, not even as historic ones, so the ` +
        `accounts were deleted or the handles were entered wrong:\n\n` +
        `${block(entries)}\n\n` +
        `Nothing was changed — the handles and their ratings are stored exactly as they were, ` +
        `because a Codeforces outage misread as a bad handle must never be able to unlink a ` +
        `real account. Check one at https://codeforces.com/profile/<handle> and fix or remove ` +
        `it from Admin → Users → Handles.\n\n` +
        `These handles also fail the solve sync, which cannot resolve historic handles at all, ` +
        `so their solve and upsolve counts are frozen until this is fixed.`,
    });
  }

  if (summary.renameConflicts.length > 0) {
    const entries = summary.renameConflicts.map(
      (conflict) =>
        `${conflict.from} → ${conflict.to} (${conflict.userName}, user ${conflict.userId})` +
        (conflict.heldBy ? `, already held by ${conflict.heldBy}` : ""),
    );
    faults.push({
      key: "codeforces-rating:rename-conflict",
      subject: `[DIU ACM] Codeforces rename could not be applied`,
      detail:
        `These handles were renamed on Codeforces, but the new handle is already stored ` +
        `against another row, so the update was refused by unique(type, handle):\n\n` +
        `${block(entries)}\n\n` +
        `Two of our rows now point at one Codeforces account. Usually the other row is stale — ` +
        `a member who left, or a handle typed in before it was claimed. Remove whichever is ` +
        `wrong in Admin → Users → Handles and the rename lands on the next run.\n\n` +
        `Until then the stale row keeps winning and the renamed member's solve counts stay frozen.`,
    });
  }

  if (summary.chunksFailed > 0 || summary.stoppedReason !== null) {
    const unchecked = summary.handles - summary.checked - summary.invalid.length;
    const why =
      summary.stoppedReason === "rate-limit"
        ? `The run stopped early: Codeforces refused a request with its call limit.`
        : summary.stoppedReason === "time-budget"
          ? `The run stopped early: it ran out of its wall-clock budget.`
          : `${summary.chunksFailed} batch(es) went unanswered.`;
    faults.push({
      key: "codeforces-rating:unreachable",
      subject: `[DIU ACM] Codeforces rating refresh could not check every handle`,
      detail:
        `${why} ${unchecked} of ${summary.handles} handle(s) were not checked on this run.\n\n` +
        reasonBlock(summary.errorReasons) +
        `Their ratings keep yesterday's values, which is harmless for a day. What is not ` +
        `carried over is the missing-handle report: any dead handle among the unchecked ones ` +
        `has not been found yet, so treat the list in any accompanying alert as partial.\n\n` +
        `The next run is in 24 hours. If this repeats, Codeforces is rejecting us rather than ` +
        `having a bad minute.`,
    });
  }

  return faults;
};

// ---------------------------------------------------------------------------
// Liveness — the one fault that is not derived from a run at all.
//
// Every notice above needs a run to have happened and reported something. The
// failure none of them can see is a cron that stopped firing: no summary, no
// error, no log line, and a digest that cheerfully reports "0 failing" because
// nothing failed — nothing ran. This reads the run ledger (runs.ts) and alerts
// on ticks that never arrived.
// ---------------------------------------------------------------------------

/**
 * Share of a day's expected ticks that must be present for a job to count as
 * alive. Cloudflare does not guarantee every scheduled invocation, so a couple
 * of skipped ticks are normal and must not page anyone; at 96 ticks a day this
 * still trips after about five hours of silence.
 */
const MIN_TICK_RATIO = 0.8;

export const collectLivenessFaults = (liveness: Liveness, now: number): Notice[] => {
  if (!livenessIsMeaningful(liveness, now)) return [];

  const faults: Notice[] = [];
  const windowHours = Math.round(LIVENESS_WINDOW_SECONDS / 3600);

  for (const job of liveness.jobs) {
    // An expression whose daily count cannot be derived (see `firesPerDay`).
    if (job.expected === null) continue;
    if (job.observed >= Math.floor(job.expected * MIN_TICK_RATIO)) continue;

    const silent = job.observed === 0;
    const lastSeen =
      job.lastRunAt === null
        ? "It has never run."
        : `It last ran ${isoish(job.lastRunAt)}.`;

    faults.push({
      key: `${job.job}:not-firing`,
      subject: silent
        ? `[DIU ACM] ${job.job} cron has stopped firing`
        : `[DIU ACM] ${job.job} cron is missing ticks`,
      detail:
        `The ${job.job} job ran ${job.observed} time(s) in the last ${windowHours}h, against ` +
        `${job.expected} expected for a full day on "${job.cron}". ${lastSeen}\n\n` +
        (silent
          ? `Nothing this job maintains is being updated at all. This is not a failing run — ` +
            `there are no runs, which is why no other alert can see it.\n\n` +
            `Check that "${job.cron}" is still listed under triggers.crons in wrangler.jsonc ` +
            `and survived the last deploy, and that the expression there matches the one in ` +
            `src/sync/schedule.ts — the dispatcher looks the job up by its exact string, so a ` +
            `changed expression fires an invocation that matches no handler.`
          : `Cloudflare does not guarantee every scheduled invocation, so a few gaps are ` +
            `normal — this many is not. If it keeps up, the job is either overrunning its ` +
            `window or the trigger is being dropped.`),
    });
  }

  return faults;
};

/** A run that threw outright, so no summary exists to inspect. */
export const runFailedFault = (platform: string, cause: unknown): Notice => ({
  key: `${platform}:run-failed`,
  subject: `[DIU ACM] ${platform} sync crashed`,
  detail:
    `The ${platform} sync threw before it could finish, so nothing was synced on this tick.\n\n` +
    `${cause instanceof Error ? `${cause.message}\n\n${cause.stack ?? ""}` : String(cause)}`,
});
