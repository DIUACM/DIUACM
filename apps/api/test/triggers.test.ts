// Behavioral tests for the SQLite triggers that maintain ranklist state:
// user_count / event_count (0001), score / rank (0002), and auto-add
// membership (0007). Runs every migration against an in-memory SQLite, so a
// formula or trigger change that alters behavior fails here.
import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import {
  addMember,
  applyTestMigrations,
  attachEvent,
  attend,
  eventCounts,
  insertEvent,
  insertRanklist,
  insertTracker,
  insertUser,
  member,
  openTestDb,
  openTestDbThrough,
  ranklistCounts,
  setPerformance,
} from "./db";

let db: Database.Database;

beforeEach(() => {
  db = openTestDb();
  insertTracker(db, 1);
});

describe("count triggers", () => {
  it("keeps user_count and event_count in sync with the pivot tables", () => {
    insertUser(db, 1);
    insertUser(db, 2);
    insertEvent(db, 1);
    insertRanklist(db, 1, 1);

    addMember(db, 1, 1);
    addMember(db, 1, 2);
    attachEvent(db, 1, 1, 1);
    expect(ranklistCounts(db, 1)).toEqual({ user_count: 2, event_count: 1 });

    db.prepare("DELETE FROM ranklist_user WHERE ranklist_id = 1 AND user_id = 2").run();
    db.prepare("DELETE FROM ranklist_event WHERE ranklist_id = 1 AND event_id = 1").run();
    expect(ranklistCounts(db, 1)).toEqual({ user_count: 1, event_count: 0 });
  });

  it("keeps attendance_count and performance_count in sync on events", () => {
    insertUser(db, 1);
    insertEvent(db, 1);
    insertEvent(db, 2);

    attend(db, 1, 1);
    setPerformance(db, 1, 1, 3, 1);
    expect(eventCounts(db, 1)).toEqual({ attendance_count: 1, performance_count: 1 });
    expect(eventCounts(db, 2)).toEqual({ attendance_count: 0, performance_count: 0 });

    db.prepare("UPDATE event_attendance SET event_id = 2 WHERE event_id = 1 AND user_id = 1").run();
    db.prepare("UPDATE event_performance SET event_id = 2 WHERE event_id = 1 AND user_id = 1").run();
    expect(eventCounts(db, 1)).toEqual({ attendance_count: 0, performance_count: 0 });
    expect(eventCounts(db, 2)).toEqual({ attendance_count: 1, performance_count: 1 });

    db.prepare("DELETE FROM event_attendance WHERE event_id = 2 AND user_id = 1").run();
    db.prepare("DELETE FROM event_performance WHERE event_id = 2 AND user_id = 1").run();
    expect(eventCounts(db, 2)).toEqual({ attendance_count: 0, performance_count: 0 });
  });

  it("backfills event counters for rows that predate the counter migration", () => {
    const migrationDb = openTestDbThrough(8);
    insertUser(migrationDb, 1);
    insertEvent(migrationDb, 1);
    attend(migrationDb, 1, 1);
    setPerformance(migrationDb, 1, 1, 2, 1);

    applyTestMigrations(migrationDb, 9, 9);

    expect(eventCounts(migrationDb, 1)).toEqual({
      attendance_count: 1,
      performance_count: 1,
    });
  });
});

