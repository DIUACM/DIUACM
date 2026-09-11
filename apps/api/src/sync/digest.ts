import { logInfo } from "../lib/log";
import { sendMail, type Notice } from "../lib/notify";
import type { Bindings } from "../types";
import { collectLivenessFaults } from "./faults";
import { livenessIsMeaningful, loadLiveness, pruneRuns, type Liveness } from "./runs";

// ---------------------------------------------------------------------------
// The daily health digest.
//
// Alerts only fire when something is wrong, which leaves one question they can
// never answer: is the system quiet because it is healthy, or because it is
// dead? One mail a day, sent unconditionally, is what makes silence readable.
//
// It is also where the run ledger is checked (see runs.ts). Every other section
// here reports on runs that happened; the CRON section reports on ones that did
// not, which is the only failure the rest of the system cannot see.
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

/** Incidents still open, to say which of the faults below has not gone away. */
export const RECENT_NOTICES_SQL = `
  SELECT key, occurrences, last_seen_at, last_sent_at, last_detail
  FROM admin_notices
  WHERE last_seen_at >= ?
  ORDER BY last_seen_at DESC
`;

/**
 * Every fault raised in the window, from the run ledger rather than from
 * `admin_notices`.
 *
 * The notices table only holds incidents that are still open: a resolved one is
 * deleted, and most upstream faults now clear before they are ever mailed. Read
 * from there, this section would report almost nothing and the day's blips would
 * leave no trace anywhere a person looks. The ledger keeps every run that raised
 * a fault for a fortnight, so it can answer both "what broke" and "how often" —
 * which is the number that says whether a self-healing fault is still harmless.
 */
export const FAULT_RUNS_SQL = `
  SELECT started_at, faults
  FROM cron_runs
  WHERE started_at >= ? AND faults IS NOT NULL
  ORDER BY started_at
`;

/**
 * Faults this far apart are separate episodes. Matches the sustain gap in
 * notify.ts, so an episode here is one incident there.
 */
const EPISODE_GAP_SECONDS = 45 * 60;

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
type RecentNotice = {
  key: string;
  occurrences: number;
  last_seen_at: number;
  last_sent_at: number | null;
  last_detail: string | null;
};
type FaultRun = { started_at: number; faults: string };

/** One fault key's day: how many separate episodes, how long the worst ran. */
type Incident = {
  key: string;
  episodes: number;
  ticks: number;
  longestSeconds: number;
  lastSeenAt: number;
};

/**
 * Collapses the ledger rows into one line per fault key. A run of consecutive
 * ticks raising the same key is one episode; a gap longer than
 * `EPISODE_GAP_SECONDS` starts the next.
 */
export const collectIncidents = (rows: FaultRun[]): Incident[] => {
  const byKey = new Map<string, Incident & { openedAt: number; lastTickAt: number }>();

  for (const row of rows) {
    for (const key of row.faults.split(",").filter(Boolean)) {
      const seen = byKey.get(key);
      if (!seen) {
        byKey.set(key, {
          key,
          episodes: 1,
          ticks: 1,
          longestSeconds: 0,
          lastSeenAt: row.started_at,
          openedAt: row.started_at,
          lastTickAt: row.started_at,
        });
        continue;
      }
      if (row.started_at - seen.lastTickAt > EPISODE_GAP_SECONDS) {
        seen.episodes += 1;
        seen.openedAt = row.started_at;
      }
      seen.ticks += 1;
      seen.lastTickAt = row.started_at;
      seen.lastSeenAt = row.started_at;
      seen.longestSeconds = Math.max(seen.longestSeconds, row.started_at - seen.openedAt);
    }
  }

  return [...byKey.values()].sort((a, b) => b.ticks - a.ticks);
};

