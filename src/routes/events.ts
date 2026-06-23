import { and, asc, count, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../db/client";
import { eventAttendance, eventPerformance, events, users } from "../db/schema";
import { buildMeta } from "../lib/pagination";
import { parseId } from "../lib/parse-id";
import { fileUrlFor, toUserSummary } from "../lib/user-shape";
import { validate } from "../lib/validator";
import { requireAuth } from "../middleware/auth";
import {
  attendanceGiveSchema,
  attendanceListQuery,
  eventsListQuery,
  performanceListQuery,
} from "../schemas/events";
import type { AppEnv } from "../types";

// Attendance opens 15 min before the start and closes 15 min after the end.
const ATTENDANCE_WINDOW_SECONDS = 15 * 60;

// Public event columns — explicitly EXCLUDES eventPassword so it never leaks.
const eventListColumns = {
  id: events.id,
  title: events.title,
  description: events.description,
  type: events.type,
  status: events.status,
  startingAt: events.startingAt,
  endingAt: events.endingAt,
  eventLink: events.eventLink,
  participationScope: events.participationScope,
  openForAttendance: events.openForAttendance,
  strictAttendance: events.strictAttendance,
  createdAt: events.createdAt,
  updatedAt: events.updatedAt,
};

const eventRoutes = new Hono<AppEnv>();

// List published events, filterable by type/scope and searchable on title/description/link.
eventRoutes.get("/", validate("query", eventsListQuery), async (c) => {
  const { page, perPage, type, scope, q } = c.req.valid("query");
  const db = getDb(c.env.DB);

  const filters: SQL[] = [eq(events.status, "published")];
  if (type) filters.push(eq(events.type, type));
  if (scope) filters.push(eq(events.participationScope, scope));
  if (q) {
    const term = `%${q}%`;
    const expr = or(
      like(events.title, term),
      like(events.description, term),
      like(events.eventLink, term),
    );
    if (expr) filters.push(expr);
  }
  const where = and(...filters);

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select(eventListColumns)
      .from(events)
      .where(where)
      .orderBy(desc(events.startingAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(events).where(where),
  ]);

  return c.json({ data: rows, meta: buildMeta(page, perPage, total) });
});

// Event details with its media. Published only; eventPassword excluded.
eventRoutes.get("/:id", async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "Event not found" });

  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const ev = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.status, "published")),
    columns: { eventPassword: false },
    with: {
      media: {
        columns: { id: true, type: true, key: true },
        orderBy: (m, { asc }) => [asc(m.position), asc(m.id)],
      },
    },
  });
  if (!ev) throw new HTTPException(404, { message: "Event not found" });

  const { media, ...rest } = ev;
  return c.json({
    ...rest,
    media: media.map((m) => ({ id: m.id, type: m.type, url: fileUrlFor(origin, m.key) })),
  });
});

// Mark attendance for the authenticated user. Gated by the event password and
// a fixed time window (15 min before start … 15 min after end).
eventRoutes.post(
  "/:id/attendance",
  requireAuth,
  validate("json", attendanceGiveSchema),
  async (c) => {
    const id = parseId(c.req.param("id"));
    if (id === null) throw new HTTPException(404, { message: "Event not found" });

    const { password } = c.req.valid("json");
    const payload = c.get("user");
    const db = getDb(c.env.DB);

    const [ev] = await db
      .select({
        id: events.id,
        status: events.status,
        startingAt: events.startingAt,
        endingAt: events.endingAt,
        openForAttendance: events.openForAttendance,
        eventPassword: events.eventPassword,
      })
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    if (!ev || ev.status !== "published") {
      throw new HTTPException(404, { message: "Event not found" });
    }
    if (!ev.openForAttendance) {
      throw new HTTPException(403, { message: "Attendance is not open for this event" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (
      now < ev.startingAt - ATTENDANCE_WINDOW_SECONDS ||
      now > ev.endingAt + ATTENDANCE_WINDOW_SECONDS
    ) {
      throw new HTTPException(403, {
        message:
          "Attendance window is closed (opens 15 min before start, closes 15 min after end)",
      });
    }

    if (!ev.eventPassword || password !== ev.eventPassword) {
      throw new HTTPException(401, { message: "Incorrect event password" });
    }

    const [existing] = await db
      .select({ id: eventAttendance.id })
      .from(eventAttendance)
      .where(and(eq(eventAttendance.eventId, id), eq(eventAttendance.userId, payload.sub)))
      .limit(1);
    if (existing) {
      throw new HTTPException(409, { message: "Attendance already recorded" });
    }

    // The unique(event_id, user_id) index backstops a concurrent double-submit
    // (UNIQUE → 409 via the global onError).
    const [row] = await db
      .insert(eventAttendance)
      .values({ eventId: id, userId: payload.sub })
      .returning({ attendedAt: eventAttendance.createdAt });

    return c.json({ ok: true, attendedAt: row.attendedAt }, 201);
  },
);

// Paginated list of who attended an event, newest first.
eventRoutes.get("/:id/attendance", validate("query", attendanceListQuery), async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "Event not found" });

  const { page, perPage } = c.req.valid("query");
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const [ev] = await db
    .select({ id: events.id, status: events.status })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);
  if (!ev || ev.status !== "published") {
    throw new HTTPException(404, { message: "Event not found" });
  }

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.eventAttendance.findMany({
      where: eq(eventAttendance.eventId, id),
      columns: { createdAt: true },
      with: {
        user: { columns: { id: true, name: true, username: true, imageKey: true } },
      },
      orderBy: desc(eventAttendance.createdAt),
      limit: perPage,
      offset: (page - 1) * perPage,
    }),
    db.select({ value: count() }).from(eventAttendance).where(eq(eventAttendance.eventId, id)),
  ]);

  return c.json({
    data: rows.map((r) => ({
      attendedAt: r.createdAt,
      user: r.user ? toUserSummary(r.user, origin) : null,
    })),
    meta: buildMeta(page, perPage, total),
  });
});

// Paginated performance leaderboard for an event. Sorted by rank ascending;
// rows without a rank (NULL) sort last.
eventRoutes.get("/:id/performance", validate("query", performanceListQuery), async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "Event not found" });

  const { page, perPage } = c.req.valid("query");
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const [ev] = await db
    .select({ id: events.id, status: events.status })
    .from(events)
    .where(eq(events.id, id))
    .limit(1);
  if (!ev || ev.status !== "published") {
    throw new HTTPException(404, { message: "Event not found" });
  }

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        rank: eventPerformance.rank,
        solveCount: eventPerformance.solveCount,
        upsolveCount: eventPerformance.upsolveCount,
        participation: eventPerformance.participation,
        userId: users.id,
        userName: users.name,
        userUsername: users.username,
        userImageKey: users.imageKey,
      })
      .from(eventPerformance)
      .innerJoin(users, eq(eventPerformance.userId, users.id))
      .where(eq(eventPerformance.eventId, id))
      // `rank is null` is 0 for ranked rows, 1 for unranked → unranked sort last.
      .orderBy(sql`${eventPerformance.rank} is null`, asc(eventPerformance.rank))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(eventPerformance).where(eq(eventPerformance.eventId, id)),
  ]);

  return c.json({
    data: rows.map((r) => ({
      rank: r.rank,
      solveCount: r.solveCount,
      upsolveCount: r.upsolveCount,
      participation: r.participation,
      user: toUserSummary(
        { id: r.userId, name: r.userName, username: r.userUsername, imageKey: r.userImageKey },
        origin,
      ),
    })),
    meta: buildMeta(page, perPage, total),
  });
});

export default eventRoutes;
