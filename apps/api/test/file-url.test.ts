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
});
