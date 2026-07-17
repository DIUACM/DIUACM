import { and, asc, count, desc, eq, like, or, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../../db/client";
import { ranklists, trackers } from "../../db/schema";
import { buildMeta } from "../../lib/pagination";
import { parseId } from "../../lib/parse-id";
import { validate } from "../../lib/validator";
import {
  adminRanklistCreateSchema,
  adminTrackerCreateSchema,
  adminTrackersListQuery,
  adminTrackerUpdateSchema,
} from "../../schemas/admin";
import type { AppEnv } from "../../types";

const trackerColumns = {
  id: trackers.id,
  title: trackers.title,
  description: trackers.description,
  slug: trackers.slug,
  status: trackers.status,
  createdAt: trackers.createdAt,
  updatedAt: trackers.updatedAt,
};

export const ranklistColumns = {
  id: ranklists.id,
  trackerId: ranklists.trackerId,
  keyword: ranklists.keyword,
  description: ranklists.description,
  status: ranklists.status,
  upsolveWeight: ranklists.upsolveWeight,
  isLocked: ranklists.isLocked,
  considerStrictAttendance: ranklists.considerStrictAttendance,
  userCount: ranklists.userCount,
  eventCount: ranklists.eventCount,
  createdAt: ranklists.createdAt,
  updatedAt: ranklists.updatedAt,
};

const adminTrackerRoutes = new Hono<AppEnv>();

// All trackers regardless of status, newest first.
adminTrackerRoutes.get("/", validate("query", adminTrackersListQuery), async (c) => {
  const { page, perPage, status, q } = c.req.valid("query");
  const db = getDb(c.env.DB);

  const filters: SQL[] = [];
  if (status) filters.push(eq(trackers.status, status));
  if (q) {
    const term = `%${q}%`;
    const expr = or(like(trackers.title, term), like(trackers.slug, term));
    if (expr) filters.push(expr);
  }
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select(trackerColumns)
      .from(trackers)
      .where(where)
      .orderBy(desc(trackers.id))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(trackers).where(where),
  ]);

  return c.json({ data: rows, meta: buildMeta(page, perPage, total) });
});

adminTrackerRoutes.post("/", validate("json", adminTrackerCreateSchema), async (c) => {
  const input = c.req.valid("json");
  const db = getDb(c.env.DB);

  // Duplicate slug → UNIQUE failure → 409 via onError.
  const [tracker] = await db.insert(trackers).values(input).returning(trackerColumns);
  return c.json(tracker, 201);
});

adminTrackerRoutes.get("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "Tracker not found" });
  const db = getDb(c.env.DB);

  const [tracker] = await db
    .select(trackerColumns)
    .from(trackers)
    .where(eq(trackers.id, id))
    .limit(1);
  if (!tracker) throw new HTTPException(404, { message: "Tracker not found" });

  const ranklistRows = await db
    .select(ranklistColumns)
    .from(ranklists)
    .where(eq(ranklists.trackerId, id))
    .orderBy(asc(ranklists.keyword));

  return c.json({ ...tracker, ranklists: ranklistRows });
});

adminTrackerRoutes.patch("/:id", validate("json", adminTrackerUpdateSchema), async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "Tracker not found" });
  const input = c.req.valid("json");
  if (Object.keys(input).length === 0) {
    throw new HTTPException(400, { message: "No fields to update" });
  }

  const db = getDb(c.env.DB);
  const [updated] = await db
    .update(trackers)
    .set({ ...input, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(trackers.id, id))
    .returning(trackerColumns);
  if (!updated) throw new HTTPException(404, { message: "Tracker not found" });

  return c.json(updated);
});

// Deleting a tracker cascades its ranklists and their pivot rows (FKs).
adminTrackerRoutes.delete("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "Tracker not found" });

  const db = getDb(c.env.DB);
  const [deleted] = await db
    .delete(trackers)
    .where(eq(trackers.id, id))
    .returning({ id: trackers.id });
  if (!deleted) throw new HTTPException(404, { message: "Tracker not found" });

  return c.json({ ok: true });
});

adminTrackerRoutes.post(
  "/:id/ranklists",
  validate("json", adminRanklistCreateSchema),
  async (c) => {
    const id = parseId(c.req.param("id"));
    if (id === null) throw new HTTPException(404, { message: "Tracker not found" });
    const input = c.req.valid("json");
    const db = getDb(c.env.DB);

    const [tracker] = await db
      .select({ id: trackers.id })
      .from(trackers)
      .where(eq(trackers.id, id))
      .limit(1);
    if (!tracker) throw new HTTPException(404, { message: "Tracker not found" });

    // Duplicate keyword within the tracker → UNIQUE failure → 409 via onError.
    const [ranklist] = await db
      .insert(ranklists)
      .values({ ...input, trackerId: id })
      .returning(ranklistColumns);
    return c.json(ranklist, 201);
  },
);

export default adminTrackerRoutes;
