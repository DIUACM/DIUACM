import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import { buildDigest } from "../src/sync/digest";
import { collectLivenessFaults } from "../src/sync/faults";
import {
  LIVENESS_WINDOW_SECONDS,
  livenessIsMeaningful,
  loadLiveness,
  pruneRuns,
  recordRun,
  RUN_RETENTION_DAYS,
  type Liveness,
  type RunStatus,
} from "../src/sync/runs";
import {
  ATCODER_CRON,
  CF_RATING_CRON,
  CODEFORCES_CRON,
  DIGEST_CRON,
  firesPerDay,
  JOB_NAMES,
  VJUDGE_CRON,
} from "../src/sync/schedule";
import { d1Shim } from "./d1";
import { openTestDb } from "./db";

const NOW = 1_800_000_000;
const DAY = 24 * 60 * 60;

describe("firesPerDay", () => {
  it("counts the expressions wrangler.jsonc actually registers", () => {
    expect(firesPerDay(CODEFORCES_CRON)).toBe(96);
    // The staggered pair fire four times an hour too — offset, not less often.
    expect(firesPerDay(ATCODER_CRON)).toBe(96);
    expect(firesPerDay(VJUDGE_CRON)).toBe(96);
    expect(firesPerDay(CF_RATING_CRON)).toBe(1);
    expect(firesPerDay(DIGEST_CRON)).toBe(1);
  });

  it("handles ranges, steps, and lists", () => {
    expect(firesPerDay("0 * * * *")).toBe(24);
    expect(firesPerDay("0,30 * * * *")).toBe(48);
    expect(firesPerDay("*/30 9-17 * * *")).toBe(18);
    expect(firesPerDay("0 0-23/6 * * *")).toBe(4);
  });

  it("de-duplicates values that overlap", () => {
    expect(firesPerDay("0,0,30 0 * * *")).toBe(2);
  });

  // A wrong expectation is worse than none: it either alerts every day or never
  // fires when the job dies. Anything not confidently countable returns null and
  // the liveness check skips that job.
  it("refuses anything it cannot count from the expression alone", () => {
    expect(firesPerDay("0 0 * * 1")).toBeNull();
    expect(firesPerDay("0 0 1 * *")).toBeNull();
    expect(firesPerDay("0 0 * 6 *")).toBeNull();
    expect(firesPerDay("*/15 * * *")).toBeNull();
    expect(firesPerDay("60 * * * *")).toBeNull();
    expect(firesPerDay("*/0 * * * *")).toBeNull();
    expect(firesPerDay("banana * * * *")).toBeNull();
  });
});

describe("the run ledger", () => {
  let db: Database.Database;

  const insertRun = (
    job: string,
    startedAt: number,
    status: RunStatus = "ok",
    rowsWritten: number | null = null,
  ) =>
    db
      .prepare(
        "INSERT INTO cron_runs (job, started_at, duration_ms, status, rows_written) VALUES (?, ?, 1000, ?, ?)",
      )
      .run(job, startedAt, status, rowsWritten);

  beforeEach(() => {
    db = openTestDb();
  });

  it("records a run with its faults and metrics", async () => {
    await recordRun(d1Shim(db), {
      job: "codeforces",
      startedAt: NOW,
      durationMs: 4200,
      status: "degraded",
      faults: ["codeforces:blocked", "codeforces:error-rate"],
      rowsWritten: 17,
      errors: 3,
      summary: { handlesProcessed: 5 },
    });

    const row = db.prepare("SELECT * FROM cron_runs").get() as Record<string, unknown>;
    expect(row.job).toBe("codeforces");
    expect(row.status).toBe("degraded");
    expect(row.faults).toBe("codeforces:blocked,codeforces:error-rate");
    expect(row.rows_written).toBe(17);
    expect(row.errors).toBe(3);
    expect(JSON.parse(row.summary as string)).toEqual({ handlesProcessed: 5 });
  });

  // A run whose ledger write fails is still a run that worked.
  it("never throws when the write fails", async () => {
    const broken = { prepare: () => ({ bind: () => ({ run: async () => { throw new Error("no table"); } }) }) };
    await expect(
      recordRun(broken as unknown as D1Database, {
        job: "atcoder",
        startedAt: NOW,
        durationMs: 1,
        status: "ok",
        faults: [],
        rowsWritten: null,
        errors: null,
        summary: null,
      }),
    ).resolves.toBeUndefined();
  });

  it("prunes past the retention window and keeps the rest", async () => {
    insertRun("codeforces", NOW - (RUN_RETENTION_DAYS + 1) * DAY);
    insertRun("codeforces", NOW - (RUN_RETENTION_DAYS - 1) * DAY);
    insertRun("codeforces", NOW);

    await pruneRuns(d1Shim(db), NOW);

    const remaining = db.prepare("SELECT COUNT(*) AS n FROM cron_runs").get() as { n: number };
    expect(remaining.n).toBe(2);
  });

  it("lists every known job even when the table is empty", async () => {
    const liveness = await loadLiveness(d1Shim(db), NOW);

    expect(liveness.jobs.map((job) => job.job)).toEqual(JOB_NAMES);
    expect(liveness.recordingSince).toBeNull();
    // A job that has never run must appear as observed: 0, not vanish — being
    // absent from the table is exactly the condition worth alerting on.
    expect(liveness.jobs.every((job) => job.observed === 0 && job.lastRunAt === null)).toBe(true);
  });

  it("counts only runs inside the window and reports the newest run all-time", async () => {
    insertRun("codeforces", NOW - LIVENESS_WINDOW_SECONDS - 60);
    insertRun("codeforces", NOW - 3600);
    insertRun("codeforces", NOW - 600, "degraded");

    const liveness = await loadLiveness(d1Shim(db), NOW);
    const codeforces = liveness.jobs.find((job) => job.job === "codeforces");

    expect(codeforces?.observed).toBe(2);
    expect(codeforces?.lastRunAt).toBe(NOW - 600);
    expect(codeforces?.lastStatus).toBe("degraded");
    expect(codeforces?.expected).toBe(96);
    expect(liveness.recordingSince).toBe(NOW - LIVENESS_WINDOW_SECONDS - 60);
  });
});

