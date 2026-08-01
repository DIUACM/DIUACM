import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { openApiDoc } from "./openapi";
import admin from "./routes/admin";
import auth from "./routes/auth";
import blog from "./routes/blog";
import events from "./routes/events";
import files from "./routes/files";
import gallery from "./routes/gallery";
import programmers from "./routes/programmers";
import trackers from "./routes/trackers";
import { handleScheduled } from "./sync";
import type { AppEnv, Bindings } from "./types";

const app = new Hono<AppEnv>();

app.use("*", logger());

// The Cloudflare zone does not currently enforce Always Use HTTPS globally.
// Keep this scoped to the production API hostname so local HTTP development
// remains usable while public credentials and responses never travel in clear.
app.use("*", async (c, next) => {
  const url = new URL(c.req.url);
  if (url.hostname === "api.diuacm.com" && url.protocol === "http:") {
    url.protocol = "https:";
    return c.redirect(url.toString(), 308);
  }
  await next();
});

// Public R2-backed files are embedded by the separately hosted web app. This
// middleware must be registered before secureHeaders() so its response header
// is applied last and overrides the default CORP value of "same-origin".
app.use("/files/*", async (c, next) => {
  await next();
  c.header("Cross-Origin-Resource-Policy", "cross-origin");
});

app.use("*", secureHeaders());

// Browsers may only call the API from the origins listed in CORS_ORIGINS
// (comma-separated, set in wrangler.jsonc). Localhost is always allowed so
// the Vite dev server works without extra config. An empty/missing value
// allows every origin (useful before the web origin is known).
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use("*", (c, next) => {
  const configured = (c.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return cors({
    origin: (origin) => {
      if (configured.length === 0) return origin;
      if (LOCALHOST_ORIGIN.test(origin)) return origin;
      return configured.includes(origin) ? origin : null;
    },
    maxAge: 86400,
  })(c, next);
});

app.get("/", (c) =>
  c.json({ ok: true, service: "diuacm", docs: "/docs", openapi: "/openapi.json" }),
);

app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: Math.floor(Date.now() / 1000) }),
);

app.get("/openapi.json", (c) => c.json(openApiDoc));

// Scalar API reference, loaded from the CDN and pointed at our spec.
app.get("/docs", (c) =>
  c.html(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>diuacm API — Reference</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script id="api-reference" data-url="/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`),
);

app.route("/admin", admin);
app.route("/auth", auth);
app.route("/blog", blog);
app.route("/events", events);
app.route("/files", files);
app.route("/gallery", gallery);
app.route("/programmers", programmers);
app.route("/trackers", trackers);

// ---------------------------------------------------------------------------
// Error handling: HTTPException passthrough, then map common D1 constraint
// failures to clean client errors.
// ---------------------------------------------------------------------------

const walkErrorMessages = (err: unknown): string[] => {
  const out: string[] = [];
  let current: unknown = err;
  const seen = new Set<unknown>();
  while (current && !seen.has(current)) {
    seen.add(current);
    const msg = (current as { message?: unknown }).message;
    if (typeof msg === "string") out.push(msg);
    current = (current as { cause?: unknown }).cause;
  }
  return out;
};

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  const joined = walkErrorMessages(err).join(" | ");

  const unique = joined.match(/UNIQUE constraint failed: ([\w., ]+)/);
  if (unique) {
    const cols = unique[1]
      .split(",")
      .map((s) => s.trim().split(".").pop() ?? "")
      .filter(Boolean);
    const message =
      cols.length === 1 && cols[0] === "event_link"
        ? "Event link already exists"
        : cols.length === 1
        ? `${cols[0]} already exists`
        : `combination of ${cols.join(", ")} already exists`;
    return c.json({ error: message }, 409);
  }

  if (/FOREIGN KEY constraint failed/i.test(joined)) {
    return c.json({ error: "Referenced record does not exist" }, 400);
  }

  const notNull = joined.match(/NOT NULL constraint failed: \w+\.(\w+)/);
  if (notNull) {
    return c.json({ error: `${notNull[1]} is required` }, 400);
  }

  console.error("Unhandled error", err);
  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

export { app };

export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
} satisfies ExportedHandler<Bindings>;
