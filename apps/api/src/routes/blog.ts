import { and, count, desc, eq, or } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../db/client";
import { blogPosts, users } from "../db/schema";
import { likeContains } from "../lib/like";
import { buildMeta } from "../lib/pagination";
import { fileUrlFor, toUserSummary } from "../lib/user-shape";
import { validate } from "../lib/validator";
import { blogListQuery } from "../schemas/blog";
import type { AppEnv } from "../types";

/** Short plain-text preview of a post body for list cards. */
export const excerptOf = (content: string, max = 240): string => {
  const plain = content
    // Markdown-ish noise that reads badly in a snippet. LaTeX and raw HTML go
    // first, while their delimiters are still intact.
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$\n]+\$/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~[\]()!|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}…` : plain;
};

const blogRoutes = new Hono<AppEnv>();

// List published posts, newest first, with author and a plain-text excerpt
// (never the full body).
blogRoutes.get("/", validate("query", blogListQuery), async (c) => {
  const { page, perPage, q } = c.req.valid("query");
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const filters = [eq(blogPosts.status, "published")];
  if (q) {
    const expr = or(likeContains(blogPosts.title, q), likeContains(blogPosts.content, q));
    if (expr) filters.push(expr);
  }
  const where = and(...filters);

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        content: blogPosts.content,
        featuredImageKey: blogPosts.featuredImageKey,
        publishedAt: blogPosts.publishedAt,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          imageKey: users.imageKey,
          isBanned: users.isBanned,
          banReason: users.banReason,
        },
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(where)
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.id))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ value: count() }).from(blogPosts).where(where),
  ]);

  return c.json({
    data: rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: excerptOf(row.content),
      featuredImageUrl: fileUrlFor(origin, row.featuredImageKey),
      publishedAt: row.publishedAt,
      author: row.author ? toUserSummary(row.author, origin) : null,
    })),
    meta: buildMeta(page, perPage, total),
  });
});

// A published post by slug, with the full body.
blogRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = getDb(c.env.DB);
  const origin = new URL(c.req.url).origin;

  const [row] = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      content: blogPosts.content,
      featuredImageKey: blogPosts.featuredImageKey,
      publishedAt: blogPosts.publishedAt,
      author: {
        id: users.id,
        name: users.name,
        username: users.username,
        imageKey: users.imageKey,
        isBanned: users.isBanned,
        banReason: users.banReason,
      },
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1);
  if (!row) throw new HTTPException(404, { message: "Post not found" });

  return c.json({
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    featuredImageUrl: fileUrlFor(origin, row.featuredImageKey),
    publishedAt: row.publishedAt,
    author: row.author ? toUserSummary(row.author, origin) : null,
  });
});

export default blogRoutes;
