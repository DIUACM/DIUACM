import { and, count, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../../db/client";
import { blogAssets, blogPosts, users } from "../../db/schema";
import { parseAssetUpload } from "../../lib/asset-upload";
import { parseImageUpload } from "../../lib/image-upload";
import { likeContains } from "../../lib/like";
import { buildMeta } from "../../lib/pagination";
import { parseId } from "../../lib/parse-id";
import { fileUrlFor, toUserSummary } from "../../lib/user-shape";
import { validate } from "../../lib/validator";
import { requirePermission } from "../../middleware/auth";
import {
  adminBlogListQuery,
  adminBlogPostCreateSchema,
  adminBlogPostUpdateSchema,
  adminBulkPublishSchema,
} from "../../schemas/admin";
import type { AppEnv } from "../../types";

const postColumns = {
  id: blogPosts.id,
  title: blogPosts.title,
  slug: blogPosts.slug,
  content: blogPosts.content,
  status: blogPosts.status,
  featuredImageKey: blogPosts.featuredImageKey,
  authorId: blogPosts.authorId,
  publishedAt: blogPosts.publishedAt,
  createdAt: blogPosts.createdAt,
  updatedAt: blogPosts.updatedAt,
};

const manageBlog = requirePermission("manage_blog");

const adminBlogRoutes = new Hono<AppEnv>();

const requirePostId = (c: { req: { param: (k: "id") => string } }): number => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "Post not found" });
  return id;
};

const loadPost = async (db: ReturnType<typeof getDb>, id: number) => {
  const [post] = await db.select(postColumns).from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  if (!post) throw new HTTPException(404, { message: "Post not found" });
  return post;
};

// The admin shape swaps the raw featuredImageKey for a servable URL.
const toAdminPost = <T extends { featuredImageKey: string | null }>(post: T, origin: string) => {
  const { featuredImageKey, ...rest } = post;
  return { ...rest, featuredImageUrl: fileUrlFor(origin, featuredImageKey) };
};

// All posts regardless of status, newest first.
adminBlogRoutes.get("/", manageBlog, validate("query", adminBlogListQuery), async (c) => {
  const { page, perPage, status, q } = c.req.valid("query");
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const filters: SQL[] = [];
  if (status) filters.push(eq(blogPosts.status, status));
  if (q) {
    const expr = or(likeContains(blogPosts.title, q), likeContains(blogPosts.slug, q));
    if (expr) filters.push(expr);
  }
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select(postColumns)
      .from(blogPosts)
      .where(where)
      .orderBy(desc(blogPosts.id))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(blogPosts).where(where),
  ]);

  return c.json({
    data: rows.map((row) => toAdminPost(row, origin)),
    meta: buildMeta(page, perPage, total),
  });
});

adminBlogRoutes.post("/", manageBlog, validate("json", adminBlogPostCreateSchema), async (c) => {
  const input = c.req.valid("json");
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  // Duplicate slug → UNIQUE failure → 409 via onError. The caller becomes the
  // author; publishing immediately stamps publishedAt.
  const [post] = await db
    .insert(blogPosts)
    .values({
      ...input,
      authorId: c.var.user.sub,
      publishedAt: input.status === "published" ? Math.floor(Date.now() / 1000) : null,
    })
    .returning(postColumns);
  return c.json(toAdminPost(post, origin), 201);
});

const assetShape = (
  row: { id: number; kind: "image" | "video" | "file"; key: string; filename: string; mime: string },
  origin: string,
) => ({
  id: row.id,
  kind: row.kind,
  filename: row.filename,
  mime: row.mime,
  url: fileUrlFor(origin, row.key),
});

