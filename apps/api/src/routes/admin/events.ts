import { and, asc, count, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../../db/client";
import { eventAttendance, eventMedia, eventPerformance, events, users } from "../../db/schema";
import { ContestMetadataError, getContestMetadata } from "../../lib/contest-metadata";
import { parseImageUpload } from "../../lib/image-upload";
import { likeContains } from "../../lib/like";
import { logError } from "../../lib/log";
import { buildMeta } from "../../lib/pagination";
import { parseId } from "../../lib/parse-id";
import { fileUrlFor, toUserSummary } from "../../lib/user-shape";
import { validate } from "../../lib/validator";
import { requirePermission } from "../../middleware/auth";
import {
  adminAttendanceAddSchema,
  adminBulkIdsSchema,
  adminBulkPublishSchema,
  adminContestDetailsQuery,
  adminEventCreateSchema,
  adminEventsListQuery,
  adminEventUpdateSchema,
  adminPerformanceSetSchema,
} from "../../schemas/admin";
import type { AppEnv } from "../../types";

// Unlike the public routes, admins also see eventPassword.
const eventColumns = {
  id: events.id,
  title: events.title,
  description: events.description,
  type: events.type,
  status: events.status,
  startingAt: events.startingAt,
  endingAt: events.endingAt,
  eventLink: events.eventLink,
  eventPassword: events.eventPassword,
  participationScope: events.participationScope,
  openForAttendance: events.openForAttendance,
  strictAttendance: events.strictAttendance,
  attendanceCount: events.attendanceCount,
  performanceCount: events.performanceCount,
  createdAt: events.createdAt,
  updatedAt: events.updatedAt,
};

// Events, media, and performance need manage_events; the attendance routes
// below need manage_attendance instead.
const manageEvents = requirePermission("manage_events");
const manageAttendance = requirePermission("manage_attendance");

const adminEventRoutes = new Hono<AppEnv>();

const loadEvent = async (db: ReturnType<typeof getDb>, id: number) => {
  const [ev] = await db.select(eventColumns).from(events).where(eq(events.id, id)).limit(1);
  if (!ev) throw new HTTPException(404, { message: "Event not found" });
  return ev;
};

const requireEventId = (c: { req: { param: (k: "id") => string } }): number => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "Event not found" });
  return id;
};

// All events regardless of status, newest first.
adminEventRoutes.get("/", manageEvents, validate("query", adminEventsListQuery), async (c) => {
  const { page, perPage, type, scope, status, q } = c.req.valid("query");
  const db = getDb(c.env.DB);

  const filters: SQL[] = [];
  if (type) filters.push(eq(events.type, type));
  if (scope) filters.push(eq(events.participationScope, scope));
  if (status) filters.push(eq(events.status, status));
  if (q) {
    const expr = or(
      likeContains(events.title, q),
      likeContains(events.description, q),
      likeContains(events.eventLink, q),
    );
    if (expr) filters.push(expr);
  }
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select(eventColumns)
      .from(events)
      .where(where)
      .orderBy(desc(events.startingAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(events).where(where),
  ]);

  return c.json({ data: rows, meta: buildMeta(page, perPage, total) });
});

adminEventRoutes.get(
  "/contest-details",
  manageEvents,
  validate("query", adminContestDetailsQuery),
  async (c) => {
    const { link } = c.req.valid("query");
    try {
      return c.json(await getContestMetadata(link));
    } catch (error) {
      if (!(error instanceof ContestMetadataError)) throw error;
      const status =
        error.kind === "invalid-link" || error.kind === "unsupported"
          ? 400
          : error.kind === "not-found"
            ? 404
            : error.kind === "rate-limited"
              ? 429
              : 502;
      throw new HTTPException(status, { message: error.message });
    }
  },
);

adminEventRoutes.post("/", manageEvents, validate("json", adminEventCreateSchema), async (c) => {
  const input = c.req.valid("json");
  if (input.endingAt <= input.startingAt) {
    throw new HTTPException(400, { message: "endingAt must be after startingAt" });
  }
  const db = getDb(c.env.DB);

  const [ev] = await db.insert(events).values(input).returning(eventColumns);
  return c.json(ev, 201);
});

adminEventRoutes.get("/:id", manageEvents, async (c) => {
  const id = requireEventId(c);
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const ev = await loadEvent(db, id);
  const media = await db
    .select({ id: eventMedia.id, type: eventMedia.type, key: eventMedia.key })
    .from(eventMedia)
    .where(eq(eventMedia.eventId, id))
    .orderBy(asc(eventMedia.order), asc(eventMedia.id));

  return c.json({
    ...ev,
    media: media.map((m) => ({ id: m.id, type: m.type, url: fileUrlFor(origin, m.key) })),
  });
});