const ago = (epochSeconds: number, now: number): string => {
  if (!epochSeconds) return "never";
  const hours = (now - epochSeconds) / 3600;
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 48) return `${hours.toFixed(1)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

const span = (seconds: number): string =>
  seconds < 3600 ? `${Math.round(seconds / 60)}m` : `${(seconds / 3600).toFixed(1)}h`;

/**
 * The INCIDENTS section: what was raised in the last day, whether or not it was
 * mailed.
 *
 * Most of these never reach a mailbox — an upstream fault has to outlast its
 * sustain window before it is mailed at all (see notify.ts) — so this is the one
 * place a self-healing fault is written down for a person. Reading a count climb
 * here week on week is how a harmless blip is caught turning into a real one.
 */
const incidentLines = (
  incidents: Incident[],
  notices: RecentNotice[],
  now: number,
): string[] => {
  if (incidents.length === 0) return ["INCIDENTS (24h): none"];

  const open = new Map(
    notices
      .filter((notice) => notice.last_seen_at >= now - EPISODE_GAP_SECONDS)
      .map((notice) => [notice.key, notice]),
  );

  const lines = [`INCIDENTS (24h): ${incidents.length} fault(s) raised`];
  for (const incident of incidents) {
    const stillOpen = open.get(incident.key);
    const state = !stillOpen
      ? "cleared"
      : stillOpen.last_sent_at !== null
        ? "still open, alerted"
        : "still open, not yet alerted";
    lines.push(
      `  ${incident.key.padEnd(30)}${incident.episodes} episode(s), ${incident.ticks} tick(s), ` +
        `longest ${span(incident.longestSeconds)}, last ${ago(incident.lastSeenAt, now)} — ${state}`,
    );
  }
  return lines;
};

/**
 * The CRON section: expected ticks against recorded ones, every job listed
 * whether or not it is healthy. The faults raised alongside it (see
 * `collectLivenessFaults`) only cover the jobs that fall short, so this table is
 * what lets a reader confirm the others really are ticking rather than merely
 * not complaining.
 */
const livenessLines = (liveness: Liveness, now: number): string[] => {
  const lines = ["CRON"];

  if (!livenessIsMeaningful(liveness, now)) {
    lines.push("  not enough run history yet — this section starts reporting after a full day");
    return lines;
  }

  for (const job of liveness.jobs) {
    const head = `  ${job.job.padEnd(18)}`;
    const seen =
      job.expected === null
        ? `${job.observed} run(s), cadence not countable from "${job.cron}"`
        : `${job.observed}/${job.expected} ticks`;
    lines.push(`${head}${seen.padEnd(28)}last ${ago(job.lastRunAt ?? 0, now)}` +
      (job.lastStatus && job.lastStatus !== "ok" ? ` (${job.lastStatus})` : ""));
  }

  return lines;
};

/**
 * The digest body and the faults its liveness check raised. Split out from
 * sending so a test can assert on the text without an email binding.
 */
export const buildDigest = async (
  d1: D1Database,
  now: number,
): Promise<{ body: string; faults: Notice[] }> => {
  const since = now - DAY_SECONDS;

  const [handles, contests, stuck, failing, activity, notices, faultRuns, liveness] =
    await Promise.all([
      d1.prepare(HANDLE_STATS_SQL).all<HandleStat>(),
      d1.prepare(CONTEST_STATS_SQL).first<ContestStat>(),
      d1.prepare(STUCK_CONTESTS_SQL).bind(MAX_LISTED).all<StuckContest>(),
      d1.prepare(FAILING_HANDLES_SQL).bind(MAX_LISTED).all<FailingHandle>(),
      d1.prepare(WRITE_ACTIVITY_SQL).bind(since).first<{ rows_updated: number }>(),
      d1.prepare(RECENT_NOTICES_SQL).bind(since).all<RecentNotice>(),
      d1.prepare(FAULT_RUNS_SQL).bind(since).all<FaultRun>(),
      loadLiveness(d1, now),
    ]);

  const livenessFaults = collectLivenessFaults(liveness, now);

  const lines: string[] = [`DIU ACM sync digest — ${new Date(now * 1000).toISOString().slice(0, 16).replace("T", " ")} UTC`, ""];

  // First, deliberately: a job that is not running makes every count below it
  // meaningless, and the reader should know that before reading them.
  lines.push(...livenessLines(liveness, now), "");

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
  const incidents = collectIncidents(faultRuns.results ?? []);
  lines.push("", ...incidentLines(incidents, noticeRows, now));

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

  // Deliberately not "nothing went wrong today". A judge that refused a request
  // and was answering again twenty minutes later is reported above and changes
  // nothing about whether anyone should look, so only incidents still open when
  // the digest is written count against a clean bill of health.
  const openIncidents = noticeRows.filter(
    (notice) => notice.last_seen_at >= now - EPISODE_GAP_SECONDS,
  );
  const healthy =
    openIncidents.length === 0 &&
    stuckRows.length === 0 &&
    failingRows.length === 0 &&
    livenessFaults.length === 0 &&
    (activity?.rows_updated ?? 0) >= 0;
  lines.push(
    "",
    healthy
      ? "No action needed."
      : "Anything above still open, or marked 'needing attention', is worth a look.",
  );

  return { body: lines.join("\n"), faults: livenessFaults };
};

/**
 * Sends the digest and hands back whatever the liveness check found, for the
 * dispatcher to record and mail on its own cooldown.
 *
 * Those faults deliberately get their own alert rather than living only in the
 * digest section: a job that has stopped firing should not have to wait for
 * someone to read to the top of tomorrow's mail.
 */
export const runDigest = async (
  env: Bindings,
  now = Math.floor(Date.now() / 1000),
): Promise<{ faults: Notice[] }> => {
  const { body, faults } = await buildDigest(env.DB, now);
  logInfo("cron.digest_generated", { body });
  await sendMail(env, { subject: "[DIU ACM] Daily sync digest", text: body });
  // Once a day, on the job least likely to be starved of time, and after the
  // mail is away so a slow delete can never cost the digest itself.
  await pruneRuns(env.DB, now);
  return { faults };
};
