import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/index";
import { signAuthToken } from "../src/lib/jwt";
import { d1Shim } from "./d1";
import { attachEvent, insertEvent, insertRanklist, insertTracker, insertUser, openTestDb } from "./db";

const JWT_SECRET = "test-secret";

describe("admin event ranklist links", () => {
  let db: Database.Database;
  let env: Record<string, unknown>;
  let trackerAdminToken: string;
  let eventAdminToken: string;

  beforeEach(async () => {
    db = openTestDb();
    insertUser(db, 1);
    insertUser(db, 2);
    db.prepare(
      "INSERT INTO user_permissions (user_id, permission) VALUES (1, 'manage_trackers')",
    ).run();
    db.prepare(
      "INSERT INTO user_permissions (user_id, permission) VALUES (2, 'manage_events')",
    ).run();
    trackerAdminToken = await signAuthToken({ id: 1, username: "user1" }, JWT_SECRET);
    eventAdminToken = await signAuthToken({ id: 2, username: "user2" }, JWT_SECRET);

    insertTracker(db, 1);
    insertRanklist(db, 1, 1);
    insertRanklist(db, 2, 1);
    insertEvent(db, 1);

    env = {
      DB: d1Shim(db),
      JWT_SECRET,
      SUPER_ADMIN_EMAIL: "super@example.com",
      CORS_ORIGINS: "",
    };
  });

  const get = (path: string, token: string) =>
    app.request(path, { headers: { Authorization: `Bearer ${token}` } }, env);

  it("lists the ranklists an event is attached to, with tracker and weight", async () => {
    attachEvent(db, 2, 1, 0.75);

    const response = await get("/admin/events/1/ranklists", trackerAdminToken);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          id: 2,
          keyword: "keyword-2",
          status: "draft",
          isLocked: false,
          weight: 0.75,
          trackerId: 1,
          trackerTitle: "Tracker 1",
          trackerSlug: "tracker-1",
        },
      ],
    });
  });

  it("needs manage_trackers, and 404s for an unknown event", async () => {
    expect((await get("/admin/events/1/ranklists", eventAdminToken)).status).toBe(403);
    expect((await get("/admin/events/999/ranklists", trackerAdminToken)).status).toBe(404);
  });

  it("searches ranklists across trackers by keyword or tracker", async () => {
    const byKeyword = await get("/admin/ranklists?q=keyword-2", trackerAdminToken);
    expect(byKeyword.status).toBe(200);
    const keywordBody = await byKeyword.json();
    expect(keywordBody.data.map((r: { id: number }) => r.id)).toEqual([2]);
    expect(keywordBody.data[0]).toMatchObject({
      trackerTitle: "Tracker 1",
      trackerSlug: "tracker-1",
    });

    const byTracker = await get("/admin/ranklists?q=Tracker 1", trackerAdminToken);
    const trackerBody = await byTracker.json();
    expect(trackerBody.data.map((r: { id: number }) => r.id).sort()).toEqual([1, 2]);
    expect(trackerBody.meta.total).toBe(2);
  });

  it("attaches and detaches this event through the ranklist routes", async () => {
    const attached = await app.request(
      "/admin/ranklists/1/events/1",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${trackerAdminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ weight: 0.5 }),
      },
      env,
    );
    expect(attached.status).toBe(200);

    const listed = await (await get("/admin/events/1/ranklists", trackerAdminToken)).json();
    expect(listed.data).toEqual([expect.objectContaining({ id: 1, weight: 0.5 })]);

    const detached = await app.request(
      "/admin/ranklists/1/events/1",
      { method: "DELETE", headers: { Authorization: `Bearer ${trackerAdminToken}` } },
      env,
    );
    expect(detached.status).toBe(200);

    const empty = await (await get("/admin/events/1/ranklists", trackerAdminToken)).json();
    expect(empty.data).toEqual([]);
  });
});