describe("collectLivenessFaults", () => {
  const liveness = (jobs: Partial<Liveness["jobs"][number]>[], recordingSince: number): Liveness => ({
    recordingSince,
    jobs: jobs.map((job) => ({
      job: "codeforces",
      cron: CODEFORCES_CRON,
      expected: 96,
      observed: 96,
      lastRunAt: NOW - 600,
      lastStatus: "ok" as const,
      ...job,
    })) as Liveness["jobs"],
  });

  const old = NOW - LIVENESS_WINDOW_SECONDS - 1;

  // Otherwise deploying the ledger would alert on all five jobs at once, because
  // none of them has any history yet.
  it("stays quiet until the ledger is a full window old", () => {
    const young = liveness([{ observed: 0, lastRunAt: null }], NOW - 3600);
    expect(livenessIsMeaningful(young, NOW)).toBe(false);
    expect(collectLivenessFaults(young, NOW)).toEqual([]);
  });

  it("says nothing about a job ticking at its expected rate", () => {
    expect(collectLivenessFaults(liveness([{ observed: 99 }], old), NOW)).toEqual([]);
  });

  it("tolerates a few skipped invocations", () => {
    // Cloudflare does not guarantee every tick; 90 of 96 must not page anyone.
    expect(collectLivenessFaults(liveness([{ observed: 90 }], old), NOW)).toEqual([]);
  });

  it("raises a fault once enough ticks go missing", () => {
    const [fault, ...rest] = collectLivenessFaults(liveness([{ observed: 60 }], old), NOW);

    expect(rest).toHaveLength(0);
    expect(fault.key).toBe("codeforces:not-firing");
    expect(fault.subject).toContain("missing ticks");
    expect(fault.detail).toContain("60 time(s)");
    expect(fault.detail).toContain("96 expected");
  });

  it("distinguishes a job that has stopped entirely", () => {
    const [fault] = collectLivenessFaults(
      liveness([{ observed: 0, lastRunAt: NOW - 3 * DAY }], old),
      NOW,
    );

    expect(fault.subject).toContain("stopped firing");
    // The one thing worth checking first, and the reason this fault can exist at
    // all: no run means no other signal.
    expect(fault.detail).toContain("triggers.crons in wrangler.jsonc");
    expect(fault.detail).toContain("no other alert can see it");
  });

  it("skips a job whose cadence is not countable", () => {
    expect(
      collectLivenessFaults(liveness([{ expected: null, observed: 0 }], old), NOW),
    ).toEqual([]);
  });

  it("keys faults per job so their cooldowns stay independent", () => {
    const faults = collectLivenessFaults(
      liveness(
        [
          { job: "codeforces", observed: 0 },
          { job: "vjudge", cron: VJUDGE_CRON, expected: 96, observed: 0 },
        ],
        old,
      ),
      NOW,
    );

    expect(faults.map((fault) => fault.key)).toEqual([
      "codeforces:not-firing",
      "vjudge:not-firing",
    ]);
  });
});

describe("the digest CRON section", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = openTestDb();
  });

  it("explains itself before it has history to report", async () => {
    const { body, faults } = await buildDigest(d1Shim(db), NOW);

    expect(body).toContain("CRON");
    expect(body).toContain("not enough run history yet");
    expect(faults).toEqual([]);
    expect(body).toContain("No action needed.");
  });

  it("reports observed against expected ticks per job", async () => {
    db.prepare(
      "INSERT INTO cron_runs (job, started_at, duration_ms, status) VALUES ('codeforces', ?, 1000, 'ok')",
    ).run(NOW - LIVENESS_WINDOW_SECONDS - 1);
    for (let i = 0; i < 96; i += 1) {
      db.prepare(
        "INSERT INTO cron_runs (job, started_at, duration_ms, status) VALUES ('codeforces', ?, 1000, 'ok')",
      ).run(NOW - i * 900);
    }

    const { body, faults } = await buildDigest(d1Shim(db), NOW);

    expect(body).toContain("96/96 ticks");
    // The four jobs that never ran are still listed, and still alert.
    expect(body).toContain("0/96 ticks");
    expect(faults.map((fault) => fault.key)).toContain("vjudge:not-firing");
    expect(faults.map((fault) => fault.key)).not.toContain("codeforces:not-firing");
    expect(body).not.toContain("No action needed.");
  });
});
