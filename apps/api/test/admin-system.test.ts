import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/index";
import { signAuthToken } from "../src/lib/jwt";
import { d1Shim } from "./d1";
import { insertUser, openTestDb } from "./db";

const JWT_SECRET = "test-secret";
const NOW = Math.floor(Date.now() / 1000);

describe("GET /admin/system", () => {
  let db: Database.Database;
  let env: Record<string, unknown>;

  const insertRun = (
    job: string,
    startedAt: number,
    status = "ok",
    rowsWritten: number | null = null,
    faults: string | null = null,
    summary: string | null = null,
  ) =>
    db
      .prepare(
        "INSERT INTO cron_runs (job, started_at, duration_ms, status, faults, rows_written, errors, summary) " +
          "VALUES (?, ?, 2500, ?, ?, ?, 0, ?)",
      )
      .run(job, startedAt, status, faults, rowsWritten, summary);

  const tokenFor = (userId: number, username: string) =>
    signAuthToken({ id: userId, username }, JWT_SECRET);

  const call = async (path: string, token: string, init: RequestInit = {}) =>
    app.request(path, { ...init, headers: { Authorization: `Bearer ${token}` } }, env);

  beforeEach(() => {
    db = openTestDb();
    env = {
      DB: d1Shim(db),
      JWT_SECRET,
      SUPER_ADMIN_EMAIL: "super@example.com",
      CORS_ORIGINS: "",
    };

    // A plain admin holding only manage_system — the point of the permission is
    // that health is visible without handing over the rest of the panel.
    insertUser(db, 1);
    db.prepare(
      "INSERT INTO user_permissions (user_id, permission) VALUES (1, 'manage_system')",
    ).run();
    // Somebody with a different admin permission, to prove it does not carry.
    insertUser(db, 2);
    db.prepare("INSERT INTO user_permissions (user_id, permission) VALUES (2, 'manage_blog')").run();
  });

  it("refuses a caller without manage_system", async () => {
    const res = await call("/admin/system/health", await tokenFor(2, "user2"));
    expect(res.status).toBe(403);
  });

  it("refuses an anonymous caller", async () => {
    const res = await app.request("/admin/system/health", {}, env);
    expect(res.status).toBe(401);
  });

  it("reports every job even before any of them has run", async () => {
    const res = await call("/admin/system/health", await tokenFor(1, "user1"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      livenessReady: boolean
      recordingSince: number | null
      jobs: { job: string; expected: number | null; observed: number; recent: unknown[] }[]
      notices: unknown[]
    };

    expect(body.jobs.map((job) => job.job)).toEqual([
      "codeforces",
      "atcoder",
      "vjudge",
      "codeforces-rating",
      "digest",
    ]);
    expect(body.recordingSince).toBeNull();
    // Nothing recorded yet, so the tick counts describe the ledger's age rather
    // than the jobs' health and the page must be told not to trust them.
    expect(body.livenessReady).toBe(false);
    expect(body.jobs.every((job) => job.observed === 0 && job.recent.length === 0)).toBe(true);
    expect(body.notices).toEqual([]);
  });

  it("summarises the last day and the recent run strip per job", async () => {
    insertRun("codeforces", NOW - 1800, "ok", 12);
    insertRun("codeforces", NOW - 900, "degraded", 3, "codeforces:blocked");
    insertRun("codeforces", NOW - 60, "ok", 5);
    insertRun("vjudge", NOW - 120, "crashed", null, "vjudge:run-failed");

    const res = await call("/admin/system/health", await tokenFor(1, "user1"));
    const body = (await res.json()) as {
      jobs: {
        job: string
        lastStatus: string | null
        lastFaults: string[]
        day: { runs: number; ok: number; degraded: number; crashed: number; rowsWritten: number }
        recent: { startedAt: number; status: string }[]
      }[]
    };

    const codeforces = body.jobs.find((job) => job.job === "codeforces")!;
    expect(codeforces.day).toMatchObject({ runs: 3, ok: 2, degraded: 1, crashed: 0, rowsWritten: 20 });
    expect(codeforces.lastStatus).toBe("ok");
    // Oldest first, so the client can render the strip left-to-right as given.
    expect(codeforces.recent.map((run) => run.startedAt)).toEqual([
      NOW - 1800,
      NOW - 900,
      NOW - 60,
    ]);

    const vjudge = body.jobs.find((job) => job.job === "vjudge")!;
    expect(vjudge.lastStatus).toBe("crashed");
    expect(vjudge.lastFaults).toEqual(["vjudge:run-failed"]);
  });

  it("returns open faults with their detail", async () => {
    db.prepare(
      "INSERT INTO admin_notices (key, first_seen_at, last_seen_at, last_sent_at, occurrences, last_detail) " +
        "VALUES ('codeforces:blocked', ?, ?, ?, 4, 'Judge refused a request.')",
    ).run(NOW - 7200, NOW - 600, NOW - 3600);

    const res = await call("/admin/system/health", await tokenFor(1, "user1"));
    const body = (await res.json()) as { notices: { key: string; occurrences: number; lastDetail: string }[] };

    expect(body.notices).toHaveLength(1);
    expect(body.notices[0]).toMatchObject({
      key: "codeforces:blocked",
      occurrences: 4,
      lastDetail: "Judge refused a request.",
    });
  });

  it("pages the run history newest first and parses each summary", async () => {
    insertRun("codeforces", NOW - 300, "ok", 7, null, JSON.stringify({ handlesProcessed: 100 }));
    insertRun("atcoder", NOW - 100, "ok", 2);

    const res = await call("/admin/system/runs?perPage=1", await tokenFor(1, "user1"));
    const body = (await res.json()) as {
      data: { job: string; summary: unknown; faults: string[] }[]
      meta: { total: number; totalPages: number }
    };

    expect(body.meta).toMatchObject({ total: 2, totalPages: 2 });
    expect(body.data).toHaveLength(1);
    expect(body.data[0].job).toBe("atcoder");
    expect(body.data[0].faults).toEqual([]);

    const filtered = await call("/admin/system/runs?job=codeforces", await tokenFor(1, "user1"));
    const filteredBody = (await filtered.json()) as { data: { summary: unknown }[] };
    expect(filteredBody.data[0].summary).toEqual({ handlesProcessed: 100 });
  });

  it("filters the history by status", async () => {
    insertRun("codeforces", NOW - 300, "ok");
    insertRun("codeforces", NOW - 200, "crashed", null, "codeforces:run-failed");

    const res = await call("/admin/system/runs?status=crashed", await tokenFor(1, "user1"));
    const body = (await res.json()) as { data: { status: string; faults: string[] }[] };

    expect(body.data).toHaveLength(1);
    expect(body.data[0].status).toBe("crashed");
    expect(body.data[0].faults).toEqual(["codeforces:run-failed"]);
  });

  // Deleting the cooldown row is the acknowledgement: a recurrence should alert
  // straight away rather than sit inside a cooldown the admin started by fixing it.
  it("clears a fault's cooldown when it is acknowledged", async () => {
    db.prepare(
      "INSERT INTO admin_notices (key, first_seen_at, last_seen_at, last_sent_at, occurrences) " +
        "VALUES ('codeforces:blocked', ?, ?, ?, 4)",
    ).run(NOW - 7200, NOW - 600, NOW - 60);

    const res = await call("/admin/system/notices/codeforces:blocked", await tokenFor(1, "user1"), {
      method: "DELETE",
    });

    expect(res.status).toBe(200);
    expect(db.prepare("SELECT COUNT(*) AS n FROM admin_notices").get()).toEqual({ n: 0 });
  });

  it("404s on acknowledging a fault that is not there", async () => {
    const res = await call("/admin/system/notices/nope:missing", await tokenFor(1, "user1"), {
      method: "DELETE",
    });
    expect(res.status).toBe(404);
  });
});
