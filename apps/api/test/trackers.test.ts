import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/index";
import { d1Shim } from "./d1";
import {
  addMember,
  attachEvent,
  attend,
  insertEvent,
  insertRanklist,
  insertTracker,
  insertUser,
  openTestDb,
  setPerformance,
} from "./db";

describe("ranklist standings", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openTestDb();
    insertTracker(db, 1);
    db.prepare("UPDATE trackers SET status = 'published' WHERE id = 1").run();
  });

  it("moves solves to upsolves for an absent user when both strict-attendance flags apply", async () => {
    insertUser(db, 1);
    insertUser(db, 2);
    insertEvent(db, 1, { strictAttendance: true });
    insertEvent(db, 2, { strictAttendance: false, startingAt: 2000 });
    insertRanklist(db, 1, 1, {
      considerStrictAttendance: true,
      upsolveWeight: 0.5,
    });
    db.prepare("UPDATE ranklists SET status = 'published' WHERE id = 1").run();
    attachEvent(db, 1, 1, 1);
    attachEvent(db, 1, 2, 1);
    addMember(db, 1, 1);
    addMember(db, 1, 2);

    setPerformance(db, 1, 1, 3, 2);
    setPerformance(db, 1, 2, 3, 2);
    setPerformance(db, 2, 1, 4, 1);
    attend(db, 1, 2);

    const response = await app.request(
      "/trackers/tracker-1/keyword-1",
      {},
      { DB: d1Shim(db), CORS_ORIGINS: "" },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    const absentUser = body.users.find(
      (standing: { user: { id: number } }) => standing.user.id === 1,
    );
    const attendingUser = body.users.find(
      (standing: { user: { id: number } }) => standing.user.id === 2,
    );

    const absentPerformance = new Map(
      absentUser.performance.map(
        (entry: { eventId: number }) => [entry.eventId, entry] as const,
      ),
    );
    expect(absentPerformance.get(1)).toEqual({
      eventId: 1,
      position: null,
      solveCount: 0,
      upsolveCount: 5,
    });
    expect(absentPerformance.get(2)).toEqual({
      eventId: 2,
      position: null,
      solveCount: 4,
      upsolveCount: 1,
    });
    expect(attendingUser.performance).toEqual([
      { eventId: 1, position: null, solveCount: 3, upsolveCount: 2 },
    ]);

    db.prepare("UPDATE ranklists SET consider_strict_attendance = 0 WHERE id = 1").run();
    const nonStrictResponse = await app.request(
      "/trackers/tracker-1/keyword-1",
      {},
      { DB: d1Shim(db), CORS_ORIGINS: "" },
    );
    const nonStrictBody = await nonStrictResponse.json();
    const nonStrictUser = nonStrictBody.users.find(
      (standing: { user: { id: number } }) => standing.user.id === 1,
    );
    expect(
      nonStrictUser.performance.find(
        (entry: { eventId: number }) => entry.eventId === 1,
      ),
    ).toEqual({ eventId: 1, position: null, solveCount: 3, upsolveCount: 2 });
  });

  it("returns banned users last with their public reason and score -1", async () => {
    insertUser(db, 1);
    insertUser(db, 2);
    insertEvent(db, 1);
    insertRanklist(db, 1, 1);
    db.prepare("UPDATE ranklists SET status = 'published' WHERE id = 1").run();
    attachEvent(db, 1, 1, 1);
    addMember(db, 1, 1);
    addMember(db, 1, 2);
    setPerformance(db, 1, 1, 1, 0);
    setPerformance(db, 1, 2, 10, 0);
    db.prepare("UPDATE users SET is_banned = 1, ban_reason = 'Public reason' WHERE id = 2").run();

    const response = await app.request(
      "/trackers/tracker-1/keyword-1",
      {},
      { DB: d1Shim(db), CORS_ORIGINS: "" },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.users.map((row: { user: { id: number } }) => row.user.id)).toEqual([1, 2]);
    expect(body.users[1]).toMatchObject({
      score: -1,
      rank: 2,
      user: { isBanned: true, banReason: "Public reason" },
    });
  });
});
