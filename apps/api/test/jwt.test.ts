import { sign } from "hono/jwt";
import { describe, expect, it } from "vitest";

import { signAuthToken, verifyAuthToken } from "../src/lib/jwt";

const SECRET = "jwt-test-secret";

describe("auth token payload validation", () => {
  it("round-trips an application-issued token", async () => {
    const token = await signAuthToken({ id: 42, username: "tourist" }, SECRET);

    await expect(verifyAuthToken(token, SECRET)).resolves.toMatchObject({
      sub: 42,
      username: "tourist",
    });
  });

  it("rejects a correctly signed token with malformed claims", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await sign(
      { sub: "42", username: "tourist", iat: now, exp: now + 60 },
      SECRET,
      "HS256",
    );

    await expect(verifyAuthToken(token, SECRET)).rejects.toThrow(
      "Invalid auth token payload",
    );
  });
});