describe("score triggers", () => {
  it("computes solve*weight + upsolve*weight*upsolveWeight", () => {
    insertUser(db, 1);
    insertEvent(db, 1);
    insertRanklist(db, 1, 1, { upsolveWeight: 0.5 });
    attachEvent(db, 1, 1, 1);
    addMember(db, 1, 1);

    setPerformance(db, 1, 1, 3, 2); // 3*1 + 2*1*0.5
    expect(member(db, 1, 1)?.score).toBeCloseTo(4);

    setPerformance(db, 1, 1, 5, 2); // update path (solve_count changed)
    expect(member(db, 1, 1)?.score).toBeCloseTo(6);

    db.prepare("DELETE FROM event_performance WHERE event_id = 1 AND user_id = 1").run();
    expect(member(db, 1, 1)?.score).toBe(0);
  });

  it("applies the event weight, and recomputes when it changes", () => {
    insertUser(db, 1);
    insertEvent(db, 1);
    insertRanklist(db, 1, 1, { upsolveWeight: 0.5 });
    attachEvent(db, 1, 1, 0.5);
    addMember(db, 1, 1);
    setPerformance(db, 1, 1, 3, 2); // 3*0.5 + 2*0.5*0.5
    expect(member(db, 1, 1)?.score).toBeCloseTo(2);

    db.prepare("UPDATE ranklist_event SET weight = 1 WHERE ranklist_id = 1 AND event_id = 1").run();
    expect(member(db, 1, 1)?.score).toBeCloseTo(4);
  });

  it("recomputes when the ranklist's upsolve_weight changes", () => {
    insertUser(db, 1);
    insertEvent(db, 1);
    insertRanklist(db, 1, 1, { upsolveWeight: 0 });
    attachEvent(db, 1, 1, 1);
    addMember(db, 1, 1);
    setPerformance(db, 1, 1, 3, 2);
    expect(member(db, 1, 1)?.score).toBeCloseTo(3);

    db.prepare("UPDATE ranklists SET upsolve_weight = 1 WHERE id = 1").run();
    expect(member(db, 1, 1)?.score).toBeCloseTo(5);
  });

  it("sums across multiple attached events", () => {
    insertUser(db, 1);
    insertEvent(db, 1);
    insertEvent(db, 2);
    insertRanklist(db, 1, 1, { upsolveWeight: 0.5 });
    attachEvent(db, 1, 1, 1);
    attachEvent(db, 1, 2, 0.5);
    addMember(db, 1, 1);
    setPerformance(db, 1, 1, 2, 0); // 2
    setPerformance(db, 2, 1, 4, 2); // 4*0.5 + 2*0.5*0.5 = 2.5
    expect(member(db, 1, 1)?.score).toBeCloseTo(4.5);

    db.prepare("DELETE FROM ranklist_event WHERE ranklist_id = 1 AND event_id = 2").run();
    expect(member(db, 1, 1)?.score).toBeCloseTo(2);
  });

  it("scopes recomputation to ranklists containing the event", () => {
    insertUser(db, 1);
    insertEvent(db, 1);
    insertEvent(db, 2);
    insertRanklist(db, 1, 1);
    insertRanklist(db, 2, 1);
    attachEvent(db, 1, 1, 1);
    attachEvent(db, 2, 2, 1);
    addMember(db, 1, 1);
    addMember(db, 2, 1);

    setPerformance(db, 1, 1, 3, 0);
    expect(member(db, 1, 1)?.score).toBeCloseTo(3);
    expect(member(db, 2, 1)?.score).toBe(0);
  });
});

