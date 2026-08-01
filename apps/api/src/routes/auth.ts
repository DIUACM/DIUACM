import { and, eq, or, sql } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../db/client";
import { userHandles, users } from "../db/schema";
import { CodeforcesApiError, getCodeforcesUser } from "../lib/codeforces";
import { GoogleAuthError, verifyGoogleIdToken } from "../lib/google-oauth";
import { parseImageUpload } from "../lib/image-upload";
import { signAuthToken } from "../lib/jwt";
import { hashPassword, needsPasswordRehash, verifyPassword } from "../lib/password";
import { isSuperAdminEmail, loadPermissions } from "../lib/permissions";
import { toAuthUser, toHandlesMap } from "../lib/user-shape";
import { setSelfVjudgeHandle } from "../lib/vjudge-handles";
import { validate } from "../lib/validator";
import { requireAuth } from "../middleware/auth";
import { authRateLimit } from "../middleware/rate-limit";
import {
  googleSignInSchema,
  loginSchema,
  profileUpdateSchema,
} from "../schemas/auth";
import {
  handleDeleteParam,
  handleSetSchema,
  handleTypeParam,
} from "../schemas/handles";
import type { AppEnv } from "../types";

// Columns safe to expose — never includes passwordHash. Shaped via toAuthUser.
const authUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  username: users.username,
  studentId: users.studentId,
  imageKey: users.imageKey,
  maxCfRating: users.maxCfRating,
  isBanned: users.isBanned,
  banReason: users.banReason,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

type AuthUserRow = {
  [K in keyof typeof authUserColumns]: (typeof users.$inferSelect)[K];
};

// Shape a user row for a response, attaching permissions and the super-admin flag.
const shapeAuthUser = async (c: Context<AppEnv>, row: AuthUserRow) => {
  const isSuperAdmin = isSuperAdminEmail(row.email, c.env.SUPER_ADMIN_EMAIL);
  // The super admin's permissions are implicit — no need to query granted rows.
  const permissions = isSuperAdmin ? [] : await loadPermissions(getDb(c.env.DB), row.id);
  const origin = new URL(c.req.url).origin;
  return toAuthUser(row, origin, { permissions, isSuperAdmin });
};

const ALLOWED_EMAIL_DOMAIN = "diu.edu.bd";
const MAX_USERNAME_ATTEMPTS = 5;

// Verified against when the account doesn't exist or has no password, so the
// login response time doesn't reveal which accounts exist. Random bytes — no
// password hashes to this.
const DUMMY_PASSWORD_HASH =
  "pbkdf2:600000:0ff513e3ffa428aa68c413ef893e989f:92ceb9e253443292d9022b2e012fc4a2f0b8b8a3092667a7ca809fdf1fa33348";

