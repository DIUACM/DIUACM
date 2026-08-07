import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  NOTICE_COOLDOWN_SECONDS,
  reportNotice,
  resolveNotice,
  sendMail,
} from "../src/lib/notify";
import { buildDigest } from "../src/sync/digest";
import type { CfRatingSummary } from "../src/sync/cf-rating";
import {
  collectCfRatingFaults,
  collectFaults,
  runFailedFault,
  type RunOutcome,
} from "../src/sync/faults";
import { OUTAGE_STREAK, tallyError, type ErrorTally } from "../src/sync/runner";
import type { Bindings } from "../src/types";
import { d1Shim } from "./d1";
import { insertUser, openTestDb } from "./db";

const NOW = 1_800_000_000;

type SentMail = { to: unknown; subject: string; text?: string };

/** A minimal env whose EMAIL binding records instead of sending. */
const envWith = (
  sent: SentMail[],
  overrides: { from?: string; to?: string; fail?: boolean } = {},
): Bindings =>
  ({
    ALERT_FROM_EMAIL: overrides.from ?? "alerts@example.com",
    SUPER_ADMIN_EMAIL: overrides.to ?? "admin@example.com",
    EMAIL: {
      send: async (message: SentMail) => {
        if (overrides.fail) throw new Error("E_SENDER_NOT_VERIFIED");
        sent.push(message);
        return { messageId: "m1" };
      },
    },
  }) as unknown as Bindings;

const notice = (key = "codeforces:blocked") => ({
  key,
  subject: "[DIU ACM] test alert",
  detail: "Something went wrong.",
});

const noticeRow = (db: Database.Database, key: string) =>
  db.prepare("SELECT * FROM admin_notices WHERE key = ?").get(key) as
    | { occurrences: number; last_sent_at: number | null; first_seen_at: number }
    | undefined;

// ---------------------------------------------------------------------------

describe("sendMail", () => {
  it("sends text and an escaped HTML part", async () => {
    const sent: SentMail[] = [];
    const ok = await sendMail(envWith(sent), { subject: "Subj", text: "a < b & c" });

    expect(ok).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: "admin@example.com", subject: "Subj", text: "a < b & c" });
    expect((sent[0] as { html: string }).html).toContain("a &lt; b &amp; c");
  });

  it("is a no-op when the sender is unconfigured", async () => {
    // The state on a fresh deploy, before the domain is onboarded. Must not throw.
    const sent: SentMail[] = [];
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(sendMail(envWith(sent, { from: "" }), { subject: "S", text: "t" })).resolves.toBe(
      false,
    );
    expect(sent).toHaveLength(0);
    warn.mockRestore();
  });

  it("swallows a rejection from the email service", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      sendMail(envWith([], { fail: true }), { subject: "S", text: "t" }),
    ).resolves.toBe(false);
    error.mockRestore();
  });
});

