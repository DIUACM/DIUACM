import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import type { VjudgeRank, VjudgeSubmission } from "../src/lib/vjudge";
import { runVjudgeSync } from "../src/sync/vjudge";
import { d1Shim } from "./d1";
import { attachEvent, insertRanklist, insertTracker, insertUser, openTestDb } from "./db";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CONTEST_ID = "719705";
const BEGIN_SECONDS = 1_700_000_000;
const LENGTH_SECONDS = 14_400;
const CONTEST_END = BEGIN_SECONDS + LENGTH_SECONDS;
const NOW = CONTEST_END + 200_000;

/** VJudge participant ids, which the submission rows reference. */
const ALICE = 483_958;
const BOB = 647_253;

/** `[participantId, problemIndex, status, secondsSinceBegin]` — 1 is accepted. */
const submission = (
  participantId: number,
  problemIndex: number,
  secondsSinceBegin: number,
  status = 1,
): VjudgeSubmission => [participantId, problemIndex, status, secondsSinceBegin];

const rank = (
  submissions: VjudgeSubmission[],
  participants: Record<string, { name: string }> = { [ALICE]: { name: "alice" } },
): VjudgeRank => ({
  // The API reports both in milliseconds.
  begin: BEGIN_SECONDS * 1000,
  length: LENGTH_SECONDS * 1000,
  participants,
  submissions,
});

type Calls = { contests: string[] };

/**
 * Answers /contest/rank/single/<id> from fixtures, keyed by contest id.
 * `opts.status` forces an HTTP failure; `opts.empty` reproduces VJudge's
 * 200-with-no-body answer for a contest it will not show.
 */
const fetcherFor = (
  ranks: Record<string, VjudgeRank>,
  calls: Calls = { contests: [] },
  opts: { status?: number; empty?: boolean; body?: string } = {},
): typeof fetch =>
  (async (input: RequestInfo | URL) => {
    const contestId = new URL(input.toString()).pathname.split("/").filter(Boolean).at(-1) ?? "";
    if (opts.status && opts.status !== 200) {
      return new Response("nope", { status: opts.status });
    }
    calls.contests.push(contestId);
    if (opts.empty) return new Response("", { status: 200 });
    if (opts.body !== undefined) return new Response(opts.body, { status: 200 });
    const body = ranks[contestId];
    if (!body) return new Response("", { status: 200 });
    return Response.json(body);
  }) as unknown as typeof fetch;

const insertVjudgeEvent = (
  db: Database.Database,
  id: number,
  contestId: string,
  opts: { startingAt?: number; endingAt?: number } = {},
) =>
  db
    .prepare(
      "INSERT INTO events (id, title, status, starting_at, ending_at, event_link) VALUES (?, ?, 'published', ?, ?, ?)",
    )
    .run(
      id,
      `Event ${id}`,
      opts.startingAt ?? BEGIN_SECONDS,
      opts.endingAt ?? CONTEST_END,
      `https://vjudge.net/contest/${contestId}`,
    );

const insertHandle = (db: Database.Database, id: number, userId: number, handle: string) =>
  db
    .prepare("INSERT INTO user_handles (id, user_id, type, handle) VALUES (?, ?, 'vjudge', ?)")
    .run(id, userId, handle);

const performance = (db: Database.Database, eventId: number, userId: number) =>
  db
    .prepare(
      "SELECT solve_count, upsolve_count FROM event_performance WHERE event_id = ? AND user_id = ?",
    )
    .get(eventId, userId) as { solve_count: number; upsolve_count: number } | undefined;

const eventState = (db: Database.Database, eventId: number) =>
  db
    .prepare("SELECT last_synced_at, last_sync_error FROM event_sync_state WHERE event_id = ?")
    .get(eventId) as { last_synced_at: number | null; last_sync_error: string | null } | undefined;

const run = (
  db: Database.Database,
  fetcher: typeof fetch,
  opts: { minResyncSeconds?: number; limit?: number } = {},
) =>
  runVjudgeSync(d1Shim(db), {
    fetcher,
    now: NOW,
    limit: opts.limit ?? 10,
    requestDelayMs: 0,
    minResyncSeconds: opts.minResyncSeconds ?? 0,
  });

// ---------------------------------------------------------------------------

