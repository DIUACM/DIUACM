import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import { pairResults, runCfRatingSync } from "../src/sync/cf-rating";
import { d1Shim } from "./d1";
import { insertUser, openTestDb } from "./db";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = 1_800_000_000;

/**
 * An account as Codeforces would report it. `handle` present means the account
 * answers to a different name than the one asked for — a rename, or just a
 * casing correction. `maxRating` absent means unrated.
 */
type Account = { handle?: string; maxRating?: number };
type Fixture = Record<string, Account | "invalid" | "outage">;

/**
 * A `user.info` fetcher over the fixture, faithful to the two behaviours the job
 * is built around: any unknown handle fails the *whole* call with a null result,
 * and the accounts that do come back are in request order.
 */
const fetcherFor = (accounts: Fixture, calls: string[][] = []): typeof fetch => {
  const byLower = new Map<string, Account | "invalid" | "outage">();
  for (const [key, value] of Object.entries(accounts)) byLower.set(key.toLowerCase(), value);

  return (async (input: RequestInfo | URL) => {
    const url = new URL(input.toString());
    const handles = (url.searchParams.get("handles") ?? "").split(";").filter(Boolean);
    calls.push(handles);

    if (handles.some((handle) => byLower.get(handle.toLowerCase()) === "outage")) {
      return new Response("", { status: 503 });
    }

    const dead = handles.find(
      (handle) => (byLower.get(handle.toLowerCase()) ?? "invalid") === "invalid",
    );
    if (dead) {
      return new Response(
        JSON.stringify({
          status: "FAILED",
          comment: `handles: User with handle ${dead} not found`,
          result: null,
        }),
        { status: 400 },
      );
    }

    const result = handles.map((handle) => {
      const account = byLower.get(handle.toLowerCase()) as Account;
      const canonical = account.handle ?? handle;
      return account.maxRating === undefined
        ? { handle: canonical }
        : { handle: canonical, maxRating: account.maxRating };
    });
    return new Response(JSON.stringify({ status: "OK", result }), { status: 200 });
  }) as unknown as typeof fetch;
};

const insertHandle = (
  db: Database.Database,
  id: number,
  userId: number,
  handle: string,
  opts: { lastSyncedAt?: number; lastSyncError?: string } = {},
) =>
  db
    .prepare(
      "INSERT INTO user_handles (id, user_id, type, handle, last_synced_at, last_sync_error) VALUES (?, ?, 'codeforces', ?, ?, ?)",
    )
    .run(id, userId, handle, opts.lastSyncedAt ?? null, opts.lastSyncError ?? null);

const setRating = (db: Database.Database, userId: number, rating: number | null) =>
  db.prepare("UPDATE users SET max_cf_rating = ? WHERE id = ?").run(rating, userId);

const userRow = (db: Database.Database, userId: number) =>
  db.prepare("SELECT max_cf_rating, updated_at FROM users WHERE id = ?").get(userId) as {
    max_cf_rating: number | null;
    updated_at: number;
  };

const handleRow = (db: Database.Database, id: number) =>
  db
    .prepare(
      "SELECT handle, updated_at, last_synced_at, last_sync_error FROM user_handles WHERE id = ?",
    )
    .get(id) as {
    handle: string;
    updated_at: number;
    last_synced_at: number | null;
    last_sync_error: string | null;
  };

/** No sleeping and no clock dependence; the delays have their own coverage. */
const run = (
  db: Database.Database,
  fetcher: typeof fetch,
  options: { chunkSize?: number; timeBudgetMs?: number } = {},
) =>
  runCfRatingSync(d1Shim(db), {
    fetcher,
    now: NOW,
    requestDelayMs: 0,
    retryDelayMs: 0,
    ...options,
  });

// ---------------------------------------------------------------------------

