import { and, asc, count, desc, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../db/client";
import { ranklists, ranklistUsers, trackers, userHandles, users } from "../db/schema";
import { buildMeta } from "../lib/pagination";
import { imageUrlFor, toHandlesMap, toProgrammerListItem } from "../lib/user-shape";
import { validate } from "../lib/validator";
import { programmersListQuery } from "../schemas/programmers";
import type { HandleType } from "../schemas/handles";
import type { AppEnv } from "../types";

const programmerRoutes = new Hono<AppEnv>();

// Public directory of programmers — only users who have at least one handle.
// Ordered by max CF rating (unrated last), then name. Searchable on name/username.
programmerRoutes.get("/", validate("query", programmersListQuery), async (c) => {
  const { page, perPage, q } = c.req.valid("query");
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const filters: SQL[] = [
    inArray(users.id, db.select({ id: userHandles.userId }).from(userHandles)),
  ];
  if (q) {
    const term = `%${q}%`;
    const expr = or(like(users.name, term), like(users.username, term));
    if (expr) filters.push(expr);
  }
  const where = and(...filters);

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        imageKey: users.imageKey,
        maxCfRating: users.maxCfRating,
      })
      .from(users)
      .where(where)
      // Unrated (null) users sort last, then by rating desc, then name asc.
      .orderBy(
        sql`${users.maxCfRating} is null`,
        desc(users.maxCfRating),
        asc(users.name),
      )
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(users).where(where),
  ]);

  const userIds = rows.map((r) => r.id);
  const handlesByUser = new Map<number, { type: HandleType; handle: string }[]>();
  if (userIds.length > 0) {
    const handleRows = await db
      .select({
        userId: userHandles.userId,
        type: userHandles.type,
        handle: userHandles.handle,
      })
      .from(userHandles)
      .where(inArray(userHandles.userId, userIds));
    for (const h of handleRows) {
      const list = handlesByUser.get(h.userId) ?? [];
      list.push({ type: h.type, handle: h.handle });
      handlesByUser.set(h.userId, list);
    }
  }

  return c.json({
    data: rows.map((r) => toProgrammerListItem(r, handlesByUser.get(r.id) ?? [], origin)),
    meta: buildMeta(page, perPage, total),
  });
});

// A single programmer by username, with their handles and tracker performance.
programmerRoutes.get("/:username", async (c) => {
  const username = c.req.param("username");
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      imageKey: users.imageKey,
      maxCfRating: users.maxCfRating,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (!user) throw new HTTPException(404, { message: "Programmer not found" });

  const handleRows = await db
    .select({ type: userHandles.type, handle: userHandles.handle })
    .from(userHandles)
    .where(eq(userHandles.userId, user.id));

  // One row per (published) ranklist the user belongs to, with the ranklist's
  // trigger-maintained user/event counts and this user's score & rank.
  const perfRows = await db
    .select({
      trackerTitle: trackers.title,
      trackerSlug: trackers.slug,
      keyword: ranklists.keyword,
      userCount: ranklists.userCount,
      eventCount: ranklists.eventCount,
      score: ranklistUsers.score,
      rank: ranklistUsers.rank,
    })
    .from(ranklistUsers)
    .innerJoin(ranklists, eq(ranklistUsers.ranklistId, ranklists.id))
    .innerJoin(trackers, eq(ranklists.trackerId, trackers.id))
    .where(
      and(
        eq(ranklistUsers.userId, user.id),
        eq(ranklists.status, "published"),
        eq(trackers.status, "published"),
      ),
    )
    .orderBy(asc(trackers.title), asc(ranklists.keyword));

  type RanklistPerf = {
    keyword: string;
    userCount: number;
    eventCount: number;
    score: number;
    rank: number;
  };
  const byTracker = new Map<
    string,
    { tracker: { title: string; slug: string }; ranklists: RanklistPerf[] }
  >();
  for (const r of perfRows) {
    const entry =
      byTracker.get(r.trackerSlug) ??
      { tracker: { title: r.trackerTitle, slug: r.trackerSlug }, ranklists: [] };
    entry.ranklists.push({
      keyword: r.keyword,
      userCount: r.userCount,
      eventCount: r.eventCount,
      score: r.score,
      rank: r.rank,
    });
    byTracker.set(r.trackerSlug, entry);
  }

  return c.json({
    id: user.id,
    name: user.name,
    username: user.username,
    image: imageUrlFor(origin, user.imageKey),
    maxCfRating: user.maxCfRating,
    handles: toHandlesMap(handleRows),
    trackerPerformance: [...byTracker.values()],
  });
});

export default programmerRoutes;
