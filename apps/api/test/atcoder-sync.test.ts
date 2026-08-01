import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import type { AtcoderContest, AtcoderSubmission } from "../src/lib/atcoder";
import { atcoderPlatform } from "../src/sync/atcoder";
import { runSync } from "../src/sync/runner";
import { d1Shim } from "./d1";
import { attachEvent, insertRanklist, insertTracker, insertUser, openTestDb } from "./db";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CONTEST_ID = "abc300";
const CONTEST_START = 1_700_000_000;
const CONTEST_DURATION = 6000;
const CONTEST_END = CONTEST_START + CONTEST_DURATION;
const NOW = CONTEST_END + 200_000;

const submission = (
  problem: string,
  epochSecond: number,
  overrides: Partial<AtcoderSubmission> = {},
): AtcoderSubmission => ({
  epoch_second: epochSecond,
  problem_id: `${CONTEST_ID}_${problem}`,
  contest_id: CONTEST_ID,
  result: "AC",
  ...overrides,
});

const CONTESTS: AtcoderContest[] = [
  {
    id: CONTEST_ID,
    title: "AtCoder Beginner Contest 300",
    start_epoch_second: CONTEST_START,
    duration_second: CONTEST_DURATION,
  },
];

type Calls = { contests: number; submissions: string[] };

/**
 * Answers both AtCoder Problems endpoints from fixtures. `pages` lets a test
 * hand back successive pages of the submissions endpoint.
 */
const fetcherFor = (
  pages: AtcoderSubmission[][],
  calls: Calls = { contests: 0, submissions: [] },
  opts: { contests?: AtcoderContest[]; status?: number } = {},
): typeof fetch =>
  (async (input: RequestInfo | URL) => {
    const url = new URL(input.toString());
    if (url.pathname.endsWith("contests.json")) {
      calls.contests += 1;
      return Response.json(opts.contests ?? CONTESTS);
    }
    if (opts.status && opts.status !== 200) {
      return new Response("nope", { status: opts.status });
    }
    const from = Number(url.searchParams.get("from_second"));
    calls.submissions.push(`${url.searchParams.get("user")}@${from}`);
    // Pages are consumed in order; the runner advances from_second past the
    // last row it saw, so a page is served once.
    const page = pages.shift() ?? [];
    return Response.json(page);
  }) as unknown as typeof fetch;

const insertAtcoderEvent = (
  db: Database.Database,
  id: number,
  slug: string,
  opts: { startingAt?: number; endingAt?: number } = {},
) =>
  db
    .prepare(
      "INSERT INTO events (id, title, status, starting_at, ending_at, event_link) VALUES (?, ?, 'published', ?, ?, ?)",
    )
    .run(
      id,
      `Event ${id}`,
      opts.startingAt ?? CONTEST_START,
      opts.endingAt ?? CONTEST_END,
      `https://atcoder.jp/contests/${slug}`,
    );

const insertHandle = (db: Database.Database, id: number, userId: number, handle: string) =>
  db
    .prepare("INSERT INTO user_handles (id, user_id, type, handle) VALUES (?, ?, 'atcoder', ?)")
    .run(id, userId, handle);

const performance = (db: Database.Database, eventId: number, userId: number) =>
  db
    .prepare(
      "SELECT solve_count, upsolve_count FROM event_performance WHERE event_id = ? AND user_id = ?",
    )
    .get(eventId, userId) as { solve_count: number; upsolve_count: number } | undefined;

const handleState = (db: Database.Database, id: number) =>
  db.prepare("SELECT last_synced_at, last_sync_error FROM user_handles WHERE id = ?").get(id) as {
    last_synced_at: number | null;
    last_sync_error: string | null;
  };

const run = (db: Database.Database, fetcher: typeof fetch) =>
  runSync(d1Shim(db), atcoderPlatform, {
    fetcher,
    now: NOW,
    limit: 10,
    requestDelayMs: 0,
    minResyncSeconds: 0,
  });

// ---------------------------------------------------------------------------

