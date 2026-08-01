import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../../db/client";
import { events, ranklistEvents, ranklists, ranklistUsers, users } from "../../db/schema";
import { parseId } from "../../lib/parse-id";
import { toUserSummary } from "../../lib/user-shape";
import { validate } from "../../lib/validator";
import { requirePermission } from "../../middleware/auth";
import {
  adminBulkIdsSchema,
  adminRanklistEventBulkSchema,
  adminRanklistEventSetSchema,
  adminRanklistUpdateSchema,
} from "../../schemas/admin";
import { ranklistColumns } from "./trackers";
import type { AppEnv } from "../../types";

const manageTrackers = requirePermission("manage_trackers");

const adminRanklistRoutes = new Hono<AppEnv>();

const requireRanklistId = (c: { req: { param: (k: "id") => string } }): number => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "Ranklist not found" });
  return id;
};

const loadRanklist = async (db: ReturnType<typeof getDb>, id: number) => {
  const [row] = await db.select(ranklistColumns).from(ranklists).where(eq(ranklists.id, id)).limit(1);
  if (!row) throw new HTTPException(404, { message: "Ranklist not found" });
  return row;
};

// Full ranklist detail: its fields, attached events (with weight), and member
// users (with trigger-maintained score/rank).
adminRanklistRoutes.get("/:id", manageTrackers, async (c) => {
  const id = requireRanklistId(c);
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const ranklist = await loadRanklist(db, id);

  const [eventRows, userRows] = await Promise.all([
    db
      .select({
        id: events.id,
        title: events.title,
        status: events.status,
        startingAt: events.startingAt,
        weight: ranklistEvents.weight,
      })
      .from(ranklistEvents)
      .innerJoin(events, eq(ranklistEvents.eventId, events.id))
      .where(eq(ranklistEvents.ranklistId, id))
      // Most recent contest first; id breaks ties so the order is stable.
      .orderBy(desc(events.startingAt), desc(events.id)),
    db
      .select({
        userId: users.id,
        name: users.name,
        username: users.username,
        imageKey: users.imageKey,
        isBanned: users.isBanned,
        banReason: users.banReason,
        score: ranklistUsers.score,
        rank: ranklistUsers.rank,
        autoAdded: ranklistUsers.autoAdded,
      })
      .from(ranklistUsers)
      .innerJoin(users, eq(ranklistUsers.userId, users.id))
      .where(eq(ranklistUsers.ranklistId, id))
      .orderBy(asc(ranklistUsers.rank), desc(ranklistUsers.score)),
  ]);

  return c.json({
    ...ranklist,
    events: eventRows,
    users: userRows.map((u) => ({
      user: toUserSummary(
        {
          id: u.userId,
          name: u.name,
          username: u.username,
          imageKey: u.imageKey,
          isBanned: u.isBanned,
          banReason: u.banReason,
        },
        origin,
      ),
      score: u.score,
      rank: u.rank,
      autoAdded: u.autoAdded,
    })),
  });
});