describe("reportNotice", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openTestDb();
  });

  it("sends the first occurrence and records it", async () => {
    const sent: SentMail[] = [];

    const result = await reportNotice(envWith(sent), d1Shim(db), notice(), NOW);

    expect(result).toBe("sent");
    expect(sent).toHaveLength(1);
    expect(noticeRow(db, "codeforces:blocked")).toMatchObject({
      occurrences: 0, // reset on send
      last_sent_at: NOW,
      first_seen_at: NOW,
    });
  });

  it("suppresses repeats inside the cooldown but keeps counting", async () => {
    const sent: SentMail[] = [];
    const d1 = d1Shim(db);

    await reportNotice(envWith(sent), d1, notice(), NOW);
    await reportNotice(envWith(sent), d1, notice(), NOW + 60);
    await reportNotice(envWith(sent), d1, notice(), NOW + 120);

    expect(sent).toHaveLength(1);
    expect(noticeRow(db, "codeforces:blocked")?.occurrences).toBe(2);
  });

  it("sends again once the cooldown expires, and says how many it swallowed", async () => {
    const sent: SentMail[] = [];
    const d1 = d1Shim(db);

    await reportNotice(envWith(sent), d1, notice(), NOW);
    await reportNotice(envWith(sent), d1, notice(), NOW + 60);
    await reportNotice(envWith(sent), d1, notice(), NOW + NOTICE_COOLDOWN_SECONDS + 1);

    expect(sent).toHaveLength(2);
    expect(sent[1].text).toMatch(/Seen 2 times since/);
    expect(noticeRow(db, "codeforces:blocked")?.occurrences).toBe(0);
  });

  it("keeps distinct keys on independent cooldowns", async () => {
    const sent: SentMail[] = [];
    const d1 = d1Shim(db);

    await reportNotice(envWith(sent), d1, notice("codeforces:blocked"), NOW);
    await reportNotice(envWith(sent), d1, notice("atcoder:blocked"), NOW);

    expect(sent).toHaveLength(2);
  });

  it("records the fault even when mail cannot be sent", async () => {
    // Sending being off must not lose the fact that something broke.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await reportNotice(
      envWith([], { from: "" }),
      d1Shim(db),
      notice(),
      NOW,
    );

    expect(result).toBe("undeliverable");
    expect(noticeRow(db, "codeforces:blocked")).toMatchObject({ occurrences: 1, last_sent_at: null });
    warn.mockRestore();
  });

  it("sends one recovery message and clears the open incident", async () => {
    const sent: SentMail[] = [];
    const d1 = d1Shim(db);
    await reportNotice(envWith(sent), d1, notice(), NOW);

    const result = await resolveNotice(envWith(sent), d1, {
      key: "codeforces:blocked",
      subject: "[DIU ACM] Codeforces recovered",
      detail: "A valid response arrived.",
    });

    expect(result).toBe("resolved");
    expect(sent).toHaveLength(2);
    expect(sent[1].subject).toContain("recovered");
    expect(sent[1].text).toContain("Incident opened");
    expect(noticeRow(db, "codeforces:blocked")).toBeUndefined();
  });

  it("keeps an incident open when the recovery email is undeliverable", async () => {
    const sent: SentMail[] = [];
    const d1 = d1Shim(db);
    await reportNotice(envWith(sent), d1, notice(), NOW);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await resolveNotice(envWith([], { fail: true }), d1, {
      key: "codeforces:blocked",
      subject: "recovered",
      detail: "ok",
    });

    expect(result).toBe("undeliverable");
    expect(noticeRow(db, "codeforces:blocked")).toBeDefined();
    error.mockRestore();
  });
});

describe("collectFaults", () => {
  const healthy: RunOutcome = {
    platform: "codeforces",
    unit: "handle",
    processed: 100,
    errors: 1,
    stoppedReason: null,
    truncated: [],
  };

  it("says nothing about a healthy run", () => {
    expect(collectFaults(healthy)).toEqual([]);
  });

  it("treats a time-budget stop as routine", () => {
    // Leftovers are picked up next tick; that is the design, not a fault.
    expect(collectFaults({ ...healthy, stoppedReason: "time-budget" })).toEqual([]);
  });

  it("flags dropped submissions, naming the handles", () => {
    const faults = collectFaults({ ...healthy, truncated: ["alice", "bob"] });

    expect(faults).toHaveLength(1);
    expect(faults[0].key).toBe("codeforces:paging-truncated");
    expect(faults[0].detail).toContain("alice, bob");
    expect(faults[0].detail).toMatch(/too low/);
  });

  it("stops listing handles past the cap", () => {
    const handles = Array.from({ length: 25 }, (_, i) => `user${i}`);
    const [fault] = collectFaults({ ...healthy, truncated: handles });

    expect(fault.detail).toContain("and 5 more");
  });

  it("flags a rate-limited run", () => {
    const faults = collectFaults({ ...healthy, stoppedReason: "rate-limit" });

    expect(faults).toHaveLength(1);
    expect(faults[0].key).toBe("codeforces:blocked");
  });

  it("flags a batch where most units failed", () => {
    const faults = collectFaults({ ...healthy, processed: 30, errors: 20 });

    expect(faults).toHaveLength(1);
    expect(faults[0].key).toBe("codeforces:error-rate");
    expect(faults[0].detail).toContain("20 of 30");
  });

  it("spells out the failure reasons, commonest first", () => {
    // The mail has to carry these: `last_sync_error` is cleared by the next
    // successful sync, usually well before anyone reads the alert.
    const [fault] = collectFaults({
      ...healthy,
      processed: 30,
      errors: 20,
      errorReasons: { "Invalid Codeforces handle.": 3, "Could not reach Codeforces.": 17 },
    });

    expect(fault.detail).toContain("17× Could not reach Codeforces.");
    expect(fault.detail).toContain("3× Invalid Codeforces handle.");
    expect(fault.detail.indexOf("17×")).toBeLessThan(fault.detail.indexOf("3×"));
  });

  /** Exactly what a run the outage breaker cut short looks like. */
  const aborted: RunOutcome = {
    ...healthy,
    processed: OUTAGE_STREAK,
    errors: OUTAGE_STREAK,
    stoppedReason: "judge-down",
  };

  it("still alerts on the smallest run the outage breaker can produce", () => {
    // The one interaction that would let an outage stop the sync silently:
    // MIN_SAMPLE here and OUTAGE_STREAK in runner.ts are coupled, and an aborted
    // run sits exactly on the boundary.
    expect(collectFaults(aborted).map((f) => f.key)).toEqual(["codeforces:error-rate"]);
  });

  it("explains a run the outage breaker cut short", () => {
    // Otherwise "5 of 5" reads as a rounding error rather than an aborted batch.
    const [fault] = collectFaults(aborted);

    expect(fault.detail).toContain(`stopped after ${OUTAGE_STREAK} consecutive failures`);
    expect(fault.detail).toContain("retried on the next tick");
  });

  it("omits the reasons block when there is nothing to say", () => {
    const [fault] = collectFaults({ ...healthy, processed: 30, errors: 20, errorReasons: {} });

    expect(fault.detail).not.toContain("Reasons:");
  });

  it("ignores a bad ratio on a sample too small to mean anything", () => {
    // 2 of 3 is 67%, but it is also just two dead handles.
    expect(collectFaults({ ...healthy, processed: 3, errors: 2 })).toEqual([]);
  });

  it("points a VJudge fault at the contest cursor table", () => {
    const [fault] = collectFaults({
      platform: "vjudge",
      unit: "contest",
      processed: 40,
      errors: 30,
      stoppedReason: null,
    });

    expect(fault.detail).toContain("event_sync_state.last_sync_error");
  });

  it("reports several faults at once", () => {
    const faults = collectFaults({
      ...healthy,
      processed: 30,
      errors: 20,
      stoppedReason: "rate-limit",
      truncated: ["alice"],
    });

    expect(faults.map((f) => f.key)).toEqual([
      "codeforces:paging-truncated",
      "codeforces:blocked",
    ]);
  });

  it("does not send a duplicate error-rate incident for a rate-limit stop", () => {
    const faults = collectFaults({
      ...healthy,
      processed: 5,
      errors: 5,
      stoppedReason: "rate-limit",
      errorReasons: { "Codeforces call limit exceeded.": 5 },
    });

    expect(faults.map((fault) => fault.key)).toEqual(["codeforces:blocked"]);
  });
});

