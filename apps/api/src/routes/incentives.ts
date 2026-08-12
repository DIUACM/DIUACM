import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../db/client";
import { incentiveApplications } from "../db/schema";
import { validate } from "../lib/validator";
import { requireAuth } from "../middleware/auth";
import { incentiveApplicationSubmitSchema } from "../schemas/incentives";
import type { AppEnv } from "../types";

// Every column is safe to return to the applicant themselves.
export const incentiveApplicationColumns = {
  id: incentiveApplications.id,
  userId: incentiveApplications.userId,
  fullName: incentiveApplications.fullName,
  studentId: incentiveApplications.studentId,
  batch: incentiveApplications.batch,
  email: incentiveApplications.email,
  currentSemester: incentiveApplications.currentSemester,
  phoneNumber: incentiveApplications.phoneNumber,
  courses: incentiveApplications.courses,
  createdAt: incentiveApplications.createdAt,
  updatedAt: incentiveApplications.updatedAt,
};

const incentives = new Hono<AppEnv>();

// The caller's own application, or null if they haven't applied yet. Null is a
// normal state here, not a 404 — the page renders the blank form from it.
incentives.get("/me", requireAuth, async (c) => {
  const db = getDb(c.env.DB);
  const [application] = await db
    .select(incentiveApplicationColumns)
    .from(incentiveApplications)
    .where(eq(incentiveApplications.userId, c.get("user").sub))
    .limit(1);

  return c.json({ application: application ?? null });
});

// Submit or replace the caller's application. One row per user (unique user_id),
// so this is an upsert: resubmitting overwrites what was there before.
incentives.put(
  "/me",
  requireAuth,
  validate("json", incentiveApplicationSubmitSchema),
  async (c) => {
    const input = c.req.valid("json");
    const userId = c.get("user").sub;
    const db = getDb(c.env.DB);
    const now = Math.floor(Date.now() / 1000);

    // Taken from the account rather than the request body so the recorded
    // address is always one the applicant has proven they control.
    const email = c.get("authAccount").email;

    const [application] = await db
      .insert(incentiveApplications)
      .values({ ...input, userId, email })
      .onConflictDoUpdate({
        target: incentiveApplications.userId,
        set: { ...input, email, updatedAt: now },
      })
      .returning(incentiveApplicationColumns);

    if (!application) {
      throw new HTTPException(500, { message: "Could not save the application" });
    }
    return c.json({ application });
  },
);

export default incentives;