describe("runCfRatingSync — ratings", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openTestDb();
    insertUser(db, 1);
    insertUser(db, 2);
    insertHandle(db, 1, 1, "alice");
    insertHandle(db, 2, 2, "bob");
  });

  it("reads every handle in one call and writes the ratings back", async () => {
    setRating(db, 2, 1500);
    const calls: string[][] = [];
    const summary = await run(
      db,
      fetcherFor({ alice: { maxRating: 1900 }, bob: { maxRating: 1500 } }, calls),
    );

    expect(calls).toEqual([["alice", "bob"]]);
    expect(summary.checked).toBe(2);
    expect(userRow(db, 1).max_cf_rating).toBe(1900);
    expect(userRow(db, 2).max_cf_rating).toBe(1500);
    // Bob's rating already matched, so only Alice's was worth a statement.
    expect(summary.ratingsUpdated).toBe(1);
  });

  it("writes nothing at all when every rating already matches", async () => {
    setRating(db, 1, 1900);
    setRating(db, 2, 1500);
    const summary = await run(
      db,
      fetcherFor({ alice: { maxRating: 1900 }, bob: { maxRating: 1500 } }),
    );

    expect(summary.ratingsUpdated).toBe(0);
    expect(summary.checked).toBe(2);
  });

  it("clears the rating for an account Codeforces reports as unrated", async () => {
    setRating(db, 1, 1200);
    const summary = await run(db, fetcherFor({ alice: {}, bob: { maxRating: 1500 } }));

    expect(userRow(db, 1).max_cf_rating).toBeNull();
    expect(summary.ratingsUpdated).toBe(2);
  });

  it("leaves users.updated_at alone — that column means a person edited the profile", async () => {
    const before = userRow(db, 1).updated_at;
    await run(db, fetcherFor({ alice: { maxRating: 1900 }, bob: { maxRating: 1500 } }));

    expect(userRow(db, 1).max_cf_rating).toBe(1900);
    expect(userRow(db, 1).updated_at).toBe(before);
  });
});

describe("runCfRatingSync — handles", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openTestDb();
    insertUser(db, 1);
    insertUser(db, 2);
  });

  it("rewrites a renamed handle and clears its solve-sync cursor", async () => {
    insertHandle(db, 1, 1, "oldalice", {
      lastSyncedAt: NOW - 100,
      lastSyncError: "Invalid Codeforces handle.",
    });
    const summary = await run(
      db,
      fetcherFor({ oldalice: { handle: "newalice", maxRating: 1600 } }),
    );

    expect(summary.handlesRenamed).toBe(1);
    const row = handleRow(db, 1);
    expect(row.handle).toBe("newalice");
    expect(row.updated_at).toBe(NOW);
    // Null cursor, so the solve sync picks it up on its next tick rather than
    // after the two-hour freshness window — its counts froze at the rename.
    expect(row.last_synced_at).toBeNull();
    expect(row.last_sync_error).toBeNull();
    expect(userRow(db, 1).max_cf_rating).toBe(1600);
  });

  it("corrects casing without disturbing the cursor", async () => {
    insertHandle(db, 1, 1, "ALICE", { lastSyncedAt: NOW - 100 });
    const summary = await run(db, fetcherFor({ alice: { handle: "alice", maxRating: 1600 } }));

    expect(summary).toMatchObject({ handlesRecased: 1, handlesRenamed: 0 });
    const row = handleRow(db, 1);
    expect(row.handle).toBe("alice");
    // Codeforces is case-insensitive, so nothing was ever broken here.
    expect(row.last_synced_at).toBe(NOW - 100);
  });

  it("reports a rename that collides with another row, leaving both intact", async () => {
    insertHandle(db, 1, 1, "oldalice");
    insertHandle(db, 2, 2, "newalice");
    const summary = await run(
      db,
      fetcherFor({
        oldalice: { handle: "newalice", maxRating: 1600 },
        newalice: { handle: "newalice", maxRating: 1700 },
      }),
    );

    expect(summary.renameConflicts).toEqual([
      {
        from: "oldalice",
        to: "newalice",
        userId: 1,
        userName: "User 1",
        heldBy: "User 2 <user2@example.com>",
      },
    ]);
    expect(handleRow(db, 1).handle).toBe("oldalice");
    expect(handleRow(db, 2).handle).toBe("newalice");
    expect(summary.handlesRenamed).toBe(0);
  });
});

