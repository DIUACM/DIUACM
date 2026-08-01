import type Database from "better-sqlite3";
import { hashSync as hashBcrypt } from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "../src/index";
import { signAuthToken } from "../src/lib/jwt";
import { hashPassword } from "../src/lib/password";
import { d1Shim } from "./d1";
import { openTestDb } from "./db";

const JWT_SECRET = "test-secret";

const bytesToHex = (bytes: Uint8Array): string =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");

const legacyHash = async (password: string): Promise<string> => {
  const salt = new Uint8Array(16);
  salt.fill(7);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 100_000 },
    key,
    256,
  );
  return `pbkdf2:100000:${bytesToHex(salt)}:${bytesToHex(new Uint8Array(bits))}`;
};

describe("authentication routes", () => {
  let db: Database.Database;
  let limit: ReturnType<typeof vi.fn>;
  let env: Record<string, unknown>;

  beforeEach(() => {
    db = openTestDb();
    limit = vi.fn(async () => ({ success: true }));
    env = {
      DB: d1Shim(db),
      JWT_SECRET,
      SUPER_ADMIN_EMAIL: "super@example.com",
      GOOGLE_CLIENT_ID: "test-client",
      CORS_ORIGINS: "",
      AUTH_RATE_LIMITER: { limit },
    };
  });

  const insertPasswordUser = (id: number, passwordHash: string) => {
    db.prepare(
      "INSERT INTO users (id, name, email, username, password_hash) VALUES (?, ?, ?, ?, ?)",
    ).run(id, `User ${id}`, `user${id}@example.com`, `user${id}`, passwordHash);
  };

  const login = (identifier: string, password: string) =>
    app.request(
      "/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Connecting-IP": "203.0.113.10",
        },
        body: JSON.stringify({ identifier, password }),
      },
      env,
    );

  it("preserves leading and trailing password whitespace", async () => {
    insertPasswordUser(1, await hashPassword("  exact password  "));

    const success = await login("  user1  ", "  exact password  ");
    expect(success.status).toBe(200);

    const trimmed = await login("user1", "exact password");
    expect(trimmed.status).toBe(401);
    expect(limit).toHaveBeenCalledWith({ key: "auth:203.0.113.10" });
  });

  it("upgrades a legacy hash after a successful login", async () => {
    insertPasswordUser(1, await legacyHash("legacy password"));

    const response = await login("user1", "legacy password");
    expect(response.status).toBe(200);

    const row = db
      .prepare("SELECT password_hash FROM users WHERE id = 1")
      .get() as { password_hash: string };
    expect(row.password_hash).toMatch(/^pbkdf2:600000:/);
  });

  it("accepts and upgrades an imported Laravel bcrypt hash", async () => {
    const laravelHash = hashBcrypt("imported password", 4).replace("$2b$", "$2y$");
    insertPasswordUser(1, laravelHash);

    const response = await login("user1", "imported password");
    expect(response.status).toBe(200);

    const row = db
      .prepare("SELECT password_hash FROM users WHERE id = 1")
      .get() as { password_hash: string };
    expect(row.password_hash).toMatch(/^pbkdf2:600000:/);
  });

  it("returns 401 when a valid token points to a deleted account", async () => {
    const token = await signAuthToken({ id: 999, username: "deleted" }, JWT_SECRET);
    const response = await app.request(
      "/auth/me",
      { headers: { Authorization: `Bearer ${token}` } },
      env,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Account no longer exists" });
  });

  it("rejects banned users at login and immediately revokes existing tokens", async () => {
    insertPasswordUser(1, await hashPassword("login password"));
    db.prepare("UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = 1").run(
      "Repeated contest misconduct",
    );

    const loginResponse = await login("user1", "login password");
    expect(loginResponse.status).toBe(403);
    await expect(loginResponse.json()).resolves.toEqual({
      error: "Account banned: Repeated contest misconduct",
    });

    const token = await signAuthToken({ id: 1, username: "user1" }, JWT_SECRET);
    const protectedResponse = await app.request(
      "/auth/me",
      { headers: { Authorization: `Bearer ${token}` } },
      env,
    );
    expect(protectedResponse.status).toBe(401);
    await expect(protectedResponse.json()).resolves.toEqual({
      error: "Account banned: Repeated contest misconduct",
    });
  });

  it("limits attendance attempts by user and event while keeping the password recoverable", async () => {
    insertPasswordUser(1, await hashPassword("login password"));
    const now = Math.floor(Date.now() / 1000);
    db.prepare(
      "INSERT INTO events (id, title, status, starting_at, ending_at, open_for_attendance, event_password) VALUES (1, 'Event', 'published', ?, ?, 1, ?)",
    ).run(now - 60, now + 60, "  event secret  ");
    const token = await signAuthToken({ id: 1, username: "user1" }, JWT_SECRET);

    const response = await app.request(
      "/events/1/attendance",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: "  event secret  " }),
      },
      env,
    );

    expect(response.status).toBe(201);
    expect(limit).toHaveBeenCalledWith({ key: "attendance:1:1" });
    const event = db
      .prepare("SELECT event_password FROM events WHERE id = 1")
      .get() as { event_password: string };
    expect(event.event_password).toBe("  event secret  ");
  });

  it("returns Retry-After when attendance attempts are throttled", async () => {
    db.prepare(
      "INSERT INTO users (id, name, email, username) VALUES (1, 'User', 'user@example.com', 'user')",
    ).run();
    const now = Math.floor(Date.now() / 1000);
    db.prepare(
      "INSERT INTO events (id, title, status, starting_at, ending_at, open_for_attendance, event_password) VALUES (1, 'Event', 'published', ?, ?, 1, 'secret')",
    ).run(now - 60, now + 60);
    limit.mockResolvedValueOnce({ success: false });
    const token = await signAuthToken({ id: 1, username: "user" }, JWT_SECRET);

    const response = await app.request(
      "/events/1/attendance",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: "wrong" }),
      },
      env,
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
  });
});
