import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import type { CodeforcesSubmission } from "../src/lib/codeforces";
import { codeforcesPlatform } from "../src/sync/codeforces";
import {
  computePerformance,
  runSync,
  WRITE_CHUNK_SIZE,
  type Solve,
  type SyncEvent,
} from "../src/sync/runner";
import { d1Shim } from "./d1";
import {
  addMember,
  attachEvent,
  insertRanklist,
  insertTracker,
  insertUser,
  member,
  openTestDb,
} from "./db";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CONTEST_START = 1_700_000_000;
const CONTEST_END = CONTEST_START + 7200;

const submission = (
  index: string,
  participantType: string,
  creationTimeSeconds: number,
  overrides: Partial<CodeforcesSubmission> = {},
): CodeforcesSubmission => ({
  contestId: 1900,
  creationTimeSeconds,
  problem: { contestId: 1900, index },
  author: { participantType },
  verdict: "OK",
  ...overrides,
});

const EVENT: SyncEvent = {
  eventId: 1,
  contestId: "1900",
  startingAt: CONTEST_START,
  endingAt: CONTEST_END,
};

/**
 * Codeforces submissions through the real adapter, so these cases cover the
 * verdict filter and contest-id resolution as well as the counting itself.
 */
const solvesFor = async (submissions: CodeforcesSubmission[]): Promise<Solve[]> => {
  const reader = await codeforcesPlatform.start({
    events: [],
    since: 0,
    fetcher: (async () =>
      Response.json({ status: "OK", result: submissions })) as unknown as typeof fetch,
  });
  return (await reader.fetchSolves("alice")).solves;
};

