import { Hono } from "hono";

import type { AppEnv } from "../types";

const files = new Hono<AppEnv>();

// Stream a stored object (e.g. a profile image) from R2. Keys are unique per
// upload, so the response is immutable and aggressively cacheable at the edge.
files.get("/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.BUCKET.get(key);
  if (!object) {
    return c.json({ error: "Not found" }, 404);
  }

  c.header("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");
  c.header("Cache-Control", "public, max-age=31536000, immutable");
  c.header("ETag", object.httpEtag);
  return c.body(object.body);
});

export default files;