describe("collectCfRatingFaults", () => {
  const healthy: CfRatingSummary = {
    handles: 100,
    checked: 100,
    ratingsUpdated: 3,
    handlesRenamed: 1,
    handlesRecased: 0,
    invalid: [],
    renameConflicts: [],
    chunksFailed: 0,
    errorReasons: {},
    stoppedReason: null,
  };

  const dead = (id: number) => ({
    handleId: id,
    handle: `ghost${id}`,
    userId: id,
    userName: `User ${id}`,
    userEmail: `user${id}@example.com`,
  });

  it("says nothing about a healthy run", () => {
    expect(collectCfRatingFaults(healthy)).toEqual([]);
  });

  it("names the owner of every dead handle", () => {
    const faults = collectCfRatingFaults({
      ...healthy,
      checked: 98,
      invalid: [dead(1), dead(2)],
    });

    expect(faults).toHaveLength(1);
    expect(faults[0].key).toBe("codeforces-rating:invalid-handles");
    expect(faults[0].subject).toContain("2 Codeforces handle(s)");
    expect(faults[0].detail).toContain("ghost1 — User 1 <user1@example.com> (user 1)");
    // The rule the whole feature hangs on: detection never mutates.
    expect(faults[0].detail).toContain("Nothing was changed");
  });

  it("stops listing dead handles past the cap", () => {
    const invalid = Array.from({ length: 25 }, (_, i) => dead(i));
    const [fault] = collectCfRatingFaults({ ...healthy, invalid });

    expect(fault.detail).toContain("...and 5 more");
  });

  it("reports a rename that could not be applied, and who is blocking it", () => {
    const faults = collectCfRatingFaults({
      ...healthy,
      renameConflicts: [
        { from: "oldalice", to: "newalice", userId: 1, userName: "Alice", heldBy: "Bob <b@x.io>" },
      ],
    });

    expect(faults).toHaveLength(1);
    expect(faults[0].key).toBe("codeforces-rating:rename-conflict");
    expect(faults[0].detail).toContain("oldalice → newalice");
    expect(faults[0].detail).toContain("already held by Bob <b@x.io>");
  });

  it("counts the handles a failed batch left unchecked, with the reasons", () => {
    const faults = collectCfRatingFaults({
      ...healthy,
      checked: 60,
      chunksFailed: 1,
      errorReasons: { "Could not reach Codeforces. Please try again.": 1 },
    });

    expect(faults).toHaveLength(1);
    expect(faults[0].key).toBe("codeforces-rating:unreachable");
    expect(faults[0].detail).toContain("40 of 100 handle(s) were not checked");
    expect(faults[0].detail).toContain("1× Could not reach Codeforces.");
  });

  it("warns that the dead-handle list is partial when the run stopped early", () => {
    const faults = collectCfRatingFaults({
      ...healthy,
      checked: 50,
      stoppedReason: "rate-limit",
      invalid: [dead(1)],
    });

    expect(faults.map((f) => f.key)).toEqual([
      "codeforces-rating:invalid-handles",
      "codeforces-rating:unreachable",
    ]);
    expect(faults[1].detail).toContain("call limit");
    expect(faults[1].detail).toContain("partial");
  });
});

