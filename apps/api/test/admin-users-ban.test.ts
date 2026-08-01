import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/index";
import { signAuthToken } from "../src/lib/jwt";
import { d1Shim } from "./d1";
import { insertUser, openTestDb } from "./db";

const JWT_SECRET = "test-secret";

describe("admin user bans", () => {
  let db: Database.Database;
  let env: Record<string, unknown>;
  let adminToken: string;

  beforeEach(async () => {
    db = openTestDb();
    insertUser(db, 1);
    insertUser(db, 2);
    db.prepare(
      "INSERT INTO user_permissions (user_id, permission) VALUES (1, 'manage_users')",
    ).run();
    adminToken = await signAuthToken({ id: 1, username: "user1" }, JWT_SECRET);
    env = {
      DB: d1Shim(db),
      JWT_SECRET,
      SUPER_ADMIN_EMAIL: "super@example.com",
      CORS_ORIGINS: "",
    };
  });

  const updateUser = (id: number, body: unknown) =>
    app.request(
      `/admin/users/${id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      env,
    );

  it("requires a public reason and supports banning and unbanning", async () => {
    const missingReason = await updateUser(2, { isBanned: true });
    expect(missingReason.status).toBe(400);

    const banned = await updateUser(2, {
      isBanned: true,
      banReason: "Repeated contest misconduct",
    });
    expect(banned.status).toBe(200);
    await expect(banned.json()).resolves.toMatchObject({
      user: {
        id: 2,
        isBanned: true,
        banReason: "Repeated contest misconduct",
      },
    });

    const targetToken = await signAuthToken({ id: 2, username: "user2" }, JWT_SECRET);
    const revoked = await app.request(
      "/auth/me",
      { headers: { Authorization: `Bearer ${targetToken}` } },
      env,
    );
    expect(revoked.status).toBe(401);

    const unbanned = await updateUser(2, { isBanned: false, banReason: null });
    expect(unbanned.status).toBe(200);
    await expect(unbanned.json()).resolves.toMatchObject({
      user: { id: 2, isBanned: false, banReason: null },
    });
  });
});
