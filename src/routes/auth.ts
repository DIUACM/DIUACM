import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../db/client";
import { users } from "../db/schema";
import { signAuthToken } from "../lib/jwt";
import { hashPassword, verifyPassword } from "../lib/password";
import { validate } from "../lib/validator";
import { requireAuth } from "../middleware/auth";
import { loginSchema, profileUpdateSchema, registerSchema } from "../schemas/auth";
import type { AppEnv } from "../types";

// Columns safe to return to clients — never includes passwordHash.
const publicUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  username: users.username,
  studentId: users.studentId,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

const auth = new Hono<AppEnv>();

auth.post("/register", validate("json", registerSchema), async (c) => {
  const { name, username, password, studentId } = c.req.valid("json");
  const email = c.req.valid("json").email.trim().toLowerCase();
  const db = getDb(c.env.DB);

  const passwordHash = await hashPassword(password);

  // Duplicate email / username / studentId surface as a UNIQUE constraint
  // failure, mapped to 409 by the global onError handler.
  const [user] = await db
    .insert(users)
    .values({ name, email, username, studentId, passwordHash })
    .returning(publicUserColumns);

  const token = await signAuthToken(
    { id: user.id, username: user.username },
    c.env.JWT_SECRET,
  );
  return c.json({ token, user }, 201);
});

auth.post("/login", validate("json", loginSchema), async (c) => {
  const { password } = c.req.valid("json");
  const email = c.req.valid("json").email.trim().toLowerCase();
  const db = getDb(c.env.DB);

  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Same error whether the email is unknown or the password is wrong, so we
  // don't leak which emails are registered.
  if (!row || !(await verifyPassword(password, row.passwordHash))) {
    throw new HTTPException(401, { message: "Invalid email or password" });
  }

  const token = await signAuthToken(
    { id: row.id, username: row.username },
    c.env.JWT_SECRET,
  );
  const { passwordHash: _passwordHash, ...user } = row;
  return c.json({ token, user });
});

auth.get("/me", requireAuth, async (c) => {
  const payload = c.get("user");
  const db = getDb(c.env.DB);

  const [me] = await db
    .select(publicUserColumns)
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  if (!me) {
    throw new HTTPException(404, { message: "User not found" });
  }
  return c.json({ user: me });
});

auth.patch("/me", requireAuth, validate("json", profileUpdateSchema), async (c) => {
  const input = c.req.valid("json");
  if (Object.keys(input).length === 0) {
    throw new HTTPException(400, { message: "No fields to update" });
  }

  const payload = c.get("user");
  const db = getDb(c.env.DB);

  // A duplicate username/studentId surfaces as a UNIQUE constraint error → 409
  // via onError. Drizzle omits `undefined` fields from the SET clause, so only
  // the provided fields change.
  const [updated] = await db
    .update(users)
    .set({ ...input, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(users.id, payload.sub))
    .returning(publicUserColumns);

  if (!updated) {
    throw new HTTPException(404, { message: "User not found" });
  }
  return c.json({ user: updated });
});

export default auth;
