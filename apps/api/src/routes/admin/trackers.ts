import { and, asc, count, desc, eq, or, sql, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../../db/client";
import { ranklists, trackers } from "../../db/schema";
import { likeContains } from "../../lib/like";
import { buildMeta } from "../../lib/pagination";
import { parseId } from "../../lib/parse-id";
import { validate } from "../../lib/validator";
import { requirePermission } from "../../middleware/auth";
import {
  adminRanklistCreateSchema,
  adminReorderSchema,
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
  position: trackers.position,
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
  autoAddUsers: ranklists.autoAddUsers,
  position: ranklists.position,
  userCount: ranklists.userCount,
  eventCount: ranklists.eventCount,
  createdAt: ranklists.createdAt,
  updatedAt: ranklists.updatedAt,
};

const manageTrackers = requirePermission("manage_trackers");

const adminTrackerRoutes = new Hono<AppEnv>();

// All trackers regardless of status, in display order.
adminTrackerRoutes.get("/", manageTrackers, validate("query", adminTrackersListQuery), async (c) => {
  const { page, perPage, status, q } = c.req.valid("query");
  const db = getDb(c.env.DB);

  const filters: SQL[] = [];
  if (status) filters.push(eq(trackers.status, status));
  if (q) {
    const expr = or(likeContains(trackers.title, q), likeContains(trackers.slug, q));
    if (expr) filters.push(expr);
  }
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select(trackerColumns)
      .from(trackers)
      .where(where)
      .orderBy(asc(trackers.position), desc(trackers.id))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(trackers).where(where),
  ]);

  return c.json({ data: rows, meta: buildMeta(page, perPage, total) });
});

adminTrackerRoutes.post("/", manageTrackers, validate("json", adminTrackerCreateSchema), async (c) => {
  const input = c.req.valid("json");
  const db = getDb(c.env.DB);

  // Duplicate slug → UNIQUE failure → 409 via onError. New trackers go to the
  // end of the display order.
  const [tracker] = await db
    .insert(trackers)
    .values({
      ...input,
      position: sql`(SELECT COALESCE(MAX(position), -1) + 1 FROM trackers)`,
    })
    .returning(trackerColumns);
  return c.json(tracker, 201);
});

adminTrackerRoutes.get("/:id", manageTrackers, async (c) => {
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
    .orderBy(asc(ranklists.position), asc(ranklists.id));

  return c.json({ ...tracker, ranklists: ranklistRows });
});

adminTrackerRoutes.patch("/:id", manageTrackers, validate("json", adminTrackerUpdateSchema), async (c) => {
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
adminTrackerRoutes.delete("/:id", manageTrackers, async (c) => {
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
  manageTrackers,
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
    // New ranklists go to the end of the tracker's display order.
    const [ranklist] = await db
      .insert(ranklists)
      .values({
        ...input,
        trackerId: id,
        position: sql`(SELECT COALESCE(MAX(position), -1) + 1 FROM ranklists WHERE tracker_id = ${id})`,
      })
      .returning(ranklistColumns);
    return c.json(ranklist, 201);
  },
);

// Set display positions for a batch of trackers (atomic via D1 batch).
adminTrackerRoutes.post(
  "/reorder",
  manageTrackers,
  validate("json", adminReorderSchema),
  async (c) => {
    const { items } = c.req.valid("json");
    const db = getDb(c.env.DB);
    const now = Math.floor(Date.now() / 1000);

    const statements = items.map((item) =>
      db
        .update(trackers)
        .set({ position: item.position, updatedAt: now })
        .where(eq(trackers.id, item.id)),
    );
    await db.batch([statements[0], ...statements.slice(1)]);

    return c.json({ ok: true });
  },
);

// Set display positions for a batch of ranklists within one tracker.
adminTrackerRoutes.post(
  "/:id/ranklists/reorder",
  manageTrackers,
  validate("json", adminReorderSchema),
  async (c) => {
    const id = parseId(c.req.param("id"));
    if (id === null) throw new HTTPException(404, { message: "Tracker not found" });
    const { items } = c.req.valid("json");
    const db = getDb(c.env.DB);
    const now = Math.floor(Date.now() / 1000);

    const [tracker] = await db
      .select({ id: trackers.id })
      .from(trackers)
      .where(eq(trackers.id, id))
      .limit(1);
    if (!tracker) throw new HTTPException(404, { message: "Tracker not found" });

    const statements = items.map((item) =>
      db
        .update(ranklists)
        .set({ position: item.position, updatedAt: now })
        .where(and(eq(ranklists.id, item.id), eq(ranklists.trackerId, id))),
    );
    await db.batch([statements[0], ...statements.slice(1)]);

    return c.json({ ok: true });
  },
);

export default adminTrackerRoutes;