describe("runCfRatingSync — dead handles", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openTestDb();
    for (const id of [1, 2, 3, 4]) {
      insertUser(db, id);
      insertHandle(db, id, id, `user${id}`);
      setRating(db, id, 1000);
    }
  });

  it("halves the batch to isolate the dead handle, and changes nothing for it", async () => {
    const calls: string[][] = [];
    const summary = await run(
      db,
      fetcherFor(
        {
          user1: { maxRating: 1100 },
          user2: { maxRating: 1200 },
          user3: "invalid",
          user4: { maxRating: 1400 },
        },
        calls,
      ),
      { chunkSize: 4 },
    );

    expect(summary.invalid).toEqual([
      {
        handleId: 3,
        handle: "user3",
        userId: 3,
        userName: "User 3",
        userEmail: "user3@example.com",
      },
    ]);
    // The full call, then [1,2] ok, [3,4] bad, [3] bad, [4] ok.
    expect(calls).toEqual([
      ["user1", "user2", "user3", "user4"],
      ["user1", "user2"],
      ["user3", "user4"],
      ["user3"],
      ["user4"],
    ]);

    // Nothing at all happens to the dead handle's row or its owner's rating.
    expect(handleRow(db, 3).handle).toBe("user3");
    expect(userRow(db, 3).max_cf_rating).toBe(1000);
    // The live handles in the same chunk are still refreshed.
    expect(summary.checked).toBe(3);
    expect(userRow(db, 1).max_cf_rating).toBe(1100);
    expect(userRow(db, 4).max_cf_rating).toBe(1400);
  });

  it("never mislabels an unreachable judge as a dead handle", async () => {
    const calls: string[][] = [];
    const summary = await run(db, fetcherFor({ user1: "outage" }, calls), { chunkSize: 4 });

    expect(summary.invalid).toEqual([]);
    expect(summary.checked).toBe(0);
    expect(summary.chunksFailed).toBe(1);
    expect(Object.values(summary.errorReasons)).toEqual([1]);
    // Retried once before giving the chunk up for the day.
    expect(calls).toHaveLength(2);
    expect(userRow(db, 1).max_cf_rating).toBe(1000);
  });

  it("keeps going after a failed chunk rather than abandoning the rest", async () => {
    const summary = await run(
      db,
      // user1 poisons the first chunk of two; the second chunk is fine.
      fetcherFor({ user1: "outage", user3: { maxRating: 1300 }, user4: { maxRating: 1400 } }),
      { chunkSize: 2 },
    );

    expect(summary.chunksFailed).toBe(1);
    expect(summary.checked).toBe(2);
    expect(userRow(db, 3).max_cf_rating).toBe(1300);
    expect(userRow(db, 1).max_cf_rating).toBe(1000);
  });

  it("stops outright on the call limit, since the next call would be refused too", async () => {
    const calls: string[][] = [];
    const fetcher = (async (input: RequestInfo | URL) => {
      calls.push([input.toString()]);
      return new Response(JSON.stringify({ status: "FAILED", comment: "Call limit exceeded" }), {
        status: 400,
      });
    }) as unknown as typeof fetch;

    const summary = await run(db, fetcher, { chunkSize: 2 });

    expect(summary.stoppedReason).toBe("rate-limit");
    expect(summary.checked).toBe(0);
    // No retry and no second chunk.
    expect(calls).toHaveLength(1);
  });

  it("stops on the time budget, leaving the rest for tomorrow", async () => {
    const summary = await run(db, fetcherFor({}), { timeBudgetMs: -1 });

    expect(summary).toMatchObject({ stoppedReason: "time-budget", checked: 0, handles: 4 });
  });
});

describe("pairResults", () => {
  const row = (id: number, handle: string) => ({
    id,
    user_id: id,
    handle,
    max_cf_rating: null,
    name: `User ${id}`,
    email: `user${id}@example.com`,
  });

  it("matches unchanged handles by name rather than trusting position", async () => {
    // Deliberately out of order: everything still lands on the right row.
    const paired = pairResults(
      [row(1, "alice"), row(2, "bob")],
      [
        { handle: "bob", maxRating: 1500 },
        { handle: "alice", maxRating: 1900 },
      ],
    );

    expect(paired.map(({ row: r, user }) => [r.handle, user.maxRating])).toEqual([
      ["alice", 1900],
      ["bob", 1500],
    ]);
  });

  it("falls back to request order for the renamed remainder", async () => {
    const paired = pairResults(
      [row(1, "alice"), row(2, "oldbob"), row(3, "carol")],
      [
        { handle: "alice", maxRating: 1900 },
        { handle: "newbob", maxRating: 1500 },
        { handle: "carol", maxRating: 1300 },
      ],
    );

    expect(paired.find(({ row: r }) => r.id === 2)?.user.handle).toBe("newbob");
    expect(paired).toHaveLength(3);
  });
});
