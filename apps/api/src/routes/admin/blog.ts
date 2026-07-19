import { and, count, desc, eq, or, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../../db/client";
import { blogPosts, users } from "../../db/schema";
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

adminBlogRoutes.get("/:id", manageBlog, async (c) => {
  const id = requirePostId(c);
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const post = await loadPost(db, id);

  let author = null;
  if (post.authorId !== null) {
    const [row] = await db
      .select({ id: users.id, name: users.name, username: users.username, imageKey: users.imageKey })
      .from(users)
      .where(eq(users.id, post.authorId))
      .limit(1);
    if (row) author = toUserSummary(row, origin);
  }

  return c.json({ ...toAdminPost(post, origin), author });
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

// The stored featured image is removed best-effort.
adminBlogRoutes.delete("/:id", manageBlog, async (c) => {
  const id = requirePostId(c);
  const db = getDb(c.env.DB);
  const post = await loadPost(db, id);

  await db.delete(blogPosts).where(eq(blogPosts.id, id));

  if (post.featuredImageKey) {
    try {
      await c.env.BUCKET.delete(post.featuredImageKey);
    } catch (err) {
      console.error("R2 delete failed for blog featured image", post.featuredImageKey, err);
    }
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