adminBlogRoutes.get("/:id", manageBlog, async (c) => {
  const id = requirePostId(c);
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const post = await loadPost(db, id);

  let author = null;
  if (post.authorId !== null) {
    const [row] = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        imageKey: users.imageKey,
        isBanned: users.isBanned,
        banReason: users.banReason,
      })
      .from(users)
      .where(eq(users.id, post.authorId))
      .limit(1);
    if (row) author = toUserSummary(row, origin);
  }

  const assets = await db
    .select({
      id: blogAssets.id,
      kind: blogAssets.kind,
      key: blogAssets.key,
      filename: blogAssets.filename,
      mime: blogAssets.mime,
    })
    .from(blogAssets)
    .where(eq(blogAssets.postId, id))
    .orderBy(desc(blogAssets.id));

  return c.json({
    ...toAdminPost(post, origin),
    author,
    assets: assets.map((a) => assetShape(a, origin)),
  });
});

adminBlogRoutes.patch("/:id", manageBlog, validate("json", adminBlogPostUpdateSchema), async (c) => {
  const id = requirePostId(c);
  const input = c.req.valid("json");
  if (Object.keys(input).length === 0) {
    throw new HTTPException(400, { message: "No fields to update" });
  }

  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;
  const existing = await loadPost(db, id);

  // publishedAt is stamped on the first transition to published and then kept,
  // so re-publishing an unpublished post doesn't bump it in the public list.
  const publishedAt =
    input.status === "published" && existing.publishedAt === null
      ? Math.floor(Date.now() / 1000)
      : existing.publishedAt;

  const [updated] = await db
    .update(blogPosts)
    .set({ ...input, publishedAt, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(blogPosts.id, id))
    .returning(postColumns);
  return c.json(toAdminPost(updated, origin));
});

// Deleting a post cascades its asset rows (FK); the stored featured image and
// asset objects are removed best-effort.
adminBlogRoutes.delete("/:id", manageBlog, async (c) => {
  const id = requirePostId(c);
  const db = getDb(c.env.DB);
  const post = await loadPost(db, id);

  const assets = await db
    .select({ key: blogAssets.key })
    .from(blogAssets)
    .where(eq(blogAssets.postId, id));

  await db.delete(blogPosts).where(eq(blogPosts.id, id));

  const keys = [...assets.map((a) => a.key)];
  if (post.featuredImageKey) keys.push(post.featuredImageKey);
  for (const key of keys) {
    try {
      await c.env.BUCKET.delete(key);
    } catch (err) {
      console.error("R2 delete failed for blog object", key, err);
    }
  }

  return c.json({ ok: true });
});

// Publish, unpublish, or delete a batch of posts. Deletes cascade asset rows
// (FK); stored objects follow best-effort, same as DELETE /:id.
adminBlogRoutes.post("/bulk", manageBlog, validate("json", adminBulkPublishSchema), async (c) => {
  const { ids, action } = c.req.valid("json");
  const db = getDb(c.env.DB);

  if (action === "delete") {
    const [assets, posts] = await Promise.all([
      db.select({ key: blogAssets.key }).from(blogAssets).where(inArray(blogAssets.postId, ids)),
      db
        .select({ featuredImageKey: blogPosts.featuredImageKey })
        .from(blogPosts)
        .where(inArray(blogPosts.id, ids)),
    ]);

    const deleted = await db
      .delete(blogPosts)
      .where(inArray(blogPosts.id, ids))
      .returning({ id: blogPosts.id });

    const keys = [
      ...new Set([
        ...assets.map((asset) => asset.key),
        ...posts.flatMap((post) =>
          post.featuredImageKey ? [post.featuredImageKey] : [],
        ),
      ]),
    ];
    if (keys.length > 0) {
      try {
        await c.env.BUCKET.delete(keys);
      } catch (err) {
        console.error("R2 bulk delete failed for blog objects", keys, err);
      }
    }

    return c.json({ ok: true, affected: deleted.length });
  }

  // Same publishedAt rule as PATCH /:id — stamped on the first publish and
  // kept from then on, so COALESCE leaves an existing timestamp alone.
  const updated = await db
    .update(blogPosts)
    .set({
      status: action === "publish" ? "published" : "draft",
      ...(action === "publish"
        ? { publishedAt: sql`COALESCE(${blogPosts.publishedAt}, unixepoch())` }
        : {}),
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(inArray(blogPosts.id, ids))
    .returning({ id: blogPosts.id });
  return c.json({ ok: true, affected: updated.length });
});

// ---------------------------------------------------------------------------
// Assets — body media (images, videos, downloadable files). Uploaded via the
// "file" multipart field; the returned URL is embedded into the post body.
// ---------------------------------------------------------------------------

adminBlogRoutes.post("/:id/assets", manageBlog, async (c) => {
  const id = requirePostId(c);
  const db = getDb(c.env.DB);
  await loadPost(db, id);

  const { buffer, kind, contentType, ext, filename } = await parseAssetUpload(c);
  const key = `blog/${id}/assets/${crypto.randomUUID()}.${ext}`;
  await c.env.BUCKET.put(key, buffer, { httpMetadata: { contentType } });

  let row;
  try {
    [row] = await db
      .insert(blogAssets)
      .values({ postId: id, kind, key, filename, mime: contentType })
      .returning({
        id: blogAssets.id,
        kind: blogAssets.kind,
        key: blogAssets.key,
        filename: blogAssets.filename,
        mime: blogAssets.mime,
      });
  } catch (err) {
    // DB insert failed — don't leave an orphan object in R2.
    try {
      await c.env.BUCKET.delete(key);
    } catch (cleanupErr) {
      console.error("R2 cleanup failed for orphan blog asset", key, cleanupErr);
    }
    throw err;
  }

  const origin = new URL(c.req.url).origin;
  return c.json(assetShape(row, origin), 201);
});

adminBlogRoutes.delete("/:id/assets/:assetId", manageBlog, async (c) => {
  const id = requirePostId(c);
  const assetId = parseId(c.req.param("assetId"));
  if (assetId === null) throw new HTTPException(404, { message: "Asset not found" });

  const db = getDb(c.env.DB);
  const [deleted] = await db
    .delete(blogAssets)
    .where(and(eq(blogAssets.id, assetId), eq(blogAssets.postId, id)))
    .returning({ key: blogAssets.key });
  if (!deleted) throw new HTTPException(404, { message: "Asset not found" });

  try {
    await c.env.BUCKET.delete(deleted.key);
  } catch (err) {
    console.error("R2 delete failed for blog asset", deleted.key, err);
  }

  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Featured image — one per post (multipart field "image"); replaces any
// previous image.
// ---------------------------------------------------------------------------

adminBlogRoutes.post("/:id/featured-image", manageBlog, async (c) => {
  const id = requirePostId(c);
  const db = getDb(c.env.DB);
  const post = await loadPost(db, id);

  const { buffer, contentType, ext } = await parseImageUpload(c);
  const key = `blog/${id}/${crypto.randomUUID()}.${ext}`;
  await c.env.BUCKET.put(key, buffer, { httpMetadata: { contentType } });

  try {
    await db
      .update(blogPosts)
      .set({ featuredImageKey: key, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(blogPosts.id, id));
  } catch (err) {
    // DB update failed — don't leave an orphan object in R2.
    try {
      await c.env.BUCKET.delete(key);
    } catch (cleanupErr) {
      console.error("R2 cleanup failed for orphan featured image", key, cleanupErr);
    }
    throw err;
  }

  if (post.featuredImageKey) {
    try {
      await c.env.BUCKET.delete(post.featuredImageKey);
    } catch (err) {
      console.error("R2 delete failed for replaced featured image", post.featuredImageKey, err);
    }
  }

  const origin = new URL(c.req.url).origin;
  return c.json({ featuredImageUrl: fileUrlFor(origin, key) }, 201);
});

adminBlogRoutes.delete("/:id/featured-image", manageBlog, async (c) => {
  const id = requirePostId(c);
  const db = getDb(c.env.DB);
  const post = await loadPost(db, id);
  if (!post.featuredImageKey) {
    throw new HTTPException(404, { message: "Post has no featured image" });
  }

  await db
    .update(blogPosts)
    .set({ featuredImageKey: null, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(blogPosts.id, id));

  try {
    await c.env.BUCKET.delete(post.featuredImageKey);
  } catch (err) {
    console.error("R2 delete failed for blog featured image", post.featuredImageKey, err);
  }

  return c.json({ ok: true });
});

export default adminBlogRoutes;
