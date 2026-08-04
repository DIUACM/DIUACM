import { describe, expect, it } from "vitest";

import { applyTestMigrations, openTestDbThrough } from "./db";

describe("username uniqueness migration", () => {
  it("preserves capitalization and rejects case-only duplicates", () => {
    const db = openTestDbThrough(20);
    db.prepare(
      "INSERT INTO users (id, name, email, username) VALUES (1, 'Nahid', 'nahid@example.com', 'Nahid')",
    ).run();

    applyTestMigrations(db, 21, 21);

    expect(db.prepare("SELECT username FROM users WHERE id = 1").get()).toEqual({
      username: "Nahid",
    });
    expect(() =>
      db
        .prepare(
          "INSERT INTO users (id, name, email, username) VALUES (2, 'Other', 'other@example.com', 'nahid')",
        )
        .run(),
    ).toThrow(/UNIQUE constraint failed/);
  });
});
