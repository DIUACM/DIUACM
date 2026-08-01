import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "../src/index";
import { signAuthToken } from "../src/lib/jwt";
import { d1Shim } from "./d1";
import { insertUser, openTestDb } from "./db";

const JWT_SECRET = "test-secret";

describe("GET /admin/events/contest-details", () => {
  let db: Database.Database;
  let env: Record<string, unknown>;

  beforeEach(() => {
    db = openTestDb();
    env = {
      DB: d1Shim(db),
      JWT_SECRET,
      SUPER_ADMIN_EMAIL: "super@example.com",
      CORS_ORIGINS: "",
    };

    insertUser(db, 1);
    db.prepare(
      "INSERT INTO user_permissions (user_id, permission) VALUES (1, 'manage_events')",
    ).run();
    insertUser(db, 2);
  });

  afterEach(() => vi.unstubAllGlobals());

  const call = async (userId: number, username: string, link: string) => {
    const token = await signAuthToken({ id: userId, username }, JWT_SECRET);
    return app.request(
      `/admin/events/contest-details?link=${encodeURIComponent(link)}`,
      { headers: { Authorization: `Bearer ${token}` } },
      env,
    );
  };

  const createEvent = async (link: string) => {
    const token = await signAuthToken({ id: 1, username: "user1" }, JWT_SECRET);
    return app.request(
      "/admin/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Contest",
          type: "contest",
          startingAt: 1_750_000_000,
          endingAt: 1_750_007_200,
          eventLink: link,
        }),
      },
      env,
    );
  };

  it("returns editable event fields to an event manager", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json({
          status: "OK",
          result: [
            {
              id: 2148,
              name: "Codeforces Round 1050",
              startTimeSeconds: 1_750_000_000,
              durationSeconds: 7_200,
            },
          ],
        }),
      ),
    );

    const response = await call(1, "user1", "https://codeforces.com/contest/2148");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      platform: "codeforces",
      title: "Codeforces Round 1050",
      description: "",
      startingAt: 1_750_000_000,
      endingAt: 1_750_007_200,
    });
  });

  it("requires the manage_events permission", async () => {
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);

    const response = await call(2, "user2", "https://codeforces.com/contest/2148");

    expect(response.status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects duplicate event links when creating events", async () => {
    const first = await createEvent("https://codeforces.com/contest/2148");
    expect(first.status).toBe(201);

    const duplicate = await createEvent("https://codeforces.com/contest/2148");

    expect(duplicate.status).toBe(409);
    await expect(duplicate.json()).resolves.toEqual({
      error: "Event link already exists",
    });
    expect(db.prepare("SELECT COUNT(*) AS count FROM events").get()).toEqual({ count: 1 });
  });
});
