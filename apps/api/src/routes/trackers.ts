import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../db/client";
import {
  eventPerformance,
  events,
  ranklistEvents,
  ranklists,
  ranklistUsers,
  trackers,
  users,
} from "../db/schema";
import { buildMeta } from "../lib/pagination";
import { toUserSummary } from "../lib/user-shape";
import { validate } from "../lib/validator";
import { trackersListQuery } from "../schemas/trackers";
import type { AppEnv } from "../types";

const trackerListColumns = {
  id: trackers.id,
  title: trackers.title,
  description: trackers.description,
  slug: trackers.slug,
};

// Split an array into consecutive slices of at most `size` items.
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

const trackerRoutes = new Hono<AppEnv>();

// List published trackers (id / title / description / slug), newest first.
trackerRoutes.get("/", validate("query", trackersListQuery), async (c) => {
  const { page, perPage } = c.req.valid("query");
  const db = getDb(c.env.DB);

  const where = eq(trackers.status, "published");

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select(trackerListColumns)
      .from(trackers)
      .where(where)
      .orderBy(desc(trackers.id))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(trackers).where(where),
  ]);

  return c.json({ data: rows, meta: buildMeta(page, perPage, total) });
});

// A published tracker by slug, with its published ranklists. The userCount /
// eventCount are trigger-maintained columns, so no runtime counting.
trackerRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = getDb(c.env.DB);

  const tracker = await db.query.trackers.findFirst({
    where: and(eq(trackers.slug, slug), eq(trackers.status, "published")),
    columns: { id: true, title: true, description: true, slug: true },
    with: {
      ranklists: {
        where: (r, { eq: eqOp }) => eqOp(r.status, "published"),
        columns: {
          keyword: true,
          userCount: true,
          eventCount: true,
          upsolveWeight: true,
          isLocked: true,
          considerStrictAttendance: true,
          autoAddUsers: true,
        },
        orderBy: (r, { asc }) => [asc(r.keyword)],
      },
    },
  });

  if (!tracker) {
    throw new HTTPException(404, { message: "Tracker not found" });
  }

  return c.json(tracker);
});

// Full standings for one ranklist: its events (with per-ranklist weight) and its
// users (score, rank) with each user's per-event performance. Published
// tracker + ranklist only. No pagination by design (cached later).
trackerRoutes.get("/:slug/:keyword", async (c) => {
  const slug = c.req.param("slug");
  const keyword = c.req.param("keyword");
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const [tracker] = await db
    .select({ id: trackers.id })
    .from(trackers)
    .where(and(eq(trackers.slug, slug), eq(trackers.status, "published")))
    .limit(1);
  if (!tracker) throw new HTTPException(404, { message: "Ranklist not found" });

  const [ranklist] = await db
    .select({ id: ranklists.id, keyword: ranklists.keyword })
    .from(ranklists)
    .where(
      and(
        eq(ranklists.trackerId, tracker.id),
        eq(ranklists.keyword, keyword),
        eq(ranklists.status, "published"),
      ),
    )
    .limit(1);
  if (!ranklist) throw new HTTPException(404, { message: "Ranklist not found" });

  const eventRows = await db
    .select({
      id: events.id,
      title: events.title,
      startingAt: events.startingAt,
      weight: ranklistEvents.weight,
    })
    .from(ranklistEvents)
    .innerJoin(events, eq(ranklistEvents.eventId, events.id))
    .where(eq(ranklistEvents.ranklistId, ranklist.id))
    .orderBy(asc(events.startingAt));

  const userRows = await db
    .select({
      userId: users.id,
      name: users.name,
      username: users.username,
      imageKey: users.imageKey,
      score: ranklistUsers.score,
      rank: ranklistUsers.rank,
    })
    .from(ranklistUsers)
    .innerJoin(users, eq(ranklistUsers.userId, users.id))
    .where(eq(ranklistUsers.ranklistId, ranklist.id))
    .orderBy(asc(ranklistUsers.rank), desc(ranklistUsers.score));

  const eventIds = eventRows.map((e) => e.id);
  const userIds = userRows.map((u) => u.userId);

  type PerfEntry = {
    eventId: number;
    position: number | null;
    solveCount: number;
    upsolveCount: number;
  };
  const perfByUser = new Map<number, PerfEntry[]>();
  if (eventIds.length > 0 && userIds.length > 0) {
    // D1 caps a query at 100 bound parameters. This filter binds one param per
    // event id plus one per user id, so a large ranklist (this endpoint is
    // un-paginated) overflows the limit. Chunk both IN() lists so each executed
    // query stays well under 100 params (max CHUNK * 2), then run them together.
    const CHUNK = 45;
    const eventChunks = chunk(eventIds, CHUNK);
    const userChunks = chunk(userIds, CHUNK);
    const perfRowGroups = await Promise.all(
      eventChunks.flatMap((eventChunk) =>
        userChunks.map((userChunk) =>
          db
            .select({
              eventId: eventPerformance.eventId,
              userId: eventPerformance.userId,
              position: eventPerformance.position,
              solveCount: eventPerformance.solveCount,
              upsolveCount: eventPerformance.upsolveCount,
            })
            .from(eventPerformance)
            .where(
              and(
                inArray(eventPerformance.eventId, eventChunk),
                inArray(eventPerformance.userId, userChunk),
              ),
            ),
        ),
      ),
    );
    for (const p of perfRowGroups.flat()) {
      const list = perfByUser.get(p.userId) ?? [];
      list.push({
        eventId: p.eventId,
        position: p.position,
        solveCount: p.solveCount,
        upsolveCount: p.upsolveCount,
      });
      perfByUser.set(p.userId, list);
    }
  }

  return c.json({
    keyword: ranklist.keyword,
    events: eventRows,
    users: userRows.map((u) => ({
      user: toUserSummary(
        { id: u.userId, name: u.name, username: u.username, imageKey: u.imageKey },
        origin,
      ),
      score: u.score,
      rank: u.rank,
      performance: perfByUser.get(u.userId) ?? [],
    })),
  });
});

export default trackerRoutes;
