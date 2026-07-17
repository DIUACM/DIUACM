import { and, count, desc, eq, inArray, like, or, type SQL } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../../db/client";
import { userHandles, userPermissions, users } from "../../db/schema";
import { buildMeta } from "../../lib/pagination";
import { parseId } from "../../lib/parse-id";
import { hashPassword } from "../../lib/password";
import {
  isSuperAdminEmail,
  loadPermissions,
  loadPermissionsMap,
} from "../../lib/permissions";
import { toAuthUser, toHandlesMap } from "../../lib/user-shape";
import { validate } from "../../lib/validator";
import { requirePermission, requireSuperAdmin } from "../../middleware/auth";
import {
  adminUserCreateSchema,
  adminUsersListQuery,
  adminUserUpdateSchema,
  permissionParam,
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
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

type UserRow = { [K in keyof typeof userColumns]: (typeof users.$inferSelect)[K] };

// Shape a user row with their granted permissions and super-admin flag.
const shapeUser = async (c: Context<AppEnv>, row: UserRow) => {
  const isSuperAdmin = isSuperAdminEmail(row.email, c.env.SUPER_ADMIN_EMAIL);
  const permissions = isSuperAdmin ? [] : await loadPermissions(getDb(c.env.DB), row.id);
  const origin = new URL(c.req.url).origin;
  return toAuthUser(row, origin, { permissions, isSuperAdmin });
};

const manageUsers = requirePermission("manage_users");

const adminUserRoutes = new Hono<AppEnv>();

// All users, newest first. Searchable on name / username / email / student id;
// filterable by granted permission.
adminUserRoutes.get("/", manageUsers, validate("query", adminUsersListQuery), async (c) => {
  const { page, perPage, q, permission } = c.req.valid("query");
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const filters: SQL[] = [];
  if (permission) {
    filters.push(
      inArray(
        users.id,
        db
          .select({ userId: userPermissions.userId })
          .from(userPermissions)
          .where(eq(userPermissions.permission, permission)),
      ),
    );
  }
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

  const permMap = await loadPermissionsMap(
    db,
    rows.map((r) => r.id),
  );

  return c.json({
    data: rows.map((row) =>
      toAuthUser(row, origin, {
        permissions: permMap.get(row.id) ?? [],
        isSuperAdmin: isSuperAdminEmail(row.email, c.env.SUPER_ADMIN_EMAIL),
      }),
    ),
    meta: buildMeta(page, perPage, total),
  });
});

adminUserRoutes.post("/", manageUsers, validate("json", adminUserCreateSchema), async (c) => {
  const { password, ...input } = c.req.valid("json");
  const email = input.email.trim().toLowerCase();
  const db = getDb(c.env.DB);

  const passwordHash = password === undefined ? null : await hashPassword(password);

  // Duplicate email / username / studentId → UNIQUE failure → 409 via onError.
  const [user] = await db
    .insert(users)
    .values({ ...input, email, passwordHash })
    .returning(userColumns);

  return c.json({ user: await shapeUser(c, user) }, 201);
});

adminUserRoutes.get("/:id", manageUsers, async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "User not found" });

  const db = getDb(c.env.DB);

  const [user] = await db.select(userColumns).from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw new HTTPException(404, { message: "User not found" });

  const handleRows = await db
    .select({ type: userHandles.type, handle: userHandles.handle })
    .from(userHandles)
    .where(eq(userHandles.userId, id));

  return c.json({ user: await shapeUser(c, user), handles: toHandlesMap(handleRows) });
});

adminUserRoutes.patch("/:id", manageUsers, validate("json", adminUserUpdateSchema), async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "User not found" });

  const { password, ...input } = c.req.valid("json");
  if (password === undefined && Object.keys(input).length === 0) {
    throw new HTTPException(400, { message: "No fields to update" });
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

  return c.json({ user: await shapeUser(c, updated) });
});

// Deleting a user cascades their handles, permissions, attendance, performance,
// and ranklist memberships (FKs); the profile image is removed best-effort.
adminUserRoutes.delete("/:id", manageUsers, async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "User not found" });
  if (id === c.get("user").sub) {
    throw new HTTPException(400, { message: "You cannot delete yourself" });
  }

  const db = getDb(c.env.DB);
  const [target] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!target) throw new HTTPException(404, { message: "User not found" });
  if (isSuperAdminEmail(target.email, c.env.SUPER_ADMIN_EMAIL)) {
    throw new HTTPException(400, { message: "The super admin cannot be deleted" });
  }

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

// ---------------------------------------------------------------------------
// Permissions — only the super admin can grant or revoke. Responses return the
// user's effective permissions (the super admin always reports all of them).
// ---------------------------------------------------------------------------

const loadTargetUser = async (c: Context<AppEnv>, id: number): Promise<UserRow> => {
  const db = getDb(c.env.DB);
  const [user] = await db.select(userColumns).from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw new HTTPException(404, { message: "User not found" });
  return user;
};

adminUserRoutes.put(
  "/:id/permissions/:permission",
  requireSuperAdmin,
  validate("param", permissionParam),
  async (c) => {
    const id = parseId(c.req.param("id"));
    if (id === null) throw new HTTPException(404, { message: "User not found" });
    const { permission } = c.req.valid("param");

    const user = await loadTargetUser(c, id);
    const db = getDb(c.env.DB);

    // Idempotent: granting an already-held permission is a no-op.
    await db.insert(userPermissions).values({ userId: id, permission }).onConflictDoNothing();

    return c.json({ user: await shapeUser(c, user) });
  },
);

adminUserRoutes.delete(
  "/:id/permissions/:permission",
  requireSuperAdmin,
  validate("param", permissionParam),
  async (c) => {
    const id = parseId(c.req.param("id"));
    if (id === null) throw new HTTPException(404, { message: "User not found" });
    const { permission } = c.req.valid("param");

    const user = await loadTargetUser(c, id);
    const db = getDb(c.env.DB);

    const [deleted] = await db
      .delete(userPermissions)
      .where(and(eq(userPermissions.userId, id), eq(userPermissions.permission, permission)))
      .returning({ userId: userPermissions.userId });
    if (!deleted) {
      throw new HTTPException(404, { message: "Permission not granted to this user" });
    }

    return c.json({ user: await shapeUser(c, user) });
  },
);

export default adminUserRoutes;