describe("strict attendance", () => {
  const setup = () => {
    insertUser(db, 1);
    insertEvent(db, 1, { strictAttendance: true });
    insertRanklist(db, 1, 1, { upsolveWeight: 0.5, considerStrictAttendance: true });
    attachEvent(db, 1, 1, 1);
    addMember(db, 1, 1);
    setPerformance(db, 1, 1, 3, 2);
  };

  it("counts solves as upsolves when the user did not attend", () => {
    setup();
    // (3 + 2) * 1 * 0.5
    expect(member(db, 1, 1)?.score).toBeCloseTo(2.5);
  });

  it("restores normal scoring when attendance appears, and back when it is removed", () => {
    setup();
    attend(db, 1, 1);
    expect(member(db, 1, 1)?.score).toBeCloseTo(4); // 3 + 2*0.5

    db.prepare("DELETE FROM event_attendance WHERE event_id = 1 AND user_id = 1").run();
    expect(member(db, 1, 1)?.score).toBeCloseTo(2.5);
  });

  it("ignores strict events when the ranklist does not consider strict attendance", () => {
    insertUser(db, 1);
    insertEvent(db, 1, { strictAttendance: true });
    insertRanklist(db, 1, 1, { upsolveWeight: 0.5, considerStrictAttendance: false });
    attachEvent(db, 1, 1, 1);
    addMember(db, 1, 1);
    setPerformance(db, 1, 1, 3, 2);
    expect(member(db, 1, 1)?.score).toBeCloseTo(4);
  });

  it("recomputes when the event's strict_attendance flag flips", () => {
    insertUser(db, 1);
    insertEvent(db, 1, { strictAttendance: false });
    insertRanklist(db, 1, 1, { upsolveWeight: 0.5, considerStrictAttendance: true });
    attachEvent(db, 1, 1, 1);
    addMember(db, 1, 1);
    setPerformance(db, 1, 1, 3, 2);
    expect(member(db, 1, 1)?.score).toBeCloseTo(4);

    db.prepare("UPDATE events SET strict_attendance = 1 WHERE id = 1").run();
    expect(member(db, 1, 1)?.score).toBeCloseTo(2.5);
  });
});

describe("rank triggers", () => {
  it("assigns competition ranking (1, 2, 2, 4)", () => {
    insertEvent(db, 1);
    insertRanklist(db, 1, 1);
    attachEvent(db, 1, 1, 1);
    const solves = { 1: 10, 2: 5, 3: 5, 4: 0 } as const;
    for (const [id, solve] of Object.entries(solves)) {
      insertUser(db, Number(id));
      addMember(db, 1, Number(id));
      setPerformance(db, 1, Number(id), solve, 0);
    }

    expect(member(db, 1, 1)?.rank).toBe(1);
    expect(member(db, 1, 2)?.rank).toBe(2);
    expect(member(db, 1, 3)?.rank).toBe(2);
    expect(member(db, 1, 4)?.rank).toBe(4);
  });

  it("re-ranks remaining members when one is removed", () => {
    insertEvent(db, 1);
    insertRanklist(db, 1, 1);
    attachEvent(db, 1, 1, 1);
    for (const [id, solve] of [
      [1, 10],
      [2, 5],
      [3, 1],
    ] as const) {
      insertUser(db, id);
      addMember(db, 1, id);
      setPerformance(db, 1, id, solve, 0);
    }

    db.prepare("DELETE FROM ranklist_user WHERE ranklist_id = 1 AND user_id = 1").run();
    expect(member(db, 1, 2)?.rank).toBe(1);
    expect(member(db, 1, 3)?.rank).toBe(2);
  });
});

