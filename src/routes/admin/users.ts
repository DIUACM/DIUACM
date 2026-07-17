import { and, count, desc, eq, like, or, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../../db/client";
import { userHandles, users } from "../../db/schema";
import { buildMeta } from "../../lib/pagination";
import { parseId } from "../../lib/parse-id";
import { hashPassword } from "../../lib/password";
import { toAuthUser, toHandlesMap } from "../../lib/user-shape";
import { validate } from "../../lib/validator";
import {
  adminUserCreateSchema,
  adminUsersListQuery,
  adminUserUpdateSchema,
} from "../../schemas/admin";
import type { AppEnv } from "../../types";

// Same safe shape the auth routes use — never includes passwordHash.
const userColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  username: users.username,
  studentId: users.studentId,
  imageKey: users.imageKey,
  maxCfRating: users.maxCfRating,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

const adminUserRoutes = new Hono<AppEnv>();

// All users (any role), newest first. Searchable on name / username / email /
// student id; filterable by role.
adminUserRoutes.get("/", validate("query", adminUsersListQuery), async (c) => {
  const { page, perPage, q, role } = c.req.valid("query");
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const filters: SQL[] = [];
  if (role) filters.push(eq(users.role, role));
  if (q) {
    const term = `%${q}%`;
    const expr = or(
      like(users.name, term),
      like(users.username, term),
      like(users.email, term),
      like(users.studentId, term),
    );
    if (expr) filters.push(expr);
  }
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select(userColumns)
      .from(users)
      .where(where)
      .orderBy(desc(users.id))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(users).where(where),
  ]);

  return c.json({
    data: rows.map((r) => toAuthUser(r, origin)),
    meta: buildMeta(page, perPage, total),
  });
});

adminUserRoutes.post("/", validate("json", adminUserCreateSchema), async (c) => {
  const { password, ...input } = c.req.valid("json");
  const email = input.email.trim().toLowerCase();
  const db = getDb(c.env.DB);

  const passwordHash = password === undefined ? null : await hashPassword(password);

  // Duplicate email / username / studentId → UNIQUE failure → 409 via onError.
  const [user] = await db
    .insert(users)
    .values({ ...input, email, passwordHash })
    .returning(userColumns);

  const origin = new URL(c.req.url).origin;
  return c.json({ user: toAuthUser(user, origin) }, 201);
});

adminUserRoutes.get("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "User not found" });

  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const [user] = await db.select(userColumns).from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw new HTTPException(404, { message: "User not found" });

  const handleRows = await db
    .select({ type: userHandles.type, handle: userHandles.handle })
    .from(userHandles)
    .where(eq(userHandles.userId, id));

  return c.json({ user: toAuthUser(user, origin), handles: toHandlesMap(handleRows) });
});

adminUserRoutes.patch("/:id", validate("json", adminUserUpdateSchema), async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "User not found" });

  const { password, ...input } = c.req.valid("json");
  if (password === undefined && Object.keys(input).length === 0) {
    throw new HTTPException(400, { message: "No fields to update" });
  }
  if (id === c.get("user").sub && input.role === "user") {
    throw new HTTPException(400, { message: "You cannot demote yourself" });
  }

  const db = getDb(c.env.DB);

  const passwordHash =
    password === undefined ? undefined : password === null ? null : await hashPassword(password);
  const email = input.email === undefined ? undefined : input.email.trim().toLowerCase();

  const [updated] = await db
    .update(users)
    .set({ ...input, email, passwordHash, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(users.id, id))
    .returning(userColumns);
  if (!updated) throw new HTTPException(404, { message: "User not found" });

  const origin = new URL(c.req.url).origin;
  return c.json({ user: toAuthUser(updated, origin) });
});

// Deleting a user cascades their handles, attendance, performance, and
// ranklist memberships (FKs); the profile image is removed best-effort.
adminUserRoutes.delete("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "User not found" });
  if (id === c.get("user").sub) {
    throw new HTTPException(400, { message: "You cannot delete yourself" });
  }

  const db = getDb(c.env.DB);
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ imageKey: users.imageKey });
  if (!deleted) throw new HTTPException(404, { message: "User not found" });

  if (deleted.imageKey) {
    try {
      await c.env.BUCKET.delete(deleted.imageKey);
    } catch (err) {
      console.error("R2 delete failed for user image", deleted.imageKey, err);
    }
  }

  return c.json({ ok: true });
});

export default adminUserRoutes;
