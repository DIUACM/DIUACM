import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { fileUrlFor } from "../src/lib/user-shape";

describe("public R2 URLs", () => {
  it("uses the R2 custom domain for production API responses", () => {
    expect(fileUrlFor("https://api.diuacm.com", "users/42/avatar.webp")).toBe(
      "https://r2.diuacm.com/users/42/avatar.webp",
    );
  });

  it("keeps the Worker-backed route for local and preview environments", () => {
    expect(fileUrlFor("http://localhost:8787", "users/42/avatar.webp")).toBe(
      "http://localhost:8787/files/users/42/avatar.webp",
    );
    expect(fileUrlFor("https://preview.example", null)).toBeNull();
  });

  // Only the https production origin is the production origin. `wrangler dev`
  // takes the request host from the first configured route, so without
  // `dev.host` the local origin is the http form of the production hostname —
  // which lands here, pointing local uploads at a bucket that has never seen
  // them.
  it("does not treat the plain-http production hostname as production", () => {
    expect(fileUrlFor("http://api.diuacm.com", "users/42/avatar.webp")).toBe(
      "http://api.diuacm.com/files/users/42/avatar.webp",
    );
  });
});

// The guard for the above: the local dev server must report its own origin.
// This is config, not code, so nothing else in the suite can catch it.
describe("wrangler dev host", () => {
  const config = JSON.parse(
    readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8")
      // Every comment in the file is a whole line; stripping only those leaves
      // the `//` inside URL string values alone.
      .replace(/^\s*\/\/.*$/gm, ""),
  ) as { dev?: { port?: number; host?: string } };

  it("pins the dev host to the dev port", () => {
    expect(config.dev?.port).toBeTypeOf("number");
    expect(config.dev?.host).toBe(`localhost:${config.dev?.port}`);
  });
});
