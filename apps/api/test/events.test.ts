import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/index";
import { d1Shim } from "./d1";
import { insertEvent, insertUser, openTestDb, setPerformance } from "./db";

describe("event routes", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openTestDb();
    insertEvent(db, 1);
    db.prepare("UPDATE events SET status = 'published' WHERE id = 1").run();
  });

  it("orders performance by solves, then upsolves, with stable ties", async () => {
    for (const id of [1, 2, 3, 4]) insertUser(db, id);

    setPerformance(db, 1, 1, 5, 1);
    setPerformance(db, 1, 2, 7, 0);
    setPerformance(db, 1, 3, 5, 3);
    setPerformance(db, 1, 4, 5, 3);

    // Recorded positions deliberately disagree with the requested API order.
    db.prepare(
      "UPDATE event_performance SET position = CASE user_id WHEN 1 THEN 1 WHEN 2 THEN 4 WHEN 3 THEN 3 WHEN 4 THEN 2 END WHERE event_id = 1",
    ).run();

    const response = await app.request(
      "/events/1/performance",
      {},
      { DB: d1Shim(db), CORS_ORIGINS: "" },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(
      body.data.map(
        (row: { user: { id: number }; solveCount: number; upsolveCount: number }) => [
          row.user.id,
          row.solveCount,
          row.upsolveCount,
        ],
      ),
    ).toEqual([
      [2, 7, 0],
      [3, 5, 3],
      [4, 5, 3],
      [1, 5, 1],
    ]);
  });
});
