import type { Bindings } from "../types";
import { logError, logWarn } from "./log";

// ---------------------------------------------------------------------------
// Super-admin alerting.
//
// The syncs are unattended and mostly silent: a wrong count or a blocked judge
// looks exactly like a healthy system from the outside. These mails are the
// only way the admin finds out, so they are reserved for the two things that
// actually matter — the numbers are wrong, or the sync has stopped working —
// plus one daily digest so "no mail" can be trusted to mean "no news".
//
// The hard constraint is volume, and it has two halves. A fault that persists
// would mail on every one of the 290 daily ticks, so a given `key` only sends
// once per cooldown and the mail carries the count of what was suppressed in
// between. A fault that clears by itself would mail twice — once to say the
// judge refused us, once to say it stopped — for an incident nobody could have
// acted on, so a fault that declares itself transient must stay unbroken for a
// sustain window before the first mail goes out at all. Both are recorded
// either way: the ledger and the health page see everything, the mailbox only
// sees what someone has to do something about.
//
// Nothing here may break a sync: every failure path logs and returns.
// ---------------------------------------------------------------------------

/**
 * How long one fault stays quiet after its mail goes out.
 *
 * Six hours keeps a persistent upstream incident visible without turning a
 * quarter-hourly cron into an inbox flood. The first occurrence is immediate;
 * a successful run sends a separate recovery message and clears the incident.
 */
export const NOTICE_COOLDOWN_SECONDS = 6 * 60 * 60;

/**
 * The rule for a fault that is usually a blip.
 *
 * Upstream faults — a judge refusing a request, a batch of failing calls — are
 * overwhelmingly transient: the backoff opens, a tick or two is skipped, and the
 * next run succeeds. Mailing the first occurrence turns every one of those into
 * a pair of messages about an incident that fixed itself before it could be
 * read, which is how a real alert stops being read at all.
 *
 * A notice carrying this is recorded from its first occurrence but not mailed
 * until the incident has been open for `minSeconds`. Anything that clears sooner
 * is reported by the daily digest instead.
 */
export type Sustain = {
  /**
   * How long the fault may go unseen before the incident counts as closed.
   * Must be longer than the cadence of the job that raises it, so consecutive
   * ticks stay one incident, and shorter than the gap between real incidents,
   * so the next one starts its own clock rather than inheriting a stale one.
   */
  gapSeconds: number;
  /** How long the incident must stay open before the first mail. */
  minSeconds: number;
};

/**
 * For the sub-hourly syncs (every 15 minutes). Two hours is eight consecutive
 * failed ticks — well past the point where the Codeforces backoff would have
 * escalated to its longest step — and the judge blips seen in production have
 * run about half an hour.
 */
export const TRANSIENT_SUSTAIN: Sustain = { gapSeconds: 45 * 60, minSeconds: 2 * 60 * 60 };

/**
 * For the daily jobs. One bad day is not an incident; the same fault on the next
 * day's run is. The gap has to clear a day so two consecutive runs count as one
 * incident, without being so wide that a fault a fortnight later inherits it.
 */
export const DAILY_SUSTAIN: Sustain = { gapSeconds: 30 * 60 * 60, minSeconds: 20 * 60 * 60 };

export type Notice = {
  /** Stable and specific, one per distinct fault: "codeforces:paging-truncated". */
  key: string;
  subject: string;
  /** Plain text. The HTML part is derived from it, so keep it readable as-is. */
  detail: string;
  /**
   * Set on faults that usually fix themselves, to hold the first mail back until
   * the incident has lasted. Omitted means mail on the first occurrence, which
   * is right for anything that cannot clear on its own — wrong data, a dead
   * handle, a cron that has stopped firing.
   */
  sustain?: Sustain;
};

/**
 * Bumps the counter and reports what the cooldown says. `occurrences` counts
 * this one plus everything suppressed since the last mail, so the email can say
 * how long it has really been going on.
 */
