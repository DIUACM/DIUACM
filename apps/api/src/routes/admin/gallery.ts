import { and, asc, count, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../../db/client";
import { galleryAlbums, galleryMedia } from "../../db/schema";
import { parseImageUpload } from "../../lib/image-upload";
import { likeContains } from "../../lib/like";
import { logError } from "../../lib/log";
import { buildMeta } from "../../lib/pagination";
import { parseId } from "../../lib/parse-id";
import { fileUrlFor } from "../../lib/user-shape";
import { validate } from "../../lib/validator";
import { requirePermission } from "../../middleware/auth";
import {
  adminBulkIdsSchema,
  adminBulkPublishSchema,
  adminGalleryAlbumCreateSchema,
  adminGalleryAlbumUpdateSchema,
  adminGalleryListQuery,
  adminReorderSchema,
} from "../../schemas/admin";
import type { AppEnv } from "../../types";

const albumColumns = {
  id: galleryAlbums.id,
  title: galleryAlbums.title,
  description: galleryAlbums.description,
  slug: galleryAlbums.slug,
  status: galleryAlbums.status,
  order: galleryAlbums.order,
  createdAt: galleryAlbums.createdAt,
  updatedAt: galleryAlbums.updatedAt,
};

const manageGallery = requirePermission("manage_gallery");

const adminGalleryRoutes = new Hono<AppEnv>();

const requireAlbumId = (c: { req: { param: (k: "id") => string } }): number => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "Album not found" });
  return id;
};

const loadAlbum = async (db: ReturnType<typeof getDb>, id: number) => {
  const [album] = await db
    .select(albumColumns)
    .from(galleryAlbums)
    .where(eq(galleryAlbums.id, id))
    .limit(1);
  if (!album) throw new HTTPException(404, { message: "Album not found" });
  return album;
};

// All albums regardless of status, in display order, with media counts.
adminGalleryRoutes.get("/", manageGallery, validate("query", adminGalleryListQuery), async (c) => {
  const { page, perPage, status, q } = c.req.valid("query");
  const db = getDb(c.env.DB);

  const filters: SQL[] = [];
  if (status) filters.push(eq(galleryAlbums.status, status));
  if (q) {
    const expr = or(likeContains(galleryAlbums.title, q), likeContains(galleryAlbums.slug, q));
    if (expr) filters.push(expr);
  }
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select(albumColumns)
      .from(galleryAlbums)
      .where(where)
      .orderBy(asc(galleryAlbums.order), desc(galleryAlbums.id))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(galleryAlbums).where(where),
  ]);

  const countByAlbum = new Map<number, number>();
  if (rows.length > 0) {
    const counts = await db
      .select({ albumId: galleryMedia.albumId, value: count() })
      .from(galleryMedia)
      .where(
        inArray(
          galleryMedia.albumId,
          rows.map((r) => r.id),
        ),
      )
      .groupBy(galleryMedia.albumId);
    for (const row of counts) countByAlbum.set(row.albumId, row.value);
  }

  return c.json({
    data: rows.map((row) => ({ ...row, mediaCount: countByAlbum.get(row.id) ?? 0 })),
    meta: buildMeta(page, perPage, total),
  });
});

adminGalleryRoutes.post("/", manageGallery, validate("json", adminGalleryAlbumCreateSchema), async (c) => {
  const input = c.req.valid("json");
  const db = getDb(c.env.DB);

  // Duplicate slug → UNIQUE failure → 409 via onError. New albums go to the
  // end of the display order.
  const [album] = await db
    .insert(galleryAlbums)
    .values({
      ...input,
      order: sql`(SELECT COALESCE(MAX("order"), -1) + 1 FROM gallery_albums)`,
    })
    .returning(albumColumns);
  return c.json(album, 201);
});

adminGalleryRoutes.get("/:id", manageGallery, async (c) => {
  const id = requireAlbumId(c);
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const album = await loadAlbum(db, id);
  const media = await db
    .select({ id: galleryMedia.id, key: galleryMedia.key, order: galleryMedia.order })
    .from(galleryMedia)
    .where(eq(galleryMedia.albumId, id))
    .orderBy(asc(galleryMedia.order), asc(galleryMedia.id));

  return c.json({
    ...album,
    media: media.map((m) => ({ id: m.id, order: m.order, url: fileUrlFor(origin, m.key) })),
  });
});

