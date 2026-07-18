import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

const MIGRATIONS_DIR = fileURLToPath(new URL("../drizzle", import.meta.url));

/**
 * An in-memory SQLite database with every drizzle migration applied, in
 * journal order — the same schema + triggers production D1 runs.
 */
export function openTestDb(): Database.Database {
  const db = new Database(":memory:");
  // D1 runs with foreign keys enforced; cascade behavior depends on it.
  db.pragma("foreign_keys = ON");

  const journal = JSON.parse(
    readFileSync(join(MIGRATIONS_DIR, "meta", "_journal.json"), "utf8"),
  ) as { entries: { tag: string }[] };

  for (const entry of journal.entries) {
    const sql = readFileSync(join(MIGRATIONS_DIR, `${entry.tag}.sql`), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      const trimmed = statement.trim();
      if (trimmed) db.exec(trimmed);
    }
  }
  return db;
}

// ---------------------------------------------------------------------------
// Seed helpers — minimal rows with sensible defaults, ids chosen by the tests.
// ---------------------------------------------------------------------------

export const insertUser = (db: Database.Database, id: number) =>
  db
    .prepare("INSERT INTO users (id, name, email, username) VALUES (?, ?, ?, ?)")
    .run(id, `User ${id}`, `user${id}@example.com`, `user${id}`);

export const insertEvent = (
  db: Database.Database,
  id: number,
  opts: { strictAttendance?: boolean } = {},
) =>
  db
    .prepare(
      "INSERT INTO events (id, title, starting_at, ending_at, strict_attendance) VALUES (?, ?, 1000, 2000, ?)",
    )
    .run(id, `Event ${id}`, opts.strictAttendance ? 1 : 0);

export const insertTracker = (db: Database.Database, id: number) =>
  db
    .prepare("INSERT INTO trackers (id, title, slug) VALUES (?, ?, ?)")
    .run(id, `Tracker ${id}`, `tracker-${id}`);

export const insertRanklist = (
  db: Database.Database,
  id: number,
  trackerId: number,
  opts: {
    upsolveWeight?: number;
    considerStrictAttendance?: boolean;
    autoAddUsers?: boolean;
  } = {},
) =>
  db
    .prepare(
      "INSERT INTO ranklists (id, tracker_id, keyword, upsolve_weight, consider_strict_attendance, auto_add_users) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      id,
      trackerId,
      `keyword-${id}`,
      opts.upsolveWeight ?? 0,
      opts.considerStrictAttendance ? 1 : 0,
      opts.autoAddUsers ? 1 : 0,
    );

export const attachEvent = (
  db: Database.Database,
  ranklistId: number,
  eventId: number,
  weight: number,
) =>
  db
    .prepare("INSERT INTO ranklist_event (ranklist_id, event_id, weight) VALUES (?, ?, ?)")
    .run(ranklistId, eventId, weight);

export const addMember = (
  db: Database.Database,
  ranklistId: number,
  userId: number,
  autoAdded = false,
) =>
  db
    .prepare("INSERT INTO ranklist_user (ranklist_id, user_id, auto_added) VALUES (?, ?, ?)")
    .run(ranklistId, userId, autoAdded ? 1 : 0);

export const setPerformance = (
  db: Database.Database,
  eventId: number,
  userId: number,
  solveCount: number,
  upsolveCount: number,
) =>
  db
    .prepare(
      "INSERT INTO event_performance (event_id, user_id, solve_count, upsolve_count) VALUES (?, ?, ?, ?) ON CONFLICT (event_id, user_id) DO UPDATE SET solve_count = excluded.solve_count, upsolve_count = excluded.upsolve_count",
    )
    .run(eventId, userId, solveCount, upsolveCount);

export const attend = (db: Database.Database, eventId: number, userId: number) =>
  db
    .prepare("INSERT INTO event_attendance (event_id, user_id) VALUES (?, ?)")
    .run(eventId, userId);

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

export type MemberRow = {
  ranklist_id: number;
  user_id: number;
  score: number;
  rank: number;
  auto_added: number;
};

export const member = (
  db: Database.Database,
  ranklistId: number,
  userId: number,
): MemberRow | undefined =>
  db
    .prepare("SELECT * FROM ranklist_user WHERE ranklist_id = ? AND user_id = ?")
    .get(ranklistId, userId) as MemberRow | undefined;

export const ranklistCounts = (
  db: Database.Database,
  id: number,
): { user_count: number; event_count: number } =>
  db
    .prepare("SELECT user_count, event_count FROM ranklists WHERE id = ?")
    .get(id) as { user_count: number; event_count: number };