export const NOTICE_RECORD_SQL = `
  INSERT INTO admin_notices (key, first_seen_at, last_seen_at, last_sent_at, occurrences, last_detail)
  VALUES (?, ?, ?, NULL, 1, ?)
  ON CONFLICT (key) DO UPDATE SET
    last_seen_at = excluded.last_seen_at,
    occurrences = admin_notices.occurrences + 1,
    last_detail = excluded.last_detail
  RETURNING first_seen_at, last_sent_at, occurrences
`;

/** Occurrences reset on send, so the next mail counts from this moment. */
export const NOTICE_SENT_SQL = `
  UPDATE admin_notices SET last_sent_at = ?, occurrences = 0 WHERE key = ?
`;

/**
 * Closes an incident whose fault has not recurred within its sustain gap.
 *
 * Deleting rather than flagging keeps the upsert above doing one job: with the
 * stale row gone, the next occurrence inserts a fresh incident with its own
 * `first_seen_at` and no `last_sent_at`. Without this, a fault that recurred
 * weekly would measure its sustain window from the first time it ever happened
 * and mail on sight — exactly what the window exists to prevent.
 *
 * The row is a cooldown ledger, not history: `cron_runs` keeps the runs that
 * raised it, so nothing observable is lost when one is dropped.
 */
export const NOTICE_EXPIRE_SQL = `
  DELETE FROM admin_notices WHERE key = ? AND ? - last_seen_at > ?
`;

type NoticeRow = {
  first_seen_at: number;
  last_sent_at: number | null;
  occurrences: number;
};

/** "2027-03-04 09:15 UTC" — compact, unambiguous, and readable in a plain-text mail. */
export const isoish = (epochSeconds: number): string =>
  new Date(epochSeconds * 1000).toISOString().replace("T", " ").slice(0, 16) + " UTC";

/** Escapes the four characters that matter inside the <pre> body. */
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * One mail to the super admin. Returns false — rather than throwing — when the
 * sender is unconfigured or the service rejects it, because every caller is a
 * cron whose real job must finish regardless.
 */
export const sendMail = async (
  env: Bindings,
  message: { subject: string; text: string },
): Promise<boolean> => {
  // Widened deliberately: wrangler types vars as string literals, so reading
  // `env.ALERT_FROM_EMAIL` directly would narrow the empty default to `never`.
  const from: string = env.ALERT_FROM_EMAIL;
  const to: string = env.SUPER_ADMIN_EMAIL;

  if (!from || !to) {
    logWarn("alert.not_configured", { subject: message.subject });
    return false;
  }

  try {
    await env.EMAIL.send({
      to,
      from: { email: from, name: "DIU ACM sync" },
      subject: message.subject,
      text: message.text,
      html: `<pre style="font:14px/1.5 ui-monospace,monospace;white-space:pre-wrap">${escapeHtml(message.text)}</pre>`,
    });
    return true;
  } catch (cause) {
    // E_SENDER_NOT_VERIFIED until the domain is onboarded, which is the
    // expected state on a fresh deploy. Logged, never fatal.
    logError("alert.send_failed", cause, { subject: message.subject });
    return false;
  }
};

/**
 * Record a fault and mail it if its cooldown has expired.
 *
 * Recording happens even when sending is switched off, so `admin_notices` stays
 * a usable log of what has been going wrong.
 */
