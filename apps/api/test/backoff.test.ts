import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import {
  clearBackoff,
  CODEFORCES_UPSTREAM,
  extendBackoff,
  getActiveBackoff,
} from "../src/sync/backoff";
import { d1Shim } from "./d1";
import { openTestDb } from "./db";

const NOW = 1_800_000_000;

describe("persistent upstream backoff", () => {
  let db: Database.Database;
  let d1: D1Database;

  beforeEach(() => {
    db = openTestDb();
    d1 = d1Shim(db);
  });

  it("opens for 30 minutes and expires without deleting its retry step", async () => {
    const state = await extendBackoff(d1, CODEFORCES_UPSTREAM, NOW, "limited");

    expect(state).toMatchObject({ failures: 1, blockedUntil: NOW + 30 * 60 });
    await expect(getActiveBackoff(d1, CODEFORCES_UPSTREAM, NOW + 60)).resolves.toMatchObject({
      failures: 1,
    });
    await expect(
      getActiveBackoff(d1, CODEFORCES_UPSTREAM, NOW + 30 * 60),
    ).resolves.toBeNull();
  });

  it("advances exponentially and saturates at four hours", async () => {
    const delays: number[] = [];
    for (let step = 0; step < 5; step += 1) {
      const at = NOW + step * 20_000;
      const state = await extendBackoff(d1, CODEFORCES_UPSTREAM, at, `failure ${step}`);
      delays.push(state.blockedUntil - at);
    }

    expect(delays).toEqual([1800, 3600, 7200, 14_400, 14_400]);
  });

  it("clears after recovery so the next incident starts at 30 minutes", async () => {
    await extendBackoff(d1, CODEFORCES_UPSTREAM, NOW, "limited");
    await expect(clearBackoff(d1, CODEFORCES_UPSTREAM)).resolves.toBe(true);
    await expect(getActiveBackoff(d1, CODEFORCES_UPSTREAM, NOW)).resolves.toBeNull();

    const reopened = await extendBackoff(d1, CODEFORCES_UPSTREAM, NOW + 100, "limited again");
    expect(reopened).toMatchObject({ failures: 1, blockedUntil: NOW + 100 + 1800 });
  });
});