describe("auto-add triggers", () => {
  it("adds users for performance but ignores attendance", () => {
    insertUser(db, 1);
    insertUser(db, 2);
    insertEvent(db, 1);
    insertRanklist(db, 1, 1, { autoAddUsers: true });
    attachEvent(db, 1, 1, 1);

    setPerformance(db, 1, 1, 2, 0);
    attend(db, 1, 2);

    expect(member(db, 1, 1)?.auto_added).toBe(1);
    expect(member(db, 1, 1)?.score).toBeCloseTo(2); // score computed on auto-add
    expect(member(db, 1, 2)).toBeUndefined();
    expect(ranklistCounts(db, 1).user_count).toBe(1);
  });

  it("does not add when the flag is off", () => {
    insertUser(db, 1);
    insertEvent(db, 1);
    insertRanklist(db, 1, 1, { autoAddUsers: false });
    attachEvent(db, 1, 1, 1);
    setPerformance(db, 1, 1, 2, 0);
    expect(member(db, 1, 1)).toBeUndefined();
  });

  it("backfills performance users when an event is attached or the flag is switched on", () => {
    insertUser(db, 1);
    insertUser(db, 2);
    insertEvent(db, 1);
    setPerformance(db, 1, 1, 2, 0);
    attend(db, 1, 2);

    // Attach to an auto-add ranklist -> both participants appear.
    insertRanklist(db, 1, 1, { autoAddUsers: true });
    attachEvent(db, 1, 1, 1);
    expect(member(db, 1, 1)?.auto_added).toBe(1);
    expect(member(db, 1, 2)).toBeUndefined();

    // Flag toggled on after the fact -> the same performance-only backfill.
    insertRanklist(db, 2, 1, { autoAddUsers: false });
    attachEvent(db, 2, 1, 1);
    expect(member(db, 2, 1)).toBeUndefined();
    db.prepare("UPDATE ranklists SET auto_add_users = 1 WHERE id = 2").run();
    expect(member(db, 2, 1)?.auto_added).toBe(1);
    expect(member(db, 2, 2)).toBeUndefined();
  });

  it("removes auto members whose last performance disappears, keeping manual members", () => {
    insertUser(db, 1);
    insertUser(db, 2);
    insertEvent(db, 1);
    insertEvent(db, 2);
    insertRanklist(db, 1, 1, { autoAddUsers: true });
    attachEvent(db, 1, 1, 1);
    attachEvent(db, 1, 2, 1);

    addMember(db, 1, 2); // manual member (auto_added = 0)
    setPerformance(db, 1, 1, 2, 0); // auto member
    setPerformance(db, 2, 1, 1, 0);
    setPerformance(db, 1, 2, 3, 0);
    attend(db, 2, 1);

    // Performance in another qualifying contest keeps the auto member.
    db.prepare("DELETE FROM event_performance WHERE event_id = 1 AND user_id = 1").run();
    expect(member(db, 1, 1)?.auto_added).toBe(1);

    // Attendance does not retain them after their last performance disappears.
    db.prepare("DELETE FROM event_performance WHERE event_id = 2 AND user_id = 1").run();
    expect(member(db, 1, 1)).toBeUndefined();
    db.prepare("DELETE FROM event_performance WHERE event_id = 1 AND user_id = 2").run();
    expect(member(db, 1, 2)?.auto_added).toBe(0);
  });

  it("uses only performance from the latest 15 attached contests by starting_at", () => {
    insertUser(db, 1);
    insertUser(db, 2);
    insertRanklist(db, 1, 1, { autoAddUsers: true });

    for (let eventId = 1; eventId <= 16; eventId += 1) {
      insertEvent(db, eventId, { startingAt: eventId * 100 });
      attachEvent(db, 1, eventId, 1);
    }

    setPerformance(db, 1, 1, 1, 0); // oldest contest, outside the latest 15
    setPerformance(db, 2, 2, 1, 0); // currently the 15th-latest contest
    expect(member(db, 1, 1)).toBeUndefined();
    expect(member(db, 1, 2)?.auto_added).toBe(1);

    // Moving event 1 to the front pushes event 2 outside the rolling window.
    db.prepare("UPDATE events SET starting_at = 2000 WHERE id = 1").run();
    expect(member(db, 1, 1)?.auto_added).toBe(1);
    expect(member(db, 1, 2)).toBeUndefined();
  });

  it("ignores non-contest events and reconciles when an event type changes", () => {
    insertUser(db, 1);
    insertEvent(db, 1, { type: "class" });
    insertRanklist(db, 1, 1, { autoAddUsers: true });
    attachEvent(db, 1, 1, 1);
    setPerformance(db, 1, 1, 2, 0);
    expect(member(db, 1, 1)).toBeUndefined();

    db.prepare("UPDATE events SET type = 'contest' WHERE id = 1").run();
    expect(member(db, 1, 1)?.auto_added).toBe(1);

    db.prepare("UPDATE events SET type = 'class' WHERE id = 1").run();
    expect(member(db, 1, 1)).toBeUndefined();
  });

  it("removes only auto members when the flag is switched off or the event detached", () => {
    insertUser(db, 1);
    insertUser(db, 2);
    insertEvent(db, 1);
    insertRanklist(db, 1, 1, { autoAddUsers: true });
    attachEvent(db, 1, 1, 1);
    addMember(db, 1, 2);
    setPerformance(db, 1, 1, 2, 0);

    db.prepare("UPDATE ranklists SET auto_add_users = 0 WHERE id = 1").run();
    expect(member(db, 1, 1)).toBeUndefined();
    expect(member(db, 1, 2)).toBeDefined();
    expect(ranklistCounts(db, 1).user_count).toBe(1);

    // Re-enable, re-add via participation, then detach the event.
    db.prepare("UPDATE ranklists SET auto_add_users = 1 WHERE id = 1").run();
    expect(member(db, 1, 1)?.auto_added).toBe(1);
    db.prepare("DELETE FROM ranklist_event WHERE ranklist_id = 1 AND event_id = 1").run();
    expect(member(db, 1, 1)).toBeUndefined();
    expect(member(db, 1, 2)).toBeDefined();
  });

  it("reconciles legacy attendance and non-contest members during migration", () => {
    const migrationDb = openTestDbThrough(16);
    insertTracker(migrationDb, 1);
    for (let userId = 1; userId <= 4; userId += 1) insertUser(migrationDb, userId);
    insertEvent(migrationDb, 1);
    insertEvent(migrationDb, 2, { type: "class" });
    insertRanklist(migrationDb, 1, 1, { autoAddUsers: true });
    attachEvent(migrationDb, 1, 1, 1);
    attachEvent(migrationDb, 1, 2, 1);

    attend(migrationDb, 1, 1);
    setPerformance(migrationDb, 2, 2, 2, 0);
    setPerformance(migrationDb, 1, 3, 3, 0);
    addMember(migrationDb, 1, 4);
    expect(ranklistCounts(migrationDb, 1).user_count).toBe(4);

    applyTestMigrations(migrationDb, 17, 17);

    expect(member(migrationDb, 1, 1)).toBeUndefined();
    expect(member(migrationDb, 1, 2)).toBeUndefined();
    expect(member(migrationDb, 1, 3)?.auto_added).toBe(1);
    expect(member(migrationDb, 1, 4)?.auto_added).toBe(0);
    expect(ranklistCounts(migrationDb, 1).user_count).toBe(2);
  });
});