describe("runVjudgeSync", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openTestDb();
    insertTracker(db, 1);
    insertRanklist(db, 1, 1);
    insertUser(db, 1);
    insertHandle(db, 1, 1, "alice");
    insertVjudgeEvent(db, 1, CONTEST_ID);
    attachEvent(db, 1, 1, 1);
  });

  it("counts accepts inside the contest length as solves and later ones as upsolves", async () => {
    const summary = await run(
      db,
      fetcherFor({
        [CONTEST_ID]: rank([
          submission(ALICE, 0, 100),
          submission(ALICE, 1, LENGTH_SECONDS),
          submission(ALICE, 2, LENGTH_SECONDS + 1),
          submission(ALICE, 3, LENGTH_SECONDS + 86_400),
        ]),
      }),
    );

    expect(summary).toMatchObject({ events: 1, contestsFetched: 1, errors: 0 });
    expect(performance(db, 1, 1)).toEqual({ solve_count: 2, upsolve_count: 2 });
  });

  it("ignores statuses other than accepted", async () => {
    await run(
      db,
      fetcherFor({
        [CONTEST_ID]: rank([submission(ALICE, 0, 100, 0), submission(ALICE, 1, 200, 2)]),
      }),
    );

    expect(performance(db, 1, 1)).toBeUndefined();
  });

  it("does not double-count a problem solved again after the contest", async () => {
    await run(
      db,
      fetcherFor({
        [CONTEST_ID]: rank([submission(ALICE, 0, 100), submission(ALICE, 0, LENGTH_SECONDS + 500)]),
      }),
    );

    expect(performance(db, 1, 1)).toEqual({ solve_count: 1, upsolve_count: 0 });
  });

  it("counts a solve inside the event's own window when VJudge's clock says otherwise", async () => {
    // A club session replaying an older VJudge contest: submissions land long
    // after `length`, but inside the event the ranklist actually tracks.
    db.prepare("UPDATE events SET starting_at = ?, ending_at = ? WHERE id = 1").run(
      BEGIN_SECONDS + 100_000,
      BEGIN_SECONDS + 120_000,
    );

    await run(db, fetcherFor({ [CONTEST_ID]: rank([submission(ALICE, 0, 110_000)]) }));

    expect(performance(db, 1, 1)).toEqual({ solve_count: 1, upsolve_count: 0 });
  });

  it("ignores participants with no handle on record", async () => {
    const summary = await run(
      db,
      fetcherFor({
        [CONTEST_ID]: rank([submission(ALICE, 0, 100), submission(BOB, 1, 200)], {
          [ALICE]: { name: "alice" },
          [BOB]: { name: "stranger" },
        }),
      }),
    );

    expect(summary).toMatchObject({ contestsFetched: 1, errors: 0 });
    expect(performance(db, 1, 1)).toEqual({ solve_count: 1, upsolve_count: 0 });
  });

  it("matches handles case-insensitively", async () => {
    await run(
      db,
      fetcherFor({
        [CONTEST_ID]: rank([submission(ALICE, 0, 100)], { [ALICE]: { name: "ALICE" } }),
      }),
    );

    expect(performance(db, 1, 1)).toEqual({ solve_count: 1, upsolve_count: 0 });
  });

  it("merges a user's several VJudge handles into one row", async () => {
    // Only VJudge allows more than one handle per user, and both can appear in
    // the same standings. Counting them separately would have the second
    // upsert overwrite the first, since the row is keyed (event_id, user_id).
    insertHandle(db, 2, 1, "alice_alt");

    await run(
      db,
      fetcherFor({
        [CONTEST_ID]: rank(
          [
            submission(ALICE, 0, 100),
            submission(BOB, 1, 200),
            // Same problem on both accounts — still one solve.
            submission(BOB, 0, 300),
            submission(BOB, 2, LENGTH_SECONDS + 100),
          ],
          { [ALICE]: { name: "alice" }, [BOB]: { name: "alice_alt" } },
        ),
      }),
    );

    expect(performance(db, 1, 1)).toEqual({ solve_count: 2, upsolve_count: 1 });
  });

  it("writes no row for a participant who solved nothing", async () => {
    const summary = await run(
      db,
      fetcherFor({ [CONTEST_ID]: rank([submission(ALICE, 0, 100, 0)]) }),
    );

    expect(summary).toMatchObject({ contestsFetched: 1, rowsWritten: 0, errors: 0 });
    expect(performance(db, 1, 1)).toBeUndefined();
  });

  it("preserves an admin-entered position", async () => {
    db.prepare(
      "INSERT INTO event_performance (event_id, user_id, position, solve_count) VALUES (1, 1, 3, 0)",
    ).run();

    await run(db, fetcherFor({ [CONTEST_ID]: rank([submission(ALICE, 0, 100)]) }));

    expect(
      db.prepare("SELECT position, solve_count FROM event_performance WHERE id = 1").get(),
    ).toEqual({ position: 3, solve_count: 1 });
  });

  it("rewrites nothing on an unchanged second run", async () => {
    const fetcher = () => fetcherFor({ [CONTEST_ID]: rank([submission(ALICE, 0, 100)]) });

    const first = await run(db, fetcher());
    const second = await run(db, fetcher());

    expect(first.rowsWritten).toBe(1);
    expect(second).toMatchObject({ contestsFetched: 1, rowsWritten: 0 });
  });

  it("fetches a contest once when two events point at it", async () => {
    insertVjudgeEvent(db, 2, CONTEST_ID);
    attachEvent(db, 1, 2, 1);
    const calls: Calls = { contests: [] };

    await run(db, fetcherFor({ [CONTEST_ID]: rank([submission(ALICE, 0, 100)]) }, calls));

    expect(calls.contests).toEqual([CONTEST_ID]);
    expect(performance(db, 1, 1)).toEqual({ solve_count: 1, upsolve_count: 0 });
    expect(performance(db, 2, 1)).toEqual({ solve_count: 1, upsolve_count: 0 });
  });

  it("skips a contest read within the freshness window", async () => {
    db.prepare("INSERT INTO event_sync_state (event_id, last_synced_at) VALUES (1, ?)").run(
      NOW - 60,
    );
    const calls: Calls = { contests: [] };

    const summary = await run(db, fetcherFor({}, calls), { minResyncSeconds: 3600 });

    expect(calls.contests).toHaveLength(0);
    expect(summary).toMatchObject({ events: 1, contestsFetched: 0 });
  });

  it("takes the least recently synced contests first", async () => {
    insertVjudgeEvent(db, 2, "800001");
    insertVjudgeEvent(db, 3, "800002");
    attachEvent(db, 1, 2, 1);
    attachEvent(db, 1, 3, 1);
    db.prepare("INSERT INTO event_sync_state (event_id, last_synced_at) VALUES (1, 500), (2, 100)")
      .run();
    const calls: Calls = { contests: [] };

    await run(db, fetcherFor({}, calls), { limit: 2 });

    // Event 3 has never been synced (cursor 0), then event 2 at 100. Event 1,
    // at 500, is not in a batch of two. Deduped because the fixture answers
    // empty, which the client retries once.
    expect([...new Set(calls.contests)]).toEqual(["800002", "800001"]);
  });

  it("records a failure, advances the cursor, and keeps going", async () => {
    insertVjudgeEvent(db, 2, "800001");
    attachEvent(db, 1, 2, 1);

    const summary = await run(db, fetcherFor({}, undefined, { status: 500 }));

    expect(summary).toMatchObject({ contestsFetched: 0, errors: 2 });
    expect(eventState(db, 1)).toEqual({ last_synced_at: NOW, last_sync_error: expect.stringMatching(/HTTP 500/) });
    expect(eventState(db, 2)?.last_synced_at).toBe(NOW);
  });

  it("treats a persistently empty 200 as a recorded failure", async () => {
    // A deleted or non-public contest answers 200 with no body, not a 404.
    const calls: Calls = { contests: [] };
    const summary = await run(db, fetcherFor({}, calls, { empty: true }));

    expect(summary).toMatchObject({ errors: 1, rowsWritten: 0 });
    expect(calls.contests).toEqual([CONTEST_ID, CONTEST_ID]); // retried once
    expect(eventState(db, 1)?.last_sync_error).toMatch(/empty response twice/);
    expect(eventState(db, 1)?.last_synced_at).toBe(NOW);
  });

  it("retries an empty 200, which VJudge returns transiently", async () => {
    // Observed on ~2% of a real 121-contest pass: the same id answered normally
    // seconds later, so one empty body is not proof the contest is gone.
    const calls: Calls = { contests: [] };
    let first = true;
    const fetcher = (async (input: RequestInfo | URL) => {
      calls.contests.push(input.toString());
      if (first) {
        first = false;
        return new Response("", { status: 200 });
      }
      return Response.json(rank([submission(ALICE, 0, 100)]));
    }) as unknown as typeof fetch;

    const summary = await run(db, fetcher);

    expect(calls.contests).toHaveLength(2);
    expect(summary).toMatchObject({ contestsFetched: 1, errors: 0 });
    expect(performance(db, 1, 1)).toEqual({ solve_count: 1, upsolve_count: 0 });
  });

  it("clears a stored error once the contest syncs again", async () => {
    await run(db, fetcherFor({}, undefined, { status: 500 }));
    expect(eventState(db, 1)?.last_sync_error).toMatch(/HTTP 500/);

    await run(db, fetcherFor({ [CONTEST_ID]: rank([submission(ALICE, 0, 100)]) }));

    expect(eventState(db, 1)?.last_sync_error).toBeNull();
  });

  it("stops the whole batch when VJudge answers with a bot challenge", async () => {
    insertVjudgeEvent(db, 2, "800001");
    attachEvent(db, 1, 2, 1);

    // 403 + cf-mitigated: challenge is what Cloudflare returns for VJudge when
    // it decides we are a bot — the next contest would answer the same way.
    const summary = await run(db, fetcherFor({}, undefined, { status: 403 }));

    expect(summary.stoppedEarly).toBe(true);
    expect(summary.errors).toBe(1);
    expect(eventState(db, 2)).toBeUndefined();
  });

  it("stops the whole batch when VJudge rate-limits", async () => {
    insertVjudgeEvent(db, 2, "800001");
    attachEvent(db, 1, 2, 1);

    const summary = await run(db, fetcherFor({}, undefined, { status: 429 }));

    expect(summary.stoppedEarly).toBe(true);
    expect(eventState(db, 2)).toBeUndefined();
  });

  it("records unparseable JSON rather than throwing out of the run", async () => {
    const summary = await run(db, fetcherFor({}, undefined, { body: "<html>nope</html>" }));

    expect(summary).toMatchObject({ errors: 1, stoppedEarly: false });
    expect(eventState(db, 1)?.last_sync_error).toMatch(/invalid response/);
  });

  it("ignores events on a locked ranklist", async () => {
    db.prepare("UPDATE ranklists SET is_locked = 1 WHERE id = 1").run();

    const summary = await run(db, fetcherFor({ [CONTEST_ID]: rank([submission(ALICE, 0, 100)]) }));

    expect(summary).toMatchObject({ events: 0, contestsFetched: 0 });
  });

  it("ignores events that have not finished yet", async () => {
    db.prepare("UPDATE events SET ending_at = ? WHERE id = 1").run(NOW + 1000);

    expect(await run(db, fetcherFor({}))).toMatchObject({ events: 0 });
  });

  it("skips Codeforces and AtCoder events — those belong to the other runner", async () => {
    db.prepare("UPDATE events SET event_link = ? WHERE id = 1").run(
      "https://codeforces.com/contest/1900",
    );
    insertVjudgeEvent(db, 2, "800001");
    db.prepare("UPDATE events SET event_link = ? WHERE id = 2").run(
      "https://atcoder.jp/contests/abc300",
    );
    attachEvent(db, 1, 2, 1);
    const calls: Calls = { contests: [] };

    const summary = await run(db, fetcherFor({}, calls));

    expect(summary).toMatchObject({ events: 0, contestsFetched: 0 });
    expect(calls.contests).toHaveLength(0);
  });

  it("does nothing when no user has a VJudge handle", async () => {
    db.prepare("DELETE FROM user_handles").run();
    const calls: Calls = { contests: [] };

    const summary = await run(db, fetcherFor({ [CONTEST_ID]: rank([]) }, calls));

    expect(calls.contests).toHaveLength(0);
    expect(summary).toMatchObject({ events: 1, contestsFetched: 0 });
  });

  it("feeds the ranklist score triggers", async () => {
    insertRanklist(db, 2, 1, { upsolveWeight: 0.5, autoAddUsers: true });
    attachEvent(db, 2, 1, 1);

    await run(
      db,
      fetcherFor({
        [CONTEST_ID]: rank([
          submission(ALICE, 0, 100),
          submission(ALICE, 1, LENGTH_SECONDS + 100),
        ]),
      }),
    );

    expect(
      db.prepare("SELECT score FROM ranklist_user WHERE ranklist_id = 2 AND user_id = 1").get(),
    ).toEqual({ score: 1.5 });
  });
});
