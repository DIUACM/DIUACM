import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { handleScheduled } from "../src/sync";
import { CF_RATING_CRON, CODEFORCES_CRON } from "../src/sync/schedule";
import type { Bindings } from "../src/types";
import { d1Shim } from "./d1";
import { openTestDb } from "./db";

const NOW = 1_800_000_000;

describe("scheduled Codeforces backoff", () => {
  let db: Database.Database;
  let sent: Array<{ subject: string }>;
  let env: Bindings;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW * 1000));
    db = openTestDb();
    sent = [];
    env = {
      DB: d1Shim(db),
      ALERT_FROM_EMAIL: "alerts@example.com",
      SUPER_ADMIN_EMAIL: "admin@example.com",
      EMAIL: {
        send: async (message: { subject: string }) => {
          sent.push(message);
          return { messageId: "m1" };
        },
      },
    } as unknown as Bindings;

    db.prepare(
      "INSERT INTO upstream_backoffs (upstream, blocked_until, failures, last_error, updated_at) VALUES ('codeforces', ?, 2, 'limited', ?)",
    ).run(NOW + 4 * 3600, NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("skips both jobs without network calls and shares one incident", async () => {
    await handleScheduled({ cron: CODEFORCES_CRON } as ScheduledController, env);
    vi.setSystemTime(new Date((NOW + 60) * 1000));
    await handleScheduled({ cron: CF_RATING_CRON } as ScheduledController, env);

    const runs = db
      .prepare("SELECT job, status, faults, summary FROM cron_runs ORDER BY id")
      .all() as Array<{ job: string; status: string; faults: string; summary: string }>;
    expect(runs.map(({ job, status, faults }) => ({ job, status, faults }))).toEqual([
      { job: "codeforces", status: "degraded", faults: "codeforces:blocked" },
      { job: "codeforces-rating", status: "degraded", faults: "codeforces:blocked" },
    ]);
    expect(runs.every((run) => JSON.parse(run.summary).skipped === true)).toBe(true);
    // Nothing mailed yet: a Codeforces call limit that clears within the hour is
    // not something anyone can act on, so the incident is only recorded.
    expect(sent).toHaveLength(0);
  });

  it("mails once, for both jobs, when the block outlasts the sustain window", async () => {
    for (let at = NOW; at <= NOW + 2 * 3600; at += 900) {
      vi.setSystemTime(new Date(at * 1000));
      await handleScheduled({ cron: CODEFORCES_CRON } as ScheduledController, env);
    }
    vi.setSystemTime(new Date((NOW + 2 * 3600 + 60) * 1000));
    await handleScheduled({ cron: CF_RATING_CRON } as ScheduledController, env);

    expect(sent).toHaveLength(1);
    expect(sent[0].subject).toContain("rate-limiting");
  });
});