adminRanklistRoutes.patch("/:id", manageTrackers, validate("json", adminRanklistUpdateSchema), async (c) => {
  const id = requireRanklistId(c);
  const input = c.req.valid("json");
  if (Object.keys(input).length === 0) {
    throw new HTTPException(400, { message: "No fields to update" });
  }

  const db = getDb(c.env.DB);
  // Duplicate keyword within the tracker → UNIQUE failure → 409 via onError.
  // Changing upsolveWeight / considerStrictAttendance recalculates scores via triggers.
  const [updated] = await db
    .update(ranklists)
    .set({ ...input, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(ranklists.id, id))
    .returning(ranklistColumns);
  if (!updated) throw new HTTPException(404, { message: "Ranklist not found" });

  return c.json(updated);
});

adminRanklistRoutes.delete("/:id", manageTrackers, async (c) => {
  const id = requireRanklistId(c);
  const db = getDb(c.env.DB);

  const [deleted] = await db
    .delete(ranklists)
    .where(eq(ranklists.id, id))
    .returning({ id: ranklists.id });
  if (!deleted) throw new HTTPException(404, { message: "Ranklist not found" });

  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Events in a ranklist — PUT attaches or updates the weight; scores/ranks and
// eventCount recalculate via the DB triggers.
// ---------------------------------------------------------------------------

adminRanklistRoutes.put(
  "/:id/events/:eventId",
  manageTrackers,
  validate("json", adminRanklistEventSetSchema),
  async (c) => {
    const id = requireRanklistId(c);
    const eventId = parseId(c.req.param("eventId"));
    if (eventId === null) throw new HTTPException(404, { message: "Event not found" });

    const { weight } = c.req.valid("json");
    const db = getDb(c.env.DB);
    await loadRanklist(db, id);

    const [ev] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    if (!ev) throw new HTTPException(404, { message: "Event not found" });

    await db
      .insert(ranklistEvents)
      .values({ ranklistId: id, eventId, weight })
      .onConflictDoUpdate({
        target: [ranklistEvents.ranklistId, ranklistEvents.eventId],
        set: { weight },
      });

    return c.json({ eventId, weight });
  },
);

// Detach a batch of events, or set the same weight on all of them. Both run as
// a single statement; scores, ranks, and eventCount follow via the triggers.
adminRanklistRoutes.post(
  "/:id/events/bulk",
  manageTrackers,
  validate("json", adminRanklistEventBulkSchema),
  async (c) => {
    const id = requireRanklistId(c);
    const { ids, action, weight } = c.req.valid("json");
    if (action === "set-weight" && weight === undefined) {
      throw new HTTPException(400, { message: "weight is required for set-weight" });
    }

    const db = getDb(c.env.DB);
    await loadRanklist(db, id);

    const scope = and(eq(ranklistEvents.ranklistId, id), inArray(ranklistEvents.eventId, ids));

    if (action === "detach") {
      const detached = await db
        .delete(ranklistEvents)
        .where(scope)
        .returning({ eventId: ranklistEvents.eventId });
      return c.json({ ok: true, affected: detached.length });
    }

    const updated = await db
      .update(ranklistEvents)
      .set({ weight })
      .where(scope)
      .returning({ eventId: ranklistEvents.eventId });
    return c.json({ ok: true, affected: updated.length });
  },
);

adminRanklistRoutes.delete("/:id/events/:eventId", manageTrackers, async (c) => {
  const id = requireRanklistId(c);
  const eventId = parseId(c.req.param("eventId"));
  if (eventId === null) throw new HTTPException(404, { message: "Event not found" });

  const db = getDb(c.env.DB);
  const [deleted] = await db
    .delete(ranklistEvents)
    .where(and(eq(ranklistEvents.ranklistId, id), eq(ranklistEvents.eventId, eventId)))
    .returning({ eventId: ranklistEvents.eventId });
  if (!deleted) throw new HTTPException(404, { message: "Event is not in this ranklist" });

  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Users in a ranklist — PUT is idempotent; score/rank and userCount are
// trigger-maintained from the moment the row exists.
// ---------------------------------------------------------------------------

adminRanklistRoutes.put("/:id/users/:userId", manageTrackers, async (c) => {
  const id = requireRanklistId(c);
  const userId = parseId(c.req.param("userId"));
  if (userId === null) throw new HTTPException(404, { message: "User not found" });

  const db = getDb(c.env.DB);
  await loadRanklist(db, id);

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new HTTPException(404, { message: "User not found" });

  // An explicit admin add always counts as manual (autoAdded = false), including
  // promoting a member the auto-add triggers inserted, so auto-removal skips them.
  await db
    .insert(ranklistUsers)
    .values({ ranklistId: id, userId, autoAdded: false })
    .onConflictDoUpdate({
      target: [ranklistUsers.ranklistId, ranklistUsers.userId],
      set: { autoAdded: false },
    });

  const [row] = await db
    .select({ score: ranklistUsers.score, rank: ranklistUsers.rank })
    .from(ranklistUsers)
    .where(and(eq(ranklistUsers.ranklistId, id), eq(ranklistUsers.userId, userId)))
    .limit(1);

  return c.json({ userId, score: row.score, rank: row.rank });
});

// Remove a batch of members in one statement. userCount and the remaining
// members' ranks are recalculated by the triggers.
adminRanklistRoutes.post(
  "/:id/users/bulk-remove",
  manageTrackers,
  validate("json", adminBulkIdsSchema),
  async (c) => {
    const id = requireRanklistId(c);
    const { ids } = c.req.valid("json");
    const db = getDb(c.env.DB);
    await loadRanklist(db, id);

    const removed = await db
      .delete(ranklistUsers)
      .where(and(eq(ranklistUsers.ranklistId, id), inArray(ranklistUsers.userId, ids)))
      .returning({ userId: ranklistUsers.userId });

    return c.json({ ok: true, affected: removed.length });
  },
);

adminRanklistRoutes.delete("/:id/users/:userId", manageTrackers, async (c) => {
  const id = requireRanklistId(c);
  const userId = parseId(c.req.param("userId"));
  if (userId === null) throw new HTTPException(404, { message: "User not found" });

  const db = getDb(c.env.DB);
  const [deleted] = await db
    .delete(ranklistUsers)
    .where(and(eq(ranklistUsers.ranklistId, id), eq(ranklistUsers.userId, userId)))
    .returning({ userId: ranklistUsers.userId });
  if (!deleted) throw new HTTPException(404, { message: "User is not in this ranklist" });

  return c.json({ ok: true });
});

export default adminRanklistRoutes;
