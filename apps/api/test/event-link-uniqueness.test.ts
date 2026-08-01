import { describe, expect, it } from "vitest";

import { applyTestMigrations, openTestDbThrough } from "./db";

describe("event link uniqueness migration", () => {
  it("preserves duplicate events and keeps the link on the oldest one", () => {
    const db = openTestDbThrough(18);
    const insert = db.prepare(
      "INSERT INTO events (title, type, starting_at, ending_at, event_link) VALUES (?, 'contest', 1000, 2000, ?)",
    );
    const link = "https://vjudge.net/contest/700000";
    insert.run("First", link);
    insert.run("Second", link);

    applyTestMigrations(db, 19, 19);

    expect(db.prepare("SELECT id, event_link FROM events ORDER BY id").all()).toEqual([
      { id: 1, event_link: link },
      { id: 2, event_link: null },
    ]);
  });

  it("rejects newly duplicated links while allowing multiple null links", () => {
    const db = openTestDbThrough(19);
    const insert = db.prepare(
      "INSERT INTO events (title, type, starting_at, ending_at, event_link) VALUES (?, 'contest', 1000, 2000, ?)",
    );
    const link = "https://atcoder.jp/contests/abc469";
    insert.run("First", link);

    expect(() => insert.run("Second", link)).toThrow(/UNIQUE constraint failed/);
    expect(() => insert.run("No link 1", null)).not.toThrow();
    expect(() => insert.run("No link 2", null)).not.toThrow();
  });
});
