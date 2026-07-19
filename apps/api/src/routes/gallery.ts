import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../db/client";
import { galleryAlbums, galleryMedia } from "../db/schema";
import { buildMeta } from "../lib/pagination";
import { fileUrlFor } from "../lib/user-shape";
import { validate } from "../lib/validator";
import { galleryListQuery } from "../schemas/gallery";
import type { AppEnv } from "../types";

const galleryRoutes = new Hono<AppEnv>();

// List published albums in admin-defined display order, each with its cover
// image (first media item) and media count.
galleryRoutes.get("/", validate("query", galleryListQuery), async (c) => {
  const { page, perPage } = c.req.valid("query");
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const where = eq(galleryAlbums.status, "published");

  const [albums, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: galleryAlbums.id,
        title: galleryAlbums.title,
        description: galleryAlbums.description,
        slug: galleryAlbums.slug,
      })
      .from(galleryAlbums)
      .where(where)
      .orderBy(asc(galleryAlbums.order), desc(galleryAlbums.id))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(galleryAlbums).where(where),
  ]);

  // One media pass for the whole page: cover = first item in display order.
  const coverByAlbum = new Map<number, string>();
  const countByAlbum = new Map<number, number>();
  if (albums.length > 0) {
    const media = await db
      .select({ albumId: galleryMedia.albumId, key: galleryMedia.key })
      .from(galleryMedia)
      .where(
        inArray(
          galleryMedia.albumId,
          albums.map((a) => a.id),
        ),
      )
      .orderBy(asc(galleryMedia.order), asc(galleryMedia.id));
    for (const m of media) {
      if (!coverByAlbum.has(m.albumId)) coverByAlbum.set(m.albumId, m.key);
      countByAlbum.set(m.albumId, (countByAlbum.get(m.albumId) ?? 0) + 1);
    }
  }

  return c.json({
    data: albums.map((album) => ({
      ...album,
      coverUrl: fileUrlFor(origin, coverByAlbum.get(album.id) ?? null),
      mediaCount: countByAlbum.get(album.id) ?? 0,
    })),
    meta: buildMeta(page, perPage, total),
  });
});

// A published album by slug, with its images in display order.
galleryRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const [album] = await db
    .select({
      id: galleryAlbums.id,
      title: galleryAlbums.title,
      description: galleryAlbums.description,
      slug: galleryAlbums.slug,
    })
    .from(galleryAlbums)
    .where(and(eq(galleryAlbums.slug, slug), eq(galleryAlbums.status, "published")))
    .limit(1);
  if (!album) throw new HTTPException(404, { message: "Album not found" });

  const media = await db
    .select({ id: galleryMedia.id, key: galleryMedia.key })
    .from(galleryMedia)
    .where(eq(galleryMedia.albumId, album.id))
    .orderBy(asc(galleryMedia.order), asc(galleryMedia.id));

  return c.json({
    ...album,
    media: media.map((m) => ({ id: m.id, url: fileUrlFor(origin, m.key) })),
  });
});

export default galleryRoutes;
