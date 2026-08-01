import { describe, expect, it } from "vitest";

import { app } from "../src/index";

const WEB_ORIGIN = "https://diuacm.com";

const get = (origin: string, env: Record<string, string>) =>
  app.request("/health", { headers: { Origin: origin } }, env);

describe("CORS", () => {
  it("allows a configured origin", async () => {
    const res = await get(WEB_ORIGIN, { CORS_ORIGINS: WEB_ORIGIN });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(WEB_ORIGIN);
  });

  it("rejects an unconfigured origin", async () => {
    const res = await get("https://evil.example.com", { CORS_ORIGINS: WEB_ORIGIN });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("always allows localhost for development", async () => {
    const res = await get("http://localhost:5199", { CORS_ORIGINS: WEB_ORIGIN });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5199");
  });

  it("allows every origin when CORS_ORIGINS is unset", async () => {
    const res = await get("https://anything.example.com", {});
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://anything.example.com",
    );
  });

  it("sets security headers", async () => {
    const res = await app.request("/health", {}, { CORS_ORIGINS: WEB_ORIGIN });
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Cross-Origin-Resource-Policy")).toBe("same-origin");
  });

  it("allows public files to be embedded cross-origin", async () => {
    const res = await app.request(
      "/files/missing.jpg",
      {},
      {
        CORS_ORIGINS: WEB_ORIGIN,
        BUCKET: { get: async () => null },
      },
    );

    expect(res.status).toBe(404);
    expect(res.headers.get("Cross-Origin-Resource-Policy")).toBe("cross-origin");
  });
});
