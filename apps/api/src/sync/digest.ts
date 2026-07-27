import { sendMail } from "../lib/notify";
import type { Bindings } from "../types";

// ---------------------------------------------------------------------------
// The daily health digest.
//
// Alerts only fire when something is wrong, which leaves one question they can
// never answer: is the system quiet because it is healthy, or because it is
// dead? One mail a day, sent unconditionally, is what makes silence readable.
//
// Everything here is a read. If a query fails the mail still goes out with the
// rest, because a partial digest beats no digest.
// ---------------------------------------------------------------------------

/** Rows listed per problem section before the digest starts counting instead. */
const MAX_LISTED = 10;
const DAY_SECONDS = 24 * 60 * 60;

export const HANDLE_STATS_SQL = `
  SELECT type,
         COUNT(*) AS total,
         SUM(CASE WHEN last_sync_error IS NOT NULL THEN 1 ELSE 0 END) AS failing,
         SUM(CASE WHEN last_synced_at IS NULL THEN 1 ELSE 0 END) AS never_synced,
         MIN(COALESCE(last_synced_at, 0)) AS oldest_sync
  FROM user_handles
  GROUP BY type
  ORDER BY type
`;

export const CONTEST_STATS_SQL = `
  SELECT COUNT(*) AS total,
         SUM(CASE WHEN last_sync_error IS NOT NULL THEN 1 ELSE 0 END) AS failing,
         MIN(COALESCE(last_synced_at, 0)) AS oldest_sync
  FROM event_sync_state
`;

export const STUCK_CONTESTS_SQL = `
  SELECT s.event_id, e.event_link, s.last_sync_error
  FROM event_sync_state s
  JOIN events e ON e.id = s.event_id
  WHERE s.last_sync_error IS NOT NULL
  ORDER BY s.event_id
  LIMIT ?
`;

export const FAILING_HANDLES_SQL = `
  SELECT type, handle, last_sync_error
  FROM user_handles
  WHERE last_sync_error IS NOT NULL
  ORDER BY type, handle
  LIMIT ?
`;

export const WRITE_ACTIVITY_SQL = `
  SELECT COUNT(*) AS rows_updated FROM event_performance WHERE updated_at >= ?
`;

/** Faults raised since the last digest, including ones the cooldown suppressed. */
export const RECENT_NOTICES_SQL = `
  SELECT key, occurrences, last_seen_at, last_detail
  FROM admin_notices
  WHERE last_seen_at >= ?
  ORDER BY last_seen_at DESC
`;

type HandleStat = {
  type: string;
  total: number;
  failing: number;
  never_synced: number;
  oldest_sync: number;
};
type ContestStat = { total: number; failing: number; oldest_sync: number };
type StuckContest = { event_id: number; event_link: string | null; last_sync_error: string };
type FailingHandle = { type: string; handle: string; last_sync_error: string };
type RecentNotice = { key: string; occurrences: number; last_seen_at: number; last_detail: string | null };

const ago = (epochSeconds: number, now: number): string => {
  if (!epochSeconds) return "never";
  const hours = (now - epochSeconds) / 3600;
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 48) return `${hours.toFixed(1)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

/**
 * The digest body. Split out from sending so a test can assert on the text
 * without an email binding.
 */
export const buildDigest = async (d1: D1Database, now: number): Promise<string> => {
  const since = now - DAY_SECONDS;

  const [handles, contests, stuck, failing, activity, notices] = await Promise.all([
    d1.prepare(HANDLE_STATS_SQL).all<HandleStat>(),
    d1.prepare(CONTEST_STATS_SQL).first<ContestStat>(),
    d1.prepare(STUCK_CONTESTS_SQL).bind(MAX_LISTED).all<StuckContest>(),
    d1.prepare(FAILING_HANDLES_SQL).bind(MAX_LISTED).all<FailingHandle>(),
    d1.prepare(WRITE_ACTIVITY_SQL).bind(since).first<{ rows_updated: number }>(),
    d1.prepare(RECENT_NOTICES_SQL).bind(since).all<RecentNotice>(),
  ]);

  const lines: string[] = [`DIU ACM sync digest — ${new Date(now * 1000).toISOString().slice(0, 16).replace("T", " ")} UTC`, ""];

  lines.push("HANDLES");
  const handleRows = handles.results ?? [];
  if (handleRows.length === 0) lines.push("  none registered");
  for (const row of handleRows) {
    const head = `  ${row.type.padEnd(11)} ${String(row.total).padStart(4)} total   `;
    // VJudge is synced per contest, so its handle cursor is never stamped.
    // Reporting "350 never synced" for it would read as a dead sync.
    lines.push(
      row.type === "vjudge"
        ? `${head}covered by the contest sync, no per-handle cursor`
        : `${head}${row.failing} failing, ${row.never_synced} never synced, ` +
          `oldest ${ago(row.oldest_sync, now)}`,
    );
  }

  lines.push("", "VJUDGE CONTESTS");
  lines.push(
    contests && contests.total > 0
      ? `  ${contests.total} tracked   ${contests.failing} failing, oldest ${ago(contests.oldest_sync, now)}`
      : "  none synced yet",
  );

  lines.push("", "ACTIVITY (24h)");
  lines.push(`  ${activity?.rows_updated ?? 0} event_performance rows written`);

  const noticeRows = notices.results ?? [];
  lines.push("", `ALERTS (24h): ${noticeRows.length === 0 ? "none" : noticeRows.length}`);
  for (const row of noticeRows) {
    lines.push(`  ${row.key} — ${row.occurrences} occurrence(s), last ${ago(row.last_seen_at, now)}`);
  }

  const stuckRows = stuck.results ?? [];
  if (stuckRows.length > 0) {
    lines.push("", "CONTESTS NEEDING ATTENTION");
    for (const row of stuckRows) {
      lines.push(`  event ${row.event_id} (${row.event_link ?? "no link"}) — ${row.last_sync_error}`);
    }
  }

  const failingRows = failing.results ?? [];
  if (failingRows.length > 0) {
    lines.push("", "HANDLES NEEDING ATTENTION");
    for (const row of failingRows) {
      lines.push(`  ${row.type}/${row.handle} — ${row.last_sync_error}`);
    }
  }

  const healthy =
    noticeRows.length === 0 &&
    stuckRows.length === 0 &&
    failingRows.length === 0 &&
    (activity?.rows_updated ?? 0) >= 0;
  lines.push("", healthy ? "No action needed." : "Sections above marked 'needing attention' are worth a look.");

  return lines.join("\n");
};

export const runDigest = async (env: Bindings, now = Math.floor(Date.now() / 1000)): Promise<void> => {
  const body = await buildDigest(env.DB, now);
  console.log("digest\n" + body);
  await sendMail(env, { subject: "[DIU ACM] Daily sync digest", text: body });
};
