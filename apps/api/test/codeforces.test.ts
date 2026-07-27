import { describe, expect, it, vi } from "vitest";

import {
  getCodeforcesUser,
  getUserSubmissions,
  type CodeforcesSubmission,
} from "../src/lib/codeforces";

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

describe("getUserSubmissions", () => {
  const PAGE_SIZE = 1000;

  /** Newest-first, one second apart, exactly like the real endpoint. */
  const page = (newest: number, count: number): CodeforcesSubmission[] =>
    Array.from({ length: count }, (_, i) => ({
      contestId: 1900,
      creationTimeSeconds: newest - i,
      problem: { contestId: 1900, index: "A" },
      author: { participantType: "PRACTICE" },
      verdict: "OK",
    }));

  it("stops after one call when the history is shorter than a page", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ status: "OK", result: page(5000, 3) }));

    await expect(getUserSubmissions("alice", { since: 0, fetcher })).resolves.toHaveLength(3);
    expect(fetcher).toHaveBeenCalledOnce();
    const url = new URL(String(fetcher.mock.calls[0][0]));
    expect(url.searchParams.get("handle")).toBe("alice");
    expect(url.searchParams.get("from")).toBe("1");
  });

  it("keeps paging while a full page stays inside the cutoff", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ status: "OK", result: page(9_000, PAGE_SIZE) }))
      .mockResolvedValueOnce(Response.json({ status: "OK", result: page(8_000, PAGE_SIZE) }))
      .mockResolvedValueOnce(Response.json({ status: "OK", result: page(7_000, 10) }));

    const submissions = await getUserSubmissions("alice", { since: 0, fetcher });

    expect(submissions).toHaveLength(2 * PAGE_SIZE + 10);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(new URL(String(fetcher.mock.calls[1][0])).searchParams.get("from")).toBe("1001");
  });

  it("stops and drops everything older than the cutoff", async () => {
    // The page reaches back past `since`, so there is nothing older to fetch.
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ status: "OK", result: page(9_000, PAGE_SIZE) }));

    const submissions = await getUserSubmissions("alice", { since: 8_500, fetcher });

    expect(submissions).toHaveLength(501);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("distinguishes the call limit from a bad handle", async () => {
    const limited = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ status: "FAILED", comment: "Call limit exceeded" }, { status: 429 }),
      );
    await expect(getUserSubmissions("alice", { since: 0, fetcher: limited })).rejects.toMatchObject(
      { kind: "call-limit" },
    );

    const missing = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        { status: "FAILED", comment: "handle: User with handle ghost not found" },
        { status: 400 },
      ),
    );
    await expect(getUserSubmissions("ghost", { since: 0, fetcher: missing })).rejects.toMatchObject(
      { kind: "invalid-handle" },
    );
  });
});
