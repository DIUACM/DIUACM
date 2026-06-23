import { and, count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../db/client";
import { trackers } from "../db/schema";
import { buildMeta } from "../lib/pagination";
import { validate } from "../lib/validator";
import { trackersListQuery } from "../schemas/trackers";
import type { AppEnv } from "../types";

const trackerListColumns = {
  title: trackers.title,
  description: trackers.description,
  slug: trackers.slug,
};

const trackerRoutes = new Hono<AppEnv>();

// List published trackers (title / description / slug only), newest first.
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
    columns: { title: true, description: true, slug: true },
    with: {
      ranklists: {
        where: (r, { eq: eqOp }) => eqOp(r.status, "published"),
        columns: { keyword: true, userCount: true, eventCount: true },
        orderBy: (r, { asc }) => [asc(r.keyword)],
      },
    },
  });

  if (!tracker) {
    throw new HTTPException(404, { message: "Tracker not found" });
  }

  return c.json(tracker);
});

export default trackerRoutes;
