import { describe, expect, it } from "vitest";

import {
  hashPassword,
  needsPasswordRehash,
  verifyPassword,
} from "../src/lib/password";

describe("password hashing", () => {
  it("creates and verifies hashes with the current work factor", async () => {
    const hash = await hashPassword("  spaces are part of this password  ");

    expect(hash).toMatch(/^pbkdf2:600000:/);
    expect(await verifyPassword("  spaces are part of this password  ", hash)).toBe(true);
    expect(await verifyPassword("spaces are part of this password", hash)).toBe(false);
    expect(needsPasswordRehash(hash)).toBe(false);
  });

  it("recognizes valid legacy work factors without rejecting their format", () => {
    const legacy =
      "pbkdf2:100000:0ff513e3ffa428aa68c413ef893e989f:92ceb9e253443292d9022b2e012fc4a2f0b8b8a3092667a7ca809fdf1fa33348";

    expect(needsPasswordRehash(legacy)).toBe(true);
    expect(needsPasswordRehash("not-a-password-hash")).toBe(false);
  });
});
