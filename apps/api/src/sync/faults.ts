import type { Notice } from "../lib/notify";
import type { StopReason } from "./runner";

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
};

const list = (values: string[]): string => {
  const shown = values.slice(0, MAX_LISTED).join(", ");
  return values.length > MAX_LISTED ? `${shown}, and ${values.length - MAX_LISTED} more` : shown;
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
    faults.push({
      key: `${platform}:error-rate`,
      subject: `[DIU ACM] ${platform} sync is failing on most ${unit}s`,
      detail:
        `${errors} of ${processed} ${unit}(s) failed in the last ${platform} run (${percent}%). ` +
        `A few failures are normal — a deleted account, a hidden contest — but this many at once ` +
        `usually means the API changed or is down.\n\n` +
        `The per-row reasons are in ${unit === "handle" ? "user_handles.last_sync_error" : "event_sync_state.last_sync_error"}.`,
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
