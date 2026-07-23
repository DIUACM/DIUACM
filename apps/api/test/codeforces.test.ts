import { describe, expect, it, vi } from "vitest";

import { getCodeforcesUser } from "../src/lib/codeforces";

describe("getCodeforcesUser", () => {
  it("resolves a historic handle to the canonical handle and max rating", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        status: "OK",
        result: [{ handle: "tourist", maxRating: 4009 }],
      }),
    );

    await expect(getCodeforcesUser("Tourist", fetcher)).resolves.toEqual({
      handle: "tourist",
      maxRating: 4009,
    });
    expect(fetcher).toHaveBeenCalledOnce();
    const url = new URL(String(fetcher.mock.calls[0][0]));
    expect(url.searchParams.get("handles")).toBe("Tourist");
    expect(url.searchParams.get("checkHistoricHandles")).toBe("true");
  });

  it("returns null for an unrated user", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ status: "OK", result: [{ handle: "new_user" }] }),
    );

    await expect(getCodeforcesUser("new_user", fetcher)).resolves.toEqual({
      handle: "new_user",
      maxRating: null,
    });
  });

  it("rejects a handle Codeforces does not recognize", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        {
          status: "FAILED",
          comment: "handles: User with handle missing not found",
        },
        { status: 400 },
      ),
    );

    await expect(getCodeforcesUser("missing", fetcher)).rejects.toMatchObject({
      kind: "invalid-handle",
      message: "Invalid Codeforces handle.",
    });
  });

  it("does not mislabel other Codeforces failures as invalid handles", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        { status: "FAILED", comment: "Call limit exceeded" },
        { status: 429 },
      ),
    );

    await expect(getCodeforcesUser("tourist", fetcher)).rejects.toMatchObject({
      kind: "unavailable",
    });
  });

  it("reports upstream failures as unavailable", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("network"));

    await expect(getCodeforcesUser("tourist", fetcher)).rejects.toMatchObject({
      kind: "unavailable",
    });
  });
});
