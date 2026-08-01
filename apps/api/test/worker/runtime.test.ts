import { env, exports } from "cloudflare:workers";
import { applyD1Migrations } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";

import "../../src";

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe("Worker runtime integration", () => {
  it("serves the production entrypoint with Workers security headers", async () => {
    const response = await exports.default.fetch("https://api.example.test/health");

    expect(response.status).toBe(200);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(response.json()).resolves.toMatchObject({ status: "ok" });
  });

  it("queries the real D1 binding through an HTTP route", async () => {
    const response = await exports.default.fetch("https://api.example.test/events");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: [],
      meta: { page: 1, total: 0 },
    });
  });

  it("streams an object from the real R2 binding", async () => {
    await env.BUCKET.put("worker-tests/hello.txt", "hello from R2", {
      httpMetadata: { contentType: "text/plain; charset=utf-8" },
    });

    const response = await exports.default.fetch(
      "https://api.example.test/files/worker-tests/hello.txt",
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("cross-origin-resource-policy")).toBe("cross-origin");
    await expect(response.text()).resolves.toBe("hello from R2");
  });

  it("uses the configured CORS policy inside workerd", async () => {
    const response = await exports.default.fetch("https://api.example.test/events", {
      headers: { Origin: env.CORS_ORIGINS },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe(env.CORS_ORIGINS);
  });
});