adminGalleryRoutes.patch("/:id", manageGallery, validate("json", adminGalleryAlbumUpdateSchema), async (c) => {
  const id = requireAlbumId(c);
  const input = c.req.valid("json");
  if (Object.keys(input).length === 0) {
    throw new HTTPException(400, { message: "No fields to update" });
  }

  const db = getDb(c.env.DB);
  const [updated] = await db
    .update(galleryAlbums)
    .set({ ...input, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(galleryAlbums.id, id))
    .returning(albumColumns);
  if (!updated) throw new HTTPException(404, { message: "Album not found" });

  return c.json(updated);
});

// Deleting an album cascades its media rows (FK); stored objects are removed
// best-effort.
adminGalleryRoutes.delete("/:id", manageGallery, async (c) => {
  const id = requireAlbumId(c);
  const db = getDb(c.env.DB);
  await loadAlbum(db, id);

  const media = await db
    .select({ key: galleryMedia.key })
    .from(galleryMedia)
    .where(eq(galleryMedia.albumId, id));

  await db.delete(galleryAlbums).where(eq(galleryAlbums.id, id));

  for (const m of media) {
    try {
      await c.env.BUCKET.delete(m.key);
    } catch (err) {
      logError("r2.gallery_media_delete_failed", err, { objectKey: m.key });
    }
  }

  return c.json({ ok: true });
});

// Set display order for a batch of albums (atomic via D1 batch).
adminGalleryRoutes.post("/reorder", manageGallery, validate("json", adminReorderSchema), async (c) => {
  const { items } = c.req.valid("json");
  const db = getDb(c.env.DB);
  const now = Math.floor(Date.now() / 1000);

  const statements = items.map((item) =>
    db
      .update(galleryAlbums)
      .set({ order: item.order, updatedAt: now })
      .where(eq(galleryAlbums.id, item.id)),
  );
  await db.batch([statements[0], ...statements.slice(1)]);

  return c.json({ ok: true });
});

// Publish, unpublish, or delete a batch of albums. Deletes cascade their media
// rows (FK); stored objects follow best-effort, same as DELETE /:id.
adminGalleryRoutes.post("/bulk", manageGallery, validate("json", adminBulkPublishSchema), async (c) => {
  const { ids, action } = c.req.valid("json");
  const db = getDb(c.env.DB);

  if (action === "delete") {
    const media = await db
      .select({ key: galleryMedia.key })
      .from(galleryMedia)
      .where(inArray(galleryMedia.albumId, ids));

    const deleted = await db
      .delete(galleryAlbums)
      .where(inArray(galleryAlbums.id, ids))
      .returning({ id: galleryAlbums.id });

    const keys = media.map((item) => item.key);
    if (keys.length > 0) {
      try {
        await c.env.BUCKET.delete(keys);
      } catch (err) {
        logError("r2.gallery_media_bulk_delete_failed", err, {
          objectKeys: keys,
        });
      }
    }

    return c.json({ ok: true, affected: deleted.length });
  }

  const updated = await db
    .update(galleryAlbums)
    .set({
      status: action === "publish" ? "published" : "draft",
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(inArray(galleryAlbums.id, ids))
    .returning({ id: galleryAlbums.id });
  return c.json({ ok: true, affected: updated.length });
});

// ---------------------------------------------------------------------------
// Media — image uploads only (multipart field "image"); appended last.
// ---------------------------------------------------------------------------

adminGalleryRoutes.post("/:id/media", manageGallery, async (c) => {
  const id = requireAlbumId(c);
  const db = getDb(c.env.DB);
  await loadAlbum(db, id);

  const { buffer, contentType, ext } = await parseImageUpload(c);
  const key = `gallery/${id}/${crypto.randomUUID()}.${ext}`;
  await c.env.BUCKET.put(key, buffer, { httpMetadata: { contentType } });

  let row;
  try {
    // MAX + 1, not COUNT: after deletions COUNT can collide with an existing
    // order value, filing the new photo before the last one.
    [row] = await db
      .insert(galleryMedia)
      .values({
        albumId: id,
        key,
        order: sql`(SELECT COALESCE(MAX("order"), -1) + 1 FROM gallery_media WHERE album_id = ${id})`,
      })
      .returning({ id: galleryMedia.id, order: galleryMedia.order });
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
  return c.json({ id: row.id, order: row.order, url: fileUrlFor(origin, key) }, 201);
});

adminGalleryRoutes.delete("/:id/media/:mediaId", manageGallery, async (c) => {
  const id = requireAlbumId(c);
  const mediaId = parseId(c.req.param("mediaId"));
  if (mediaId === null) throw new HTTPException(404, { message: "Media not found" });

  const db = getDb(c.env.DB);
  const [deleted] = await db
    .delete(galleryMedia)
    .where(and(eq(galleryMedia.id, mediaId), eq(galleryMedia.albumId, id)))
    .returning({ key: galleryMedia.key });
  if (!deleted) throw new HTTPException(404, { message: "Media not found" });

  try {
    await c.env.BUCKET.delete(deleted.key);
  } catch (err) {
    logError("r2.gallery_media_delete_failed", err, {
      objectKey: deleted.key,
    });
  }

  return c.json({ ok: true });
});

// Remove a batch of photos from one album; stored objects follow best-effort.
adminGalleryRoutes.post(
  "/:id/media/bulk-remove",
  manageGallery,
  validate("json", adminBulkIdsSchema),
  async (c) => {
    const id = requireAlbumId(c);
    const { ids } = c.req.valid("json");
    const db = getDb(c.env.DB);
    await loadAlbum(db, id);

    const removed = await db
      .delete(galleryMedia)
      .where(and(eq(galleryMedia.albumId, id), inArray(galleryMedia.id, ids)))
      .returning({ key: galleryMedia.key });

    const keys = removed.map((item) => item.key);
    if (keys.length > 0) {
      try {
        await c.env.BUCKET.delete(keys);
      } catch (err) {
        logError("r2.gallery_media_bulk_delete_failed", err, {
          objectKeys: keys,
        });
      }
    }

    return c.json({ ok: true, affected: removed.length });
  },
);

// Set display order for a batch of images within one album.
adminGalleryRoutes.post(
  "/:id/media/reorder",
  manageGallery,
  validate("json", adminReorderSchema),
  async (c) => {
    const id = requireAlbumId(c);
    const { items } = c.req.valid("json");
    const db = getDb(c.env.DB);
    await loadAlbum(db, id);

    const statements = items.map((item) =>
      db
        .update(galleryMedia)
        .set({ order: item.order })
        .where(and(eq(galleryMedia.id, item.id), eq(galleryMedia.albumId, id))),
    );
    await db.batch([statements[0], ...statements.slice(1)]);

    return c.json({ ok: true });
  },
);

export default adminGalleryRoutes;