describe("computePerformance — Codeforces submissions", () => {
  it("counts in-contest accepted submissions as solves", async () => {
    const counts = computePerformance(
      [EVENT],
      await solvesFor([
        submission("A", "CONTESTANT", CONTEST_START + 100),
        submission("B", "CONTESTANT", CONTEST_START + 900),
      ]),
    );
    expect(counts.get(1)).toEqual({ solveCount: 2, upsolveCount: 0 });
  });

  it("counts practice submissions after the contest as upsolves", async () => {
    const counts = computePerformance(
      [EVENT],
      await solvesFor([
        submission("A", "CONTESTANT", CONTEST_START + 100),
        submission("C", "PRACTICE", CONTEST_END + 86_400),
      ]),
    );
    expect(counts.get(1)).toEqual({ solveCount: 1, upsolveCount: 1 });
  });

  it("does not count a re-solve in practice of an in-contest solve", async () => {
    const counts = computePerformance(
      [EVENT],
      await solvesFor([
        submission("A", "CONTESTANT", CONTEST_START + 100),
        submission("A", "PRACTICE", CONTEST_END + 86_400),
      ]),
    );
    expect(counts.get(1)).toEqual({ solveCount: 1, upsolveCount: 0 });
  });

  it("dedupes repeated accepted submissions on the same problem", async () => {
    const counts = computePerformance(
      [EVENT],
      await solvesFor([
        submission("A", "PRACTICE", CONTEST_END + 10),
        submission("A", "PRACTICE", CONTEST_END + 20),
      ]),
    );
    expect(counts.get(1)).toEqual({ solveCount: 0, upsolveCount: 1 });
  });

  it("treats a submission inside the event window as a solve whatever Codeforces calls it", async () => {
    // Club replays: members participate virtually during the scheduled session.
    const counts = computePerformance(
      [EVENT],
      await solvesFor([submission("A", "VIRTUAL", CONTEST_START + 500)]),
    );
    expect(counts.get(1)).toEqual({ solveCount: 1, upsolveCount: 0 });
  });

  it("splits the same contest differently for two events with different windows", async () => {
    const replay: SyncEvent = {
      eventId: 2,
      contestId: "1900",
      startingAt: CONTEST_END + 86_400,
      endingAt: CONTEST_END + 93_600,
    };
    const counts = computePerformance(
      [EVENT, replay],
      await solvesFor([submission("A", "PRACTICE", CONTEST_END + 87_000)]),
    );
    expect(counts.get(1)).toEqual({ solveCount: 0, upsolveCount: 1 });
    expect(counts.get(2)).toEqual({ solveCount: 1, upsolveCount: 0 });
  });

  it("ignores rejected verdicts and other contests", async () => {
    const counts = computePerformance(
      [EVENT],
      await solvesFor([
        submission("A", "CONTESTANT", CONTEST_START + 100, { verdict: "WRONG_ANSWER" }),
        submission("B", "PRACTICE", CONTEST_END + 10, {
          contestId: 1901,
          problem: { contestId: 1901, index: "B" },
        }),
      ]),
    );
    expect(counts.has(1)).toBe(false);
  });

  it("returns nothing for an event with no matching submissions", () => {
    expect(computePerformance([EVENT], []).size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// End-to-end over the real schema, real SQL and real triggers.
// ---------------------------------------------------------------------------

const insertContestEvent = (
  db: Database.Database,
  id: number,
  link: string | null,
  opts: { status?: string; startingAt?: number; endingAt?: number } = {},
) =>
  db
    .prepare(
      "INSERT INTO events (id, title, status, starting_at, ending_at, event_link) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      id,
      `Event ${id}`,
      opts.status ?? "published",
      opts.startingAt ?? CONTEST_START,
      opts.endingAt ?? CONTEST_END,
      link,
    );

const insertHandle = (db: Database.Database, id: number, userId: number, handle: string) =>
  db
    .prepare("INSERT INTO user_handles (id, user_id, type, handle) VALUES (?, ?, 'codeforces', ?)")
    .run(id, userId, handle);

const performance = (db: Database.Database, eventId: number, userId: number) =>
  db
    .prepare(
      "SELECT solve_count, upsolve_count, position FROM event_performance WHERE event_id = ? AND user_id = ?",
    )
    .get(eventId, userId) as
    | { solve_count: number; upsolve_count: number; position: number | null }
    | undefined;

const handleState = (db: Database.Database, id: number) =>
  db.prepare("SELECT last_synced_at, last_sync_error FROM user_handles WHERE id = ?").get(id) as {
    last_synced_at: number | null;
    last_sync_error: string | null;
  };

/** A fetcher that answers user.status from a per-handle fixture. */
const fetcherFor = (
  byHandle: Record<string, CodeforcesSubmission[] | { failure: string }>,
  calls: string[] = [],
): typeof fetch =>
  (async (input: RequestInfo | URL) => {
    const url = new URL(input.toString());
    const handle = url.searchParams.get("handle") ?? "";
    calls.push(handle);
    const entry = byHandle[handle];
    if (entry && "failure" in entry) {
      return new Response(JSON.stringify({ status: "FAILED", comment: entry.failure }), {
        status: 400,
      });
    }
    return new Response(JSON.stringify({ status: "OK", result: entry ?? [] }), { status: 200 });
  }) as unknown as typeof fetch;

const NOW = CONTEST_END + 200_000;

/**
 * No sleeping, no clock dependence, and no freshness window — those are covered
 * on their own below, and leaving the window on would make several of these
 * pass for the wrong reason (nothing due rather than nothing changed).
 */
const run = (db: Database.Database, fetcher: typeof fetch, limit = 10) =>
  runSync(d1Shim(db), codeforcesPlatform, {
    fetcher,
    now: NOW,
    limit,
    requestDelayMs: 0,
    minResyncSeconds: 0,
  });

describe("runSync — Codeforces", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openTestDb();
    insertTracker(db, 1);
    insertRanklist(db, 1, 1, { upsolveWeight: 0.25 });
    insertUser(db, 1);
    insertHandle(db, 1, 1, "alice");
    insertContestEvent(db, 1, "https://codeforces.com/contest/1900");
    attachEvent(db, 1, 1, 1);
    addMember(db, 1, 1);
  });

  it("writes solve and upsolve counts and moves the ranklist score", () => {
    const fetcher = fetcherFor({
      alice: [
        submission("A", "CONTESTANT", CONTEST_START + 100),
        submission("B", "CONTESTANT", CONTEST_START + 200),
        submission("C", "PRACTICE", CONTEST_END + 5000),
      ],
    });

    return run(db, fetcher).then((summary) => {
      // rowsWritten counts performance rows only — the score and count triggers
      // touch many more rows downstream and must not be folded in.
      expect(summary).toMatchObject({
        events: 1,
        handlesProcessed: 1,
        rowsWritten: 1,
        errors: 0,
      });
      expect(performance(db, 1, 1)).toMatchObject({ solve_count: 2, upsolve_count: 1 });
      // 2 solves × weight 1 + 1 upsolve × weight 1 × upsolveWeight 0.25
      expect(member(db, 1, 1)?.score).toBeCloseTo(2.25);
    });
  });

  it("preserves an admin-entered position across a sync", async () => {
    db.prepare(
      "INSERT INTO event_performance (event_id, user_id, position, solve_count, upsolve_count) VALUES (1, 1, 7, 0, 0)",
    ).run();

    await run(db, fetcherFor({ alice: [submission("A", "CONTESTANT", CONTEST_START + 1)] }));

    expect(performance(db, 1, 1)).toEqual({ solve_count: 1, upsolve_count: 0, position: 7 });
  });

  it("writes nothing on a second identical run", async () => {
    const fetcher = fetcherFor({ alice: [submission("A", "CONTESTANT", CONTEST_START + 1)] });
    await run(db, fetcher);
    const second = await run(db, fetcher);
    expect(second.rowsWritten).toBe(0);
  });

  it("skips users with no solves rather than writing an empty row", async () => {
    await run(db, fetcherFor({ alice: [] }));
    expect(performance(db, 1, 1)).toBeUndefined();
  });

  it("records the failure and still advances the cursor for a dead handle", async () => {
    await run(db, fetcherFor({ alice: { failure: "handles: User with handle alice not found" } }));

    const state = handleState(db, 1);
    expect(state.last_synced_at).toBe(NOW);
    expect(state.last_sync_error).toMatch(/Invalid Codeforces handle/);
  });

  it("clears a stale error once the handle works again", async () => {
    await run(db, fetcherFor({ alice: { failure: "handles: User with handle alice not found" } }));
    await run(db, fetcherFor({ alice: [submission("A", "CONTESTANT", CONTEST_START + 1)] }));

    expect(handleState(db, 1).last_sync_error).toBeNull();
  });

  it("walks the handle table oldest-cursor-first across ticks", async () => {
    insertUser(db, 2);
    insertHandle(db, 2, 2, "bob");
    insertUser(db, 3);
    insertHandle(db, 3, 3, "carol");

    const calls: string[] = [];
    const fetcher = fetcherFor({}, calls);

    const tick = (now: number) =>
      runSync(d1Shim(db), codeforcesPlatform, {
        fetcher,
        now,
        limit: 2,
        requestDelayMs: 0,
        minResyncSeconds: 0,
      });

    await tick(NOW);
    expect(calls).toEqual(["alice", "bob"]);

    await tick(NOW + 1);
    expect(calls.slice(2)).toEqual(["carol", "alice"]);
  });

  it("stops the whole batch when Codeforces reports the call limit", async () => {
    insertUser(db, 2);
    insertHandle(db, 2, 2, "bob");

    const calls: string[] = [];
    const summary = await run(
      db,
      fetcherFor({ alice: { failure: "Call limit exceeded" } }, calls),
    );

    expect(calls).toEqual(["alice"]);
    expect(summary.stoppedEarly).toBe(true);
    expect(handleState(db, 1).last_synced_at).toBe(NOW);
  });

  it("ignores events that are not in scope", async () => {
    // Gym, group, draft, still running, and detached from every ranklist.
    insertContestEvent(db, 2, "https://codeforces.com/gym/104000");
    insertContestEvent(db, 3, "https://codeforces.com/group/ABC/contest/1900");
    insertContestEvent(db, 4, "https://codeforces.com/contest/1900", { status: "draft" });
    insertContestEvent(db, 5, "https://codeforces.com/contest/1900", {
      startingAt: NOW + 1000,
      endingAt: NOW + 8000,
    });
    insertContestEvent(db, 6, "https://codeforces.com/contest/1900");
    for (const id of [2, 3, 4, 5]) attachEvent(db, 1, id, 1);

    const summary = await run(
      db,
      fetcherFor({ alice: [submission("A", "CONTESTANT", CONTEST_START + 1)] }),
    );

    expect(summary.events).toBe(1);
    for (const id of [2, 3, 4, 5, 6]) expect(performance(db, id, 1)).toBeUndefined();
  });

  it("stops syncing events once their only ranklist is locked", async () => {
    db.prepare("UPDATE ranklists SET is_locked = 1 WHERE id = 1").run();

    const summary = await run(
      db,
      fetcherFor({ alice: [submission("A", "CONTESTANT", CONTEST_START + 1)] }),
    );

    expect(summary.events).toBe(0);
    expect(summary.handlesProcessed).toBe(0);
    expect(performance(db, 1, 1)).toBeUndefined();
  });

  it("writes every row when a handle spans more events than fit in one transaction", async () => {
    // Events 100.. each map to their own contest, so one handle produces more
    // upserts than WRITE_CHUNK_SIZE and the write loop has to chunk.
    const eventCount = WRITE_CHUNK_SIZE + 5;
    const submissions: CodeforcesSubmission[] = [];
    for (let i = 0; i < eventCount; i += 1) {
      const id = 100 + i;
      const contestId = 3000 + i;
      insertContestEvent(db, id, `https://codeforces.com/contest/${contestId}`);
      attachEvent(db, 1, id, 1);
      submissions.push(
        submission("A", "CONTESTANT", CONTEST_START + 1, {
          contestId,
          problem: { contestId, index: "A" },
        }),
      );
    }

    const summary = await run(db, fetcherFor({ alice: submissions }));

    expect(summary.rowsWritten).toBe(eventCount);
    expect(performance(db, 100, 1)).toMatchObject({ solve_count: 1 });
    expect(performance(db, 100 + eventCount - 1, 1)).toMatchObject({ solve_count: 1 });
  });

  it("records a write failure and still advances the cursor", async () => {
    const d1 = d1Shim(db);
    const failing = {
      ...d1,
      prepare: d1.prepare.bind(d1),
      batch: async () => {
        throw new Error("D1_ERROR: statement timed out");
      },
    } as unknown as D1Database;

    const summary = await runSync(failing, codeforcesPlatform, {
      fetcher: fetcherFor({ alice: [submission("A", "CONTESTANT", CONTEST_START + 1)] }),
      now: NOW,
      requestDelayMs: 0,
      minResyncSeconds: 0,
    });

    expect(summary).toMatchObject({ handlesProcessed: 1, rowsWritten: 0, errors: 1 });
    expect(performance(db, 1, 1)).toBeUndefined();
    // Without this the next tick would retry the same handle forever.
    expect(handleState(db, 1)).toMatchObject({ last_synced_at: NOW });
    expect(handleState(db, 1).last_sync_error).toMatch(/timed out/);
  });

  describe("freshness window", () => {
    const TWO_HOURS = 2 * 60 * 60;

    /** The real default — no `minResyncSeconds` override. */
    const tick = (now: number, calls: string[]) =>
      runSync(d1Shim(db), codeforcesPlatform, {
        fetcher: fetcherFor({ alice: [submission("A", "CONTESTANT", CONTEST_START + 1)] }, calls),
        now,
        limit: 10,
        requestDelayMs: 0,
      });

    it("skips a handle synced inside the window", async () => {
      const first: string[] = [];
      await tick(NOW, first);
      expect(first).toEqual(["alice"]);

      // One second short of the window: still too fresh, no Codeforces call.
      const second: string[] = [];
      const summary = await tick(NOW + TWO_HOURS - 1, second);
      expect(second).toEqual([]);
      expect(summary).toMatchObject({ handlesProcessed: 0, rowsWritten: 0, errors: 0 });
    });

    it("picks the handle back up once the window has passed", async () => {
      await tick(NOW, []);

      const later: string[] = [];
      await tick(NOW + TWO_HOURS, later);
      expect(later).toEqual(["alice"]);
    });

    it("never skips a handle that has never been synced", async () => {
      const calls: string[] = [];
      await tick(NOW, calls);
      expect(calls).toEqual(["alice"]);
    });
  });

  it("auto-adds a non-member to an auto-add ranklist through the existing trigger", async () => {
    insertRanklist(db, 2, 1, { autoAddUsers: true, upsolveWeight: 0.5 });
    attachEvent(db, 2, 1, 1);
    insertUser(db, 2);
    insertHandle(db, 2, 2, "bob");

    await run(db, fetcherFor({ bob: [submission("A", "CONTESTANT", CONTEST_START + 1)] }));

    expect(member(db, 2, 2)).toMatchObject({ auto_added: 1 });
  });
});
