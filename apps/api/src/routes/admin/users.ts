import { and, count, desc, eq, inArray, or, type SQL } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../../db/client";
import { userHandles, userPermissions, users } from "../../db/schema";
import { CodeforcesApiError, getCodeforcesUser } from "../../lib/codeforces";
import { likeContains } from "../../lib/like";
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
  permissionToggleSchema,
} from "../../schemas/admin";
import {
  handleDeleteParam,
  handleSetSchema,
  handleTypeParam,
  type HandleType,
} from "../../schemas/handles";
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

const HANDLE_LABELS: Record<HandleType, string> = {
  codeforces: "Codeforces",
  vjudge: "VJudge",
  atcoder: "AtCoder",
};

const resolveHandle = async (
  type: HandleType,
  handle: string,
): Promise<{ handle: string; maxCfRating?: number | null }> => {
  if (type !== "codeforces") return { handle };

  try {
    const codeforcesUser = await getCodeforcesUser(handle);
    return {
      handle: codeforcesUser.handle,
      maxCfRating: codeforcesUser.maxRating,
    };
  } catch (err) {
    if (err instanceof CodeforcesApiError) {
      throw new HTTPException(err.kind === "invalid-handle" ? 400 : 502, {
        message: err.message,
      });
    }
    throw err;
  }
};

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
    const expr = or(
      likeContains(users.name, q),
      likeContains(users.username, q),
      likeContains(users.email, q),
      likeContains(users.studentId, q),
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
  // The super-admin identity is derived from the email column, so handing this
  // email to a new account would hand out super-admin access.
  if (isSuperAdminEmail(email, c.env.SUPER_ADMIN_EMAIL)) {
    throw new HTTPException(403, { message: "This email is reserved for the super admin" });
  }
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
    .select({ id: userHandles.id, type: userHandles.type, handle: userHandles.handle })
    .from(userHandles)
    .where(eq(userHandles.userId, id));

  return c.json({ user: await shapeUser(c, user), handles: toHandlesMap(handleRows) });
});

// Admin handle management. VJudge may have multiple rows per user; the
// database keeps Codeforces and AtCoder limited to one row per user.
adminUserRoutes.post(
  "/:id/handles/:type",
  manageUsers,
  validate("param", handleTypeParam),
  validate("json", handleSetSchema),
  async (c) => {
    const id = parseId(c.req.param("id"));
    if (id === null) throw new HTTPException(404, { message: "User not found" });

    const { type } = c.req.valid("param");
    const db = getDb(c.env.DB);
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user) throw new HTTPException(404, { message: "User not found" });

    const resolved = await resolveHandle(type, c.req.valid("json").handle);
    const [created] = await db
      .insert(userHandles)
      .values({ userId: id, type, handle: resolved.handle })
      .returning({ id: userHandles.id, handle: userHandles.handle });

    if (type === "codeforces") {
      await db
        .update(users)
        .set({
          maxCfRating: resolved.maxCfRating ?? null,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(users.id, id));
    }

    return c.json(created, 201);
  },
);

adminUserRoutes.put(
  "/:id/handles/:type/:handleId",
  manageUsers,
  validate("param", handleDeleteParam),
  validate("json", handleSetSchema),
  async (c) => {
    const id = parseId(c.req.param("id"));
    if (id === null) throw new HTTPException(404, { message: "Handle not found" });

    const { type, handleId } = c.req.valid("param");
    const db = getDb(c.env.DB);
    const [existing] = await db
      .select({ id: userHandles.id })
      .from(userHandles)
      .where(
        and(
          eq(userHandles.id, handleId),
          eq(userHandles.userId, id),
          eq(userHandles.type, type),
        ),
      )
      .limit(1);
    if (!existing) {
      throw new HTTPException(404, {
        message: `${HANDLE_LABELS[type]} handle not found`,
      });
    }

    const resolved = await resolveHandle(type, c.req.valid("json").handle);
    const [updated] = await db
      .update(userHandles)
      .set({
        handle: resolved.handle,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(userHandles.id, existing.id))
      .returning({ id: userHandles.id, handle: userHandles.handle });

    if (type === "codeforces") {
      await db
        .update(users)
        .set({
          maxCfRating: resolved.maxCfRating ?? null,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(users.id, id));
    }

    return c.json(updated);
  },
);

adminUserRoutes.delete(
  "/:id/handles/:type/:handleId",
  manageUsers,
  validate("param", handleDeleteParam),
  async (c) => {
    const id = parseId(c.req.param("id"));
    if (id === null) throw new HTTPException(404, { message: "Handle not found" });

    const { type, handleId } = c.req.valid("param");
    const db = getDb(c.env.DB);
    const [deleted] = await db
      .delete(userHandles)
      .where(
        and(
          eq(userHandles.id, handleId),
          eq(userHandles.userId, id),
          eq(userHandles.type, type),
        ),
      )
      .returning({ id: userHandles.id });
    if (!deleted) {
      throw new HTTPException(404, {
        message: `${HANDLE_LABELS[type]} handle not found`,
      });
    }

    if (type === "codeforces") {
      await db
        .update(users)
        .set({ maxCfRating: null, updatedAt: Math.floor(Date.now() / 1000) })
        .where(eq(users.id, id));
    }

    return c.json({ ok: true });
  },
);

adminUserRoutes.patch("/:id", manageUsers, validate("json", adminUserUpdateSchema), async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "User not found" });

  const { password, ...input } = c.req.valid("json");
  if (password === undefined && Object.keys(input).length === 0) {
    throw new HTTPException(400, { message: "No fields to update" });
  }

  const db = getDb(c.env.DB);

  // Editing the super admin's row (email, password, …) is editing the
  // super-admin identity itself — only the super admin may do that. Likewise,
  // nobody may move the reserved email onto another account.
  const [target] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!target) throw new HTTPException(404, { message: "User not found" });
  const targetIsSuperAdmin = isSuperAdminEmail(target.email, c.env.SUPER_ADMIN_EMAIL);
  if (targetIsSuperAdmin && !c.get("callerIsSuperAdmin")) {
    throw new HTTPException(403, {
      message: "Only the super admin can modify the super admin account",
    });
  }
  if (
    input.email !== undefined &&
    !targetIsSuperAdmin &&
    isSuperAdminEmail(input.email, c.env.SUPER_ADMIN_EMAIL)
  ) {
    throw new HTTPException(403, { message: "This email is reserved for the super admin" });
  }

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
// Permissions — a single toggle endpoint, designed for a switch in the admin
// UI's user management: `enabled: true` grants, `false` revokes, and both
// directions are idempotent. Only the super admin can call it. The response
// returns the user with their effective permissions.
// ---------------------------------------------------------------------------

adminUserRoutes.put(
  "/:id/permissions/:permission",
  requireSuperAdmin,
  validate("param", permissionParam),
  validate("json", permissionToggleSchema),
  async (c) => {
    const id = parseId(c.req.param("id"));
    if (id === null) throw new HTTPException(404, { message: "User not found" });
    const { permission } = c.req.valid("param");
    const { enabled } = c.req.valid("json");

    const db = getDb(c.env.DB);
    const [user] = await db.select(userColumns).from(users).where(eq(users.id, id)).limit(1);
    if (!user) throw new HTTPException(404, { message: "User not found" });

    if (enabled) {
      await db.insert(userPermissions).values({ userId: id, permission }).onConflictDoNothing();
    } else {
      await db
        .delete(userPermissions)
        .where(and(eq(userPermissions.userId, id), eq(userPermissions.permission, permission)));
    }

    return c.json({ user: await shapeUser(c, user) });
  },
);

export default adminUserRoutes;
