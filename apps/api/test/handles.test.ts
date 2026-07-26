import { afterEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { userHandles } from "../src/db/schema";
import { toHandlesMap } from "../src/lib/user-shape";
import {
  SELF_VJUDGE_INSERT_SQL,
  SELF_VJUDGE_UPDATE_SQL,
} from "../src/lib/vjudge-handles";
import {
  applyTestMigrations,
  insertUser,
  openTestDb,
  openTestDbThrough,
} from "./db";

import type Database from "better-sqlite3";

let db: Database.Database | undefined;

afterEach(() => {
  db?.close();
  db = undefined;
});

const addHandle = (
  database: Database.Database,
  userId: number,
  type: "codeforces" | "vjudge" | "atcoder",
  handle: string,
) =>
  database
    .prepare("INSERT INTO user_handles (user_id, type, handle) VALUES (?, ?, ?)")
    .run(userId, type, handle);

describe("user handle constraints", () => {
  it("allows multiple VJudge handles for one user", () => {
    db = openTestDb();
    insertUser(db, 1);

    addHandle(db, 1, "vjudge", "alpha");
    addHandle(db, 1, "vjudge", "beta");

    const count = db
      .prepare(
        "SELECT COUNT(*) AS value FROM user_handles WHERE user_id = 1 AND type = 'vjudge'",
      )
      .get() as { value: number };
    expect(count.value).toBe(2);
  });

  it("still limits Codeforces and AtCoder to one handle per user", () => {
    db = openTestDb();
    insertUser(db, 1);

    addHandle(db, 1, "codeforces", "cf-one");
    addHandle(db, 1, "atcoder", "ac-one");

    expect(() => addHandle(db!, 1, "codeforces", "cf-two")).toThrow(
      /UNIQUE constraint failed/,
    );
    expect(() => addHandle(db!, 1, "atcoder", "ac-two")).toThrow(
      /UNIQUE constraint failed/,
    );
  });

  it("upserts a user's non-VJudge handle through the partial index", () => {
    db = openTestDb();
    insertUser(db, 1);
    const orm = drizzle(db);

    orm
      .insert(userHandles)
      .values({ userId: 1, type: "codeforces", handle: "old" })
      .run();
    orm
      .insert(userHandles)
      .values({ userId: 1, type: "codeforces", handle: "new" })
      .onConflictDoUpdate({
        target: [userHandles.userId, userHandles.type],
        targetWhere: sql`${userHandles.type} <> 'vjudge'`,
        set: { handle: "new" },
      })
      .run();

    const handle = db
      .prepare(
        "SELECT handle FROM user_handles WHERE user_id = 1 AND type = 'codeforces'",
      )
      .pluck()
      .get();
    expect(handle).toBe("new");
  });

  it("keeps every platform handle globally unique", () => {
    db = openTestDb();
    insertUser(db, 1);
    insertUser(db, 2);
    addHandle(db, 1, "vjudge", "shared");

    expect(() => addHandle(db!, 2, "vjudge", "shared")).toThrow(
      /UNIQUE constraint failed/,
    );
  });

  it("migrates an existing single-handle database without losing data", () => {
    db = openTestDbThrough(11);
    insertUser(db, 1);
    addHandle(db, 1, "vjudge", "before-migration");

    applyTestMigrations(db, 12, 12);
    addHandle(db, 1, "vjudge", "after-migration");

    const rows = db
      .prepare(
        "SELECT handle FROM user_handles WHERE user_id = 1 AND type = 'vjudge' ORDER BY id",
      )
      .all() as { handle: string }[];
    expect(rows.map((row) => row.handle)).toEqual([
      "before-migration",
      "after-migration",
    ]);
  });
});

describe("self-service VJudge writes", () => {
  it("creates one handle, edits a sole handle, and rejects editing multiple handles", () => {
    db = openTestDb();
    insertUser(db, 1);

    const inserted = db
      .prepare(SELF_VJUDGE_INSERT_SQL)
      .run(1, "first", 100, 100, 1);
    expect(inserted.changes).toBe(1);

    const duplicateInsert = db
      .prepare(SELF_VJUDGE_INSERT_SQL)
      .run(1, "second", 101, 101, 1);
    expect(duplicateInsert.changes).toBe(0);

    const updated = db
      .prepare(SELF_VJUDGE_UPDATE_SQL)
      .run("second", 101, 1, 1);
    expect(updated.changes).toBe(1);

    addHandle(db, 1, "vjudge", "admin-added");
    const blocked = db
      .prepare(SELF_VJUDGE_UPDATE_SQL)
      .run("not-allowed", 102, 1, 1);
    expect(blocked.changes).toBe(0);
  });
});

describe("handle response shape", () => {
  it("groups entries by platform and sorts them by id", () => {
    expect(
      toHandlesMap([
        { id: 4, type: "vjudge", handle: "later" },
        { id: 1, type: "codeforces", handle: "tourist" },
        { id: 3, type: "vjudge", handle: "earlier" },
      ]),
    ).toEqual({
      codeforces: [{ id: 1, handle: "tourist" }],
      vjudge: [
        { id: 3, handle: "earlier" },
        { id: 4, handle: "later" },
      ],
      atcoder: [],
    });
  });
});
