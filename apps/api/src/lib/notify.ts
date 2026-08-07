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
// The hard constraint is volume. Five crons fire 290 times a day, so a fault
// that persists would mail on every tick. Every occurrence is recorded, but a
// given `key` only sends once per cooldown, and the mail carries the count of
// everything suppressed in between.
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

export type Notice = {
  /** Stable and specific, one per distinct fault: "codeforces:paging-truncated". */
  key: string;
  subject: string;
  /** Plain text. The HTML part is derived from it, so keep it readable as-is. */
  detail: string;
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
): Promise<"sent" | "suppressed" | "undeliverable"> => {
  let row: NoticeRow | null;
  try {
    row = await d1
      .prepare(NOTICE_RECORD_SQL)
      .bind(notice.key, now, now, notice.detail)
      .first<NoticeRow>();
  } catch (cause) {
    logError("alert.notice_record_failed", cause, { noticeKey: notice.key });
    return "undeliverable";
  }

  const lastSentAt = row?.last_sent_at ?? null;
  if (lastSentAt !== null && lastSentAt > now - cooldownSeconds) return "suppressed";

  const since = lastSentAt ?? row?.first_seen_at ?? now;
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

/** Close an open incident after a real successful probe, with one recovery mail. */
export const resolveNotice = async (
  env: Bindings,
  d1: D1Database,
  recovery: { key: string; subject: string; detail: string },
): Promise<"absent" | "resolved" | "undeliverable"> => {
  let row: { first_seen_at: number; last_seen_at: number } | null;
  try {
    row = await d1
      .prepare("SELECT first_seen_at, last_seen_at FROM admin_notices WHERE key = ?")
      .bind(recovery.key)
      .first<{ first_seen_at: number; last_seen_at: number }>();
  } catch (cause) {
    logError("alert.recovery_read_failed", cause, { noticeKey: recovery.key });
    return "undeliverable";
  }
  if (!row) return "absent";

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