export const reportNotice = async (
  env: Bindings,
  d1: D1Database,
  notice: Notice,
  now: number,
  cooldownSeconds = NOTICE_COOLDOWN_SECONDS,
): Promise<"sent" | "pending" | "suppressed" | "undeliverable"> => {
  let row: NoticeRow | null;
  try {
    // Two statements rather than one conditional upsert: the alternative repeats
    // `now` and the gap across three CASE arms, and the only thing a concurrent
    // Codeforces tick can lose between them is one occurrence off a count in an
    // email that is not going out yet anyway.
    if (notice.sustain) {
      await d1
        .prepare(NOTICE_EXPIRE_SQL)
        .bind(notice.key, now, notice.sustain.gapSeconds)
        .run();
    }
    row = await d1
      .prepare(NOTICE_RECORD_SQL)
      .bind(notice.key, now, now, notice.detail)
      .first<NoticeRow>();
  } catch (cause) {
    logError("alert.notice_record_failed", cause, { noticeKey: notice.key });
    return "undeliverable";
  }

  const lastSentAt = row?.last_sent_at ?? null;
  const openedAt = row?.first_seen_at ?? now;

  // Still inside the sustain window, and nothing has been said about this
  // incident yet. Recorded, not mailed: if it clears here it was a blip, and the
  // digest reports it tomorrow alongside every other one.
  if (
    notice.sustain &&
    lastSentAt === null &&
    now - openedAt < notice.sustain.minSeconds
  ) {
    return "pending";
  }

  if (lastSentAt !== null && lastSentAt > now - cooldownSeconds) return "suppressed";

  const since = lastSentAt ?? openedAt;
  const occurrences = row?.occurrences ?? 1;
  const trailer =
    occurrences > 1
      ? `\n\nSeen ${occurrences} times since ${isoish(since)}. Further alerts for this are suppressed for ${Math.round(cooldownSeconds / 3600)}h.`
      : `\n\nFurther alerts for this are suppressed for ${Math.round(cooldownSeconds / 3600)}h.`;

  const sent = await sendMail(env, {
    subject: notice.subject,
    text: `${notice.detail}${trailer}`,
  });
  if (!sent) return "undeliverable";

  try {
    await d1.prepare(NOTICE_SENT_SQL).bind(now, notice.key).run();
  } catch (cause) {
    logError("alert.notice_stamp_failed", cause, { noticeKey: notice.key });
  }
  return "sent";
};

/**
 * Close an open incident after a real successful probe.
 *
 * The recovery mail is only sent for an incident that was announced. An "all
 * clear" for something nobody was told about is pure noise, and it is the
 * commoner case by far: most upstream faults never outlast their sustain window,
 * so most of what this closes was only ever a row in the ledger.
 */
export const resolveNotice = async (
  env: Bindings,
  d1: D1Database,
  recovery: { key: string; subject: string; detail: string },
): Promise<"absent" | "unannounced" | "resolved" | "undeliverable"> => {
  let row: { first_seen_at: number; last_seen_at: number; last_sent_at: number | null } | null;
  try {
    row = await d1
      .prepare("SELECT first_seen_at, last_seen_at, last_sent_at FROM admin_notices WHERE key = ?")
      .bind(recovery.key)
      .first<{ first_seen_at: number; last_seen_at: number; last_sent_at: number | null }>();
  } catch (cause) {
    logError("alert.recovery_read_failed", cause, { noticeKey: recovery.key });
    return "undeliverable";
  }
  if (!row) return "absent";

  if (row.last_sent_at === null) {
    try {
      await d1.prepare("DELETE FROM admin_notices WHERE key = ?").bind(recovery.key).run();
    } catch (cause) {
      logError("alert.recovery_clear_failed", cause, { noticeKey: recovery.key });
      return "undeliverable";
    }
    return "unannounced";
  }

  const sent = await sendMail(env, {
    subject: recovery.subject,
    text:
      `${recovery.detail}\n\nIncident opened ${isoish(row.first_seen_at)} and was last seen ` +
      `${isoish(row.last_seen_at)}.`,
  });
  if (!sent) return "undeliverable";

  try {
    await d1.prepare("DELETE FROM admin_notices WHERE key = ?").bind(recovery.key).run();
  } catch (cause) {
    logError("alert.recovery_clear_failed", cause, { noticeKey: recovery.key });
    return "undeliverable";
  }
  return "resolved";
};