describe("tallyError", () => {
  it("counts repeats of the same message", () => {
    const tally: ErrorTally = {};
    tallyError(tally, "Could not reach Codeforces.");
    tallyError(tally, "Could not reach Codeforces.");

    expect(tally).toEqual({ "Could not reach Codeforces.": 2 });
  });

  it("truncates a message too long to belong in a log line", () => {
    const tally: ErrorTally = {};
    tallyError(tally, "x".repeat(800));

    const [reason] = Object.keys(tally);
    expect(reason).toHaveLength(513);
    expect(reason.endsWith("…")).toBe(true);
  });

  it("collapses the tail once too many distinct messages arrive", () => {
    // A message embedding a handle or an id would otherwise give every failed
    // row its own bucket — the run where the summary matters most.
    const tally: ErrorTally = {};
    for (let i = 0; i < 30; i += 1) tallyError(tally, `failure ${i}`);

    expect(Object.keys(tally)).toHaveLength(9);
    expect(tally["(other)"]).toBe(22);
  });
});

describe("runFailedFault", () => {
  it("carries the message and stack", () => {
    const fault = runFailedFault("atcoder", new Error("contests.json down"));

    expect(fault.key).toBe("atcoder:run-failed");
    expect(fault.detail).toContain("contests.json down");
  });
});

describe("buildDigest", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openTestDb();
  });

  it("reports a clean system as needing no action", async () => {
    insertUser(db, 1);
    db.prepare(
      "INSERT INTO user_handles (user_id, type, handle, last_synced_at) VALUES (1, 'codeforces', 'alice', ?)",
    ).run(NOW - 600);

    const { body } = await buildDigest(d1Shim(db), NOW);

    expect(body).toContain("codeforces");
    expect(body).toContain("1 total");
    expect(body).toContain("ALERTS (24h): none");
    expect(body).toContain("No action needed.");
  });

  it("surfaces failing handles, stuck contests and recent alerts", async () => {
    insertUser(db, 1);
    db.prepare(
      "INSERT INTO user_handles (user_id, type, handle, last_synced_at, last_sync_error) VALUES (1, 'atcoder', 'ghost', ?, 'HTTP 500')",
    ).run(NOW - 100);
    db.prepare(
      "INSERT INTO events (id, title, status, starting_at, ending_at, event_link) VALUES (7, 'E', 'published', 1, 2, 'https://vjudge.net/contest/1')",
    ).run();
    db.prepare(
      "INSERT INTO event_sync_state (event_id, last_synced_at, last_sync_error) VALUES (7, ?, 'gone')",
    ).run(NOW - 100);
    db.prepare(
      "INSERT INTO admin_notices (key, first_seen_at, last_seen_at, occurrences) VALUES ('vjudge:blocked', ?, ?, 4)",
    ).run(NOW - 7200, NOW - 3600);

    const { body } = await buildDigest(d1Shim(db), NOW);

    expect(body).toContain("atcoder/ghost — HTTP 500");
    expect(body).toContain("event 7");
    expect(body).toContain("vjudge:blocked — 4 occurrence(s)");
    expect(body).toContain("needing attention");
    expect(body).not.toContain("No action needed.");
  });

  it("works on an empty database", async () => {
    const { body } = await buildDigest(d1Shim(db), NOW);
    expect(body).toContain("none registered");
  });
});