// 24-bit hex; ~16.7M space, collision odds vanishingly small. We still retry on
// the unique constraint below to be defensive.
const generateOpaqueUsername = (): string => {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return `user_${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
};

const auth = new Hono<AppEnv>();

auth.get("/config", (c) => c.json({ googleClientId: c.env.GOOGLE_CLIENT_ID }));

// No public password registration: accounts are created via Google sign-in
// (verified email) or by an admin. Password login remains for accounts an
// admin gave a password to.
auth.post("/login", authRateLimit, validate("json", loginSchema), async (c) => {
  const { identifier, password } = c.req.valid("json");
  const id = identifier.trim();
  const db = getDb(c.env.DB);

  // identifier is an email or a username. Emails are stored lowercased;
  // usernames cannot contain "@" (schema regex), so there is no collision.
  const [row] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, id.toLowerCase()), eq(users.username, id)))
    .limit(1);

  // Same error — and the same PBKDF2 work, via the dummy hash — whether the
  // account is unknown, was created via Google (no password), or the password
  // is wrong, so neither the response nor its timing leaks which accounts exist.
  const passwordOk = await verifyPassword(password, row?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!row || !row.passwordHash || !passwordOk) {
    throw new HTTPException(401, { message: "Invalid email/username or password" });
  }
  if (row.isBanned) {
    throw new HTTPException(403, {
      message: row.banReason
        ? `Banned from DIUACM: ${row.banReason}`
        : "Banned from DIUACM",
    });
  }

  // Existing hashes remain valid and are upgraded opportunistically only after
  // the password has been proven, avoiding a forced reset or migration window.
  if (needsPasswordRehash(row.passwordHash)) {
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(password) })
      .where(eq(users.id, row.id));
  }

  const token = await signAuthToken(
    { id: row.id, username: row.username },
    c.env.JWT_SECRET,
  );
  return c.json({ token, user: await shapeAuthUser(c, row) });
});

auth.post("/google", authRateLimit, validate("json", googleSignInSchema), async (c) => {
  const { idToken } = c.req.valid("json");
  const db = getDb(c.env.DB);

  let claims;
  try {
    claims = await verifyGoogleIdToken(idToken, c.env.GOOGLE_CLIENT_ID);
  } catch (err) {
    if (err instanceof GoogleAuthError) {
      throw new HTTPException(401, { message: err.message });
    }
    throw err;
  }

  const email = claims.email.trim().toLowerCase();
  // The super admin may sign in from any domain; everyone else must use DIU email.
  if (
    !isSuperAdminEmail(email, c.env.SUPER_ADMIN_EMAIL) &&
    !email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)
  ) {
    throw new HTTPException(403, {
      message: `Only @${ALLOWED_EMAIL_DOMAIN} email addresses can sign in with Google`,
    });
  }

  const findByEmail = async () => {
    const [row] = await db
      .select(authUserColumns)
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row;
  };

  let user = await findByEmail();
  let createdNow = false;

  if (!user) {
    const name = claims.name?.trim() || email.split("@")[0];
    let lastErr: unknown;
    for (let attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt++) {
      try {
        // Google sign-ups have no password (passwordHash stays null) and get an
        // opaque username they can change later via PATCH /auth/me.
        [user] = await db
          .insert(users)
          .values({ name, email, username: generateOpaqueUsername() })
          .returning(authUserColumns);
        createdNow = true;
        break;
      } catch (err) {
        lastErr = err;
        // Race: another request for the same email beat us to the insert.
        const existing = await findByEmail();
        if (existing) {
          user = existing;
          break;
        }
        // Otherwise assume the username collided — retry with a new one.
      }
    }
    if (!user) {
      console.error("Google sign-in: insert failed after retries", lastErr);
      throw new HTTPException(500, {
        message: "Could not create user from Google sign-in",
      });
    }
  }

  if (user.isBanned) {
    throw new HTTPException(403, {
      message: user.banReason
        ? `Banned from DIUACM: ${user.banReason}`
        : "Banned from DIUACM",
    });
  }

  const token = await signAuthToken(
    { id: user.id, username: user.username },
    c.env.JWT_SECRET,
  );
  return c.json({ token, user: await shapeAuthUser(c, user) }, createdNow ? 201 : 200);
});

auth.get("/me", requireAuth, async (c) => {
  const payload = c.get("user");
  const db = getDb(c.env.DB);

  const [me] = await db
    .select(authUserColumns)
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  if (!me) {
    // The bearer token is structurally valid but no longer represents an
    // account. Treat it as an invalid session so clients clear it immediately.
    throw new HTTPException(401, { message: "Account no longer exists" });
  }
  return c.json({ user: await shapeAuthUser(c, me) });
});

auth.patch("/me", requireAuth, validate("json", profileUpdateSchema), async (c) => {
  const input = c.req.valid("json");
  if (Object.keys(input).length === 0) {
    throw new HTTPException(400, { message: "No fields to update" });
  }

  const payload = c.get("user");
  const db = getDb(c.env.DB);

  // A duplicate username/studentId surfaces as a UNIQUE constraint error → 409
  // via onError. Drizzle omits `undefined` fields from the SET clause.
  const [updated] = await db
    .update(users)
    .set({ ...input, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(users.id, payload.sub))
    .returning(authUserColumns);

  if (!updated) {
    throw new HTTPException(404, { message: "User not found" });
  }
  return c.json({ user: await shapeAuthUser(c, updated) });
});

auth.put("/me/image", requireAuth, async (c) => {
  const { buffer, contentType, ext } = await parseImageUpload(c);
  const payload = c.get("user");
  const db = getDb(c.env.DB);

  const [prev] = await db
    .select({ imageKey: users.imageKey })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);
  if (!prev) {
    throw new HTTPException(404, { message: "User not found" });
  }

  const key = `users/${crypto.randomUUID()}.${ext}`;
  await c.env.BUCKET.put(key, buffer, { httpMetadata: { contentType } });

  let updated;
  try {
    [updated] = await db
      .update(users)
      .set({ imageKey: key, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(users.id, payload.sub))
      .returning(authUserColumns);
  } catch (err) {
    // DB update failed — don't leave an orphan object in R2.
    try {
      await c.env.BUCKET.delete(key);
    } catch (cleanupErr) {
      console.error("R2 cleanup failed for orphan image key", key, cleanupErr);
    }
    throw err;
  }

  // Best-effort delete of the previous image after a successful swap.
  if (prev.imageKey && prev.imageKey !== key) {
    try {
      await c.env.BUCKET.delete(prev.imageKey);
    } catch (err) {
      console.error("R2 delete failed for old image", prev.imageKey, err);
    }
  }

  return c.json({ user: await shapeAuthUser(c, updated) });
});

// ---------------------------------------------------------------------------
// Handles — users may self-manage one handle per platform. Admins may attach
// multiple VJudge handles; in that state the user can remove them individually
// but cannot add or edit until only one remains.
// ---------------------------------------------------------------------------

const loadHandles = async (db: ReturnType<typeof getDb>, userId: number) => {
  const rows = await db
    .select({ id: userHandles.id, type: userHandles.type, handle: userHandles.handle })
    .from(userHandles)
    .where(eq(userHandles.userId, userId));
  return toHandlesMap(rows);
};

const loadHandleState = async (db: ReturnType<typeof getDb>, userId: number) => {
  const [user] = await db
    .select({ maxCfRating: users.maxCfRating })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new HTTPException(404, { message: "User not found" });
  }

  return {
    handles: await loadHandles(db, userId),
    maxCfRating: user.maxCfRating,
  };
};

auth.get("/me/handles", requireAuth, async (c) => {
  const db = getDb(c.env.DB);
  return c.json(await loadHandleState(db, c.get("user").sub));
});

auth.put(
  "/me/handles/:type",
  requireAuth,
  validate("param", handleTypeParam),
  validate("json", handleSetSchema),
  async (c) => {
    const { type } = c.req.valid("param");
    const input = c.req.valid("json");
    const userId = c.get("user").sub;
    const db = getDb(c.env.DB);
    const updatedAt = Math.floor(Date.now() / 1000);
    let handle = input.handle;
    let maxCfRating: number | null | undefined;

    if (type === "codeforces") {
      try {
        const codeforcesUser = await getCodeforcesUser(handle);
        handle = codeforcesUser.handle;
        maxCfRating = codeforcesUser.maxRating;
      } catch (err) {
        if (err instanceof CodeforcesApiError) {
          throw new HTTPException(err.kind === "invalid-handle" ? 400 : 502, {
            message: err.message,
          });
        }
        throw err;
      }
    }

    if (type === "vjudge") {
      const result = await setSelfVjudgeHandle(c.env.DB, userId, handle, updatedAt);
      if (result === "multiple") {
        throw new HTTPException(409, {
          message:
            "Multiple VJudge handles are admin-managed; remove extras before adding or editing",
        });
      }
    } else {
      // A handle claimed by another user hits unique(type, handle) → global 409.
      // The partial target matches the non-VJudge unique index.
      await db
        .insert(userHandles)
        .values({ userId, type, handle })
        .onConflictDoUpdate({
          target: [userHandles.userId, userHandles.type],
          targetWhere: sql`${userHandles.type} <> 'vjudge'`,
          set: { handle, updatedAt },
        });
    }

    if (maxCfRating !== undefined) {
      await db
        .update(users)
        .set({ maxCfRating, updatedAt })
        .where(eq(users.id, userId));
    }

    return c.json(await loadHandleState(db, userId));
  },
);

auth.delete(
  "/me/handles/:type/:handleId",
  requireAuth,
  validate("param", handleDeleteParam),
  async (c) => {
    const { type, handleId } = c.req.valid("param");
    const userId = c.get("user").sub;
    const db = getDb(c.env.DB);

    const [deleted] = await db
      .delete(userHandles)
      .where(
        and(
          eq(userHandles.id, handleId),
          eq(userHandles.userId, userId),
          eq(userHandles.type, type),
        ),
      )
      .returning({ id: userHandles.id });
    if (!deleted) {
      throw new HTTPException(404, { message: "Handle not found" });
    }

    if (type === "codeforces") {
      await db
        .update(users)
        .set({ maxCfRating: null, updatedAt: Math.floor(Date.now() / 1000) })
        .where(eq(users.id, userId));
    }

    return c.json(await loadHandleState(db, userId));
  },
);

export default auth;
