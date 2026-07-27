import type { Bindings } from "../types";

// ---------------------------------------------------------------------------
// Super-admin alerting.
//
// The syncs are unattended and mostly silent: a wrong count or a blocked judge
// looks exactly like a healthy system from the outside. These mails are the
// only way the admin finds out, so they are reserved for the two things that
// actually matter — the numbers are wrong, or the sync has stopped working —
// plus one daily digest so "no mail" can be trusted to mean "no news".
//
// The hard constraint is volume. Four crons fire 289 times a day, so a fault
// that persists would mail on every tick. Every occurrence is recorded, but a
// given `key` only sends once per cooldown, and the mail carries the count of
// everything suppressed in between.
//
// Nothing here may break a sync: every failure path logs and returns.
// ---------------------------------------------------------------------------

/**
 * How long one fault stays quiet after its mail goes out.
 *
 * An hour, not a day: a day of silence is long enough for a transient outage to
 * start, alert, and fully recover unobserved, and the mail now carries the
 * failure reasons rather than pointing at a column the next successful sync
 * clears. The worst case is one mail an hour per distinct fault key while
 * something is genuinely broken, which is the point.
 */
export const NOTICE_COOLDOWN_SECONDS = 60 * 60;

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

const isoish = (epochSeconds: number): string =>
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
    console.warn(
      `Alert not sent (ALERT_FROM_EMAIL/SUPER_ADMIN_EMAIL unset): ${message.subject}`,
    );
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
    console.error(`Alert send failed: ${message.subject}`, cause);
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
    console.error(`Could not record notice ${notice.key}`, cause);
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
    console.error(`Could not stamp notice ${notice.key}`, cause);
  }
  return "sent";
};