describe("cascade deletes", () => {
  it("deleting an event fires the score/count/auto-add maintenance", () => {
    insertUser(db, 1);
    insertEvent(db, 1);
    insertRanklist(db, 1, 1, { autoAddUsers: true });
    attachEvent(db, 1, 1, 1);
    setPerformance(db, 1, 1, 3, 0);
    expect(member(db, 1, 1)?.score).toBeCloseTo(3);

    db.prepare("DELETE FROM events WHERE id = 1").run();
    // ranklist_event cascades away -> event_count back to 0, auto member removed.
    expect(ranklistCounts(db, 1)).toEqual({ user_count: 0, event_count: 0 });
    expect(member(db, 1, 1)).toBeUndefined();
  });

  it("deleting a user re-ranks the remaining members and fixes user_count", () => {
    insertEvent(db, 1);
    insertRanklist(db, 1, 1);
    attachEvent(db, 1, 1, 1);
    for (const [id, solve] of [
      [1, 10],
      [2, 5],
    ] as const) {
      insertUser(db, id);
      addMember(db, 1, id);
      setPerformance(db, 1, id, solve, 0);
    }
    expect(member(db, 1, 2)?.rank).toBe(2);

    db.prepare("DELETE FROM users WHERE id = 1").run();
    expect(member(db, 1, 1)).toBeUndefined();
    expect(member(db, 1, 2)?.rank).toBe(1);
    expect(ranklistCounts(db, 1).user_count).toBe(1);
  });
});