describe("runSync — AtCoder", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openTestDb();
    insertTracker(db, 1);
    insertRanklist(db, 1, 1);
    insertUser(db, 1);
    insertHandle(db, 1, 1, "alice");
    insertAtcoderEvent(db, 1, CONTEST_ID);
    attachEvent(db, 1, 1, 1);
  });

  it("counts contest-time accepts as solves and later ones as upsolves", async () => {
    const summary = await run(
      db,
      fetcherFor([
        [
          submission("a", CONTEST_START + 100),
          submission("b", CONTEST_START + 900),
          submission("c", CONTEST_END + 86_400),
        ],
      ]),
    );

    expect(summary).toMatchObject({ events: 1, handlesProcessed: 1, errors: 0 });
    expect(performance(db, 1, 1)).toEqual({ solve_count: 2, upsolve_count: 1 });
  });

  it("ignores results other than AC", async () => {
    await run(
      db,
      fetcherFor([
        [
          submission("a", CONTEST_START + 100, { result: "WA" }),
          submission("b", CONTEST_START + 200, { result: "TLE" }),
        ],
      ]),
    );

    expect(performance(db, 1, 1)).toBeUndefined();
  });

  it("does not double-count a problem solved again in practice", async () => {
    await run(
      db,
      fetcherFor([[submission("a", CONTEST_START + 100), submission("a", CONTEST_END + 500)]]),
    );

    expect(performance(db, 1, 1)).toEqual({ solve_count: 1, upsolve_count: 0 });
  });

  it("trusts the real contest window when the event's stored times are wrong", async () => {
    // Event window nowhere near the contest; contests.json still knows better.
    db.prepare("UPDATE events SET starting_at = ?, ending_at = ? WHERE id = 1").run(
      CONTEST_START - 100_000,
      CONTEST_START - 90_000,
    );

    await run(db, fetcherFor([[submission("a", CONTEST_START + 100)]]));

    expect(performance(db, 1, 1)).toEqual({ solve_count: 1, upsolve_count: 0 });
  });

  it("falls back to the event window for a contest missing from contests.json", async () => {
    const calls: Calls = { contests: 0, submissions: [] };
    await run(
      db,
      fetcherFor([[submission("a", CONTEST_START + 100)]], calls, { contests: [] }),
    );

    expect(calls.contests).toBe(1);
    expect(performance(db, 1, 1)).toEqual({ solve_count: 1, upsolve_count: 0 });
  });

  it("ignores submissions for contests no event points at", async () => {
    await run(
      db,
      fetcherFor([
        [submission("a", CONTEST_START + 100, { contest_id: "abc999", problem_id: "abc999_a" })],
      ]),
    );

    expect(performance(db, 1, 1)).toBeUndefined();
  });

  it("pages forward while a full page comes back", async () => {
    const full = Array.from({ length: 500 }, (_, i) =>
      submission(`p${i}`, CONTEST_START + 100 + i),
    );
    const calls: Calls = { contests: 0, submissions: [] };

    await run(db, fetcherFor([full, [submission("z", CONTEST_END + 10)]], calls));

    expect(calls.submissions).toHaveLength(2);
    // Second page resumes one second past the last row of the first.
    expect(calls.submissions[1]).toBe(`alice@${CONTEST_START + 100 + 499 + 1}`);
    expect(performance(db, 1, 1)).toEqual({ solve_count: 500, upsolve_count: 1 });
  });

  it("fetches contests.json once per run, not once per handle", async () => {
    insertUser(db, 2);
    insertHandle(db, 2, 2, "bob");
    const calls: Calls = { contests: 0, submissions: [] };

    await run(db, fetcherFor([[], []], calls));

    expect(calls.contests).toBe(1);
    expect(calls.submissions).toHaveLength(2);
  });

  it("treats an empty submission list as success, not an error", async () => {
    // A handle that does not exist is indistinguishable from an inactive one:
    // AtCoder Problems answers 200 with [] for both.
    const summary = await run(db, fetcherFor([[]]));

    expect(summary).toMatchObject({ handlesProcessed: 1, errors: 0, rowsWritten: 0 });
    expect(handleState(db, 1)).toEqual({ last_synced_at: NOW, last_sync_error: null });
  });

  it("records an upstream failure and still advances the cursor", async () => {
    const summary = await run(db, fetcherFor([[]], undefined, { status: 500 }));

    expect(summary).toMatchObject({ handlesProcessed: 1, errors: 1 });
    expect(handleState(db, 1).last_synced_at).toBe(NOW);
    expect(handleState(db, 1).last_sync_error).toMatch(/HTTP 500/);
  });

  it("stops the whole batch when AtCoder Problems rate-limits", async () => {
    insertUser(db, 2);
    insertHandle(db, 2, 2, "bob");
    const calls: Calls = { contests: 0, submissions: [] };

    const summary = await run(db, fetcherFor([[]], calls, { status: 429 }));

    expect(calls.submissions).toHaveLength(0); // 429 short-circuits before recording
    expect(summary.stoppedEarly).toBe(true);
    // Distinct from a time-budget stop: only this one is worth an alert.
    expect(summary.stoppedReason).toBe("rate-limit");
    expect(summary.handlesProcessed).toBe(1);
  });

  it("reports a handle whose history outran the paging cap", async () => {
    // MAX_PAGES full pages in a row: paging can only end by running out, so
    // the newest submissions were never read and the counts are too low.
    const MAX_PAGES = 20;
    const full = Array.from({ length: 500 }, (_, i) =>
      submission(`p${i}`, CONTEST_START + 100 + i),
    );
    const pages = Array.from({ length: MAX_PAGES }, () => full);

    const summary = await run(db, fetcherFor(pages));

    expect(summary.truncatedHandles).toEqual(["alice"]);
    // Not an error: the partial counts still get written, the alert is what
    // gets it looked at.
    expect(summary.errors).toBe(0);
  });

  it("reports no truncation on a history that ends normally", async () => {
    const summary = await run(db, fetcherFor([[submission("a", CONTEST_START + 100)]]));

    expect(summary.truncatedHandles).toEqual([]);
  });

  it("skips Codeforces events — those belong to the other platform", async () => {
    db.prepare("UPDATE events SET event_link = ? WHERE id = 1").run(
      "https://codeforces.com/contest/1900",
    );

    const summary = await run(db, fetcherFor([[submission("a", CONTEST_START + 100)]]));

    expect(summary.events).toBe(0);
    expect(summary.handlesProcessed).toBe(0);
  });
});