adminEventRoutes.patch("/:id", manageEvents, validate("json", adminEventUpdateSchema), async (c) => {
  const id = requireEventId(c);
  const input = c.req.valid("json");
  if (Object.keys(input).length === 0) {
    throw new HTTPException(400, { message: "No fields to update" });
  }

  const db = getDb(c.env.DB);
  const existing = await loadEvent(db, id);

  const startingAt = input.startingAt ?? existing.startingAt;
  const endingAt = input.endingAt ?? existing.endingAt;
  if (endingAt <= startingAt) {
    throw new HTTPException(400, { message: "endingAt must be after startingAt" });
  }

  const [updated] = await db
    .update(events)
    .set({ ...input, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(events.id, id))
    .returning(eventColumns);
  return c.json(updated);
});

// Deleting an event cascades its media rows, attendance, performance, and
// ranklist links (FKs + triggers); stored media objects are removed best-effort.
adminEventRoutes.delete("/:id", manageEvents, async (c) => {
  const id = requireEventId(c);
  const db = getDb(c.env.DB);
  await loadEvent(db, id);

  const media = await db
    .select({ key: eventMedia.key })
    .from(eventMedia)
    .where(eq(eventMedia.eventId, id));

  await db.delete(events).where(eq(events.id, id));

  for (const m of media) {
    try {
      await c.env.BUCKET.delete(m.key);
    } catch (err) {
      logError("r2.event_media_delete_failed", err, { objectKey: m.key });
    }
  }

  return c.json({ ok: true });
});

// Publish, unpublish, or delete a batch of events. Deletes cascade the same
// rows as DELETE /:id; their stored media objects go best-effort afterwards.
adminEventRoutes.post("/bulk", manageEvents, validate("json", adminBulkPublishSchema), async (c) => {
  const { ids, action } = c.req.valid("json");
  const db = getDb(c.env.DB);

  if (action === "delete") {
    const media = await db
      .select({ key: eventMedia.key })
      .from(eventMedia)
      .where(inArray(eventMedia.eventId, ids));

    const deleted = await db
      .delete(events)
      .where(inArray(events.id, ids))
      .returning({ id: events.id });

    const keys = media.map((item) => item.key);
    if (keys.length > 0) {
      try {
        await c.env.BUCKET.delete(keys);
      } catch (err) {
        logError("r2.event_media_bulk_delete_failed", err, {
          objectKeys: keys,
        });
      }
    }

    return c.json({ ok: true, affected: deleted.length });
  }

  const updated = await db
    .update(events)
    .set({
      status: action === "publish" ? "published" : "draft",
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(inArray(events.id, ids))
    .returning({ id: events.id });
  return c.json({ ok: true, affected: updated.length });
});

// ---------------------------------------------------------------------------
// Media — image uploads only (multipart field "image"); appended last.
// ---------------------------------------------------------------------------

adminEventRoutes.post("/:id/media", manageEvents, async (c) => {
  const id = requireEventId(c);
  const db = getDb(c.env.DB);
  await loadEvent(db, id);

  const { buffer, contentType, ext } = await parseImageUpload(c);
  const key = `events/${id}/${crypto.randomUUID()}.${ext}`;
  await c.env.BUCKET.put(key, buffer, { httpMetadata: { contentType } });

  let row;
  try {
    const [{ value: order }] = await db
      .select({ value: count() })
      .from(eventMedia)
      .where(eq(eventMedia.eventId, id));
    [row] = await db
      .insert(eventMedia)
      .values({ eventId: id, type: "image", key, order })
      .returning({ id: eventMedia.id, type: eventMedia.type });
  } catch (err) {
    // DB insert failed — don't leave an orphan object in R2.
    try {
      await c.env.BUCKET.delete(key);
    } catch (cleanupErr) {
      logError("r2.orphan_cleanup_failed", cleanupErr, { objectKey: key });
    }
    throw err;
  }

  const origin = new URL(c.req.url).origin;
  return c.json({ id: row.id, type: row.type, url: fileUrlFor(origin, key) }, 201);
});

adminEventRoutes.delete("/:id/media/:mediaId", manageEvents, async (c) => {
  const id = requireEventId(c);
  const mediaId = parseId(c.req.param("mediaId"));
  if (mediaId === null) throw new HTTPException(404, { message: "Media not found" });

  const db = getDb(c.env.DB);
  const [deleted] = await db
    .delete(eventMedia)
    .where(and(eq(eventMedia.id, mediaId), eq(eventMedia.eventId, id)))
    .returning({ key: eventMedia.key });
  if (!deleted) throw new HTTPException(404, { message: "Media not found" });

  try {
    await c.env.BUCKET.delete(deleted.key);
  } catch (err) {
    logError("r2.event_media_delete_failed", err, {
      objectKey: deleted.key,
    });
  }

  return c.json({ ok: true });
});

adminEventRoutes.post(
  "/:id/media/bulk-remove",
  manageEvents,
  validate("json", adminBulkIdsSchema),
  async (c) => {
    const id = requireEventId(c);
    const { ids } = c.req.valid("json");
    const db = getDb(c.env.DB);
    await loadEvent(db, id);

    const removed = await db
      .delete(eventMedia)
      .where(and(eq(eventMedia.eventId, id), inArray(eventMedia.id, ids)))
      .returning({ key: eventMedia.key });

    const keys = removed.map((item) => item.key);
    if (keys.length > 0) {
      try {
        await c.env.BUCKET.delete(keys);
      } catch (err) {
        logError("r2.event_media_bulk_delete_failed", err, {
          objectKeys: keys,
        });
      }
    }

    return c.json({ ok: true, affected: removed.length });
  },
);

// ---------------------------------------------------------------------------
// Attendance — admins can add/remove anyone, ignoring password and window.
// ---------------------------------------------------------------------------

adminEventRoutes.post("/:id/attendance", manageAttendance, validate("json", adminAttendanceAddSchema), async (c) => {
  const id = requireEventId(c);
  const { userId } = c.req.valid("json");
  const db = getDb(c.env.DB);
  await loadEvent(db, id);

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new HTTPException(404, { message: "User not found" });

  // Duplicate → unique(event_id, user_id) → 409 via onError. Score triggers
  // recalculate strict-attendance ranklists automatically.
  const [row] = await db
    .insert(eventAttendance)
    .values({ eventId: id, userId })
    .returning({ attendedAt: eventAttendance.createdAt });

  return c.json({ ok: true, attendedAt: row.attendedAt }, 201);
});

// `ids` are user ids. Strict-attendance ranklists recalculate via the triggers.
adminEventRoutes.post(
  "/:id/attendance/bulk-remove",
  manageAttendance,
  validate("json", adminBulkIdsSchema),
  async (c) => {
    const id = requireEventId(c);
    const { ids } = c.req.valid("json");
    const db = getDb(c.env.DB);
    await loadEvent(db, id);

    const removed = await db
      .delete(eventAttendance)
      .where(and(eq(eventAttendance.eventId, id), inArray(eventAttendance.userId, ids)))
      .returning({ id: eventAttendance.id });

    return c.json({ ok: true, affected: removed.length });
  },
);

adminEventRoutes.delete("/:id/attendance/:userId", manageAttendance, async (c) => {
  const id = requireEventId(c);
  const userId = parseId(c.req.param("userId"));
  if (userId === null) throw new HTTPException(404, { message: "Attendance not found" });

  const db = getDb(c.env.DB);
  const [deleted] = await db
    .delete(eventAttendance)
    .where(and(eq(eventAttendance.eventId, id), eq(eventAttendance.userId, userId)))
    .returning({ id: eventAttendance.id });
  if (!deleted) throw new HTTPException(404, { message: "Attendance not found" });

  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Performance — one row per (event, user), fully replaced on PUT. Ranklist
// scores/ranks recalculate via the DB triggers.
// ---------------------------------------------------------------------------

adminEventRoutes.put(
  "/:id/performance/:userId",
  manageEvents,
  validate("json", adminPerformanceSetSchema),
  async (c) => {
    const id = requireEventId(c);
    const userId = parseId(c.req.param("userId"));
    if (userId === null) throw new HTTPException(404, { message: "User not found" });

    const { position, solveCount, upsolveCount } = c.req.valid("json");
    const db = getDb(c.env.DB);
    await loadEvent(db, id);

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        imageKey: users.imageKey,
        isBanned: users.isBanned,
        banReason: users.banReason,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new HTTPException(404, { message: "User not found" });

    await db
      .insert(eventPerformance)
      .values({ eventId: id, userId, position, solveCount, upsolveCount })
      .onConflictDoUpdate({
        target: [eventPerformance.eventId, eventPerformance.userId],
        set: { position, solveCount, upsolveCount, updatedAt: sql`(unixepoch())` },
      });

    const origin = new URL(c.req.url).origin;
    return c.json({ position, solveCount, upsolveCount, user: toUserSummary(user, origin) });
  },
);

// `ids` are user ids. Ranklist scores and ranks recalculate via the triggers.
adminEventRoutes.post(
  "/:id/performance/bulk-remove",
  manageEvents,
  validate("json", adminBulkIdsSchema),
  async (c) => {
    const id = requireEventId(c);
    const { ids } = c.req.valid("json");
    const db = getDb(c.env.DB);
    await loadEvent(db, id);

    const removed = await db
      .delete(eventPerformance)
      .where(and(eq(eventPerformance.eventId, id), inArray(eventPerformance.userId, ids)))
      .returning({ id: eventPerformance.id });

    return c.json({ ok: true, affected: removed.length });
  },
);

adminEventRoutes.delete("/:id/performance/:userId", manageEvents, async (c) => {
  const id = requireEventId(c);
  const userId = parseId(c.req.param("userId"));
  if (userId === null) throw new HTTPException(404, { message: "Performance not found" });

  const db = getDb(c.env.DB);
  const [deleted] = await db
    .delete(eventPerformance)
    .where(and(eq(eventPerformance.eventId, id), eq(eventPerformance.userId, userId)))
    .returning({ id: eventPerformance.id });
  if (!deleted) throw new HTTPException(404, { message: "Performance not found" });

  return c.json({ ok: true });
});

export default adminEventRoutes;
