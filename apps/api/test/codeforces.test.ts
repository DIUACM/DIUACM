import { describe, expect, it, vi } from "vitest";

import {
  formatCodeforcesError,
  getCodeforcesUser,
  getCodeforcesUsers,
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
        { status: "FAILED", comment: "Codeforces is temporarily unavailable" },
        { status: 503 },
      ),
    );

    await expect(getCodeforcesUser("tourist", fetcher)).rejects.toMatchObject({
      kind: "unavailable",
    });
  });

  it("separates the call limit from a plain outage", async () => {
    // The route maps both to 502, but a caller working through a queue has to
    // stop on this one rather than retry — see src/sync/cf-rating.ts.
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        { status: "FAILED", comment: "Call limit exceeded" },
        { status: 429 },
      ),
    );

    await expect(getCodeforcesUser("tourist", fetcher)).rejects.toMatchObject({
      kind: "call-limit",
    });
  });

  it("retains bounded HTTP and Codeforces diagnostics for operations", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        { status: "FAILED", comment: "Call limit exceeded" },
        { status: 429, headers: { "cf-ray": "abc123-SIN" } },
      ),
    );

    const error = await getCodeforcesUser("tourist", fetcher).catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(Error);
    expect(formatCodeforcesError(error)).toContain('endpoint="user.info"');
    expect(formatCodeforcesError(error)).toContain('httpStatus="429"');
    expect(formatCodeforcesError(error)).toContain('cfRay="abc123-SIN"');
    expect(formatCodeforcesError(error)).toContain('comment="Call limit exceeded"');
  });

  it("retains a short body preview when Codeforces returns non-JSON", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("<html>upstream challenge</html>", { status: 502 }));

    const error = await getCodeforcesUser("tourist", fetcher).catch((cause: unknown) => cause);

    expect(formatCodeforcesError(error)).toContain('httpStatus="502"');
    expect(formatCodeforcesError(error)).toContain("upstream challenge");
  });

  it("reports upstream failures as unavailable", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("network"));

    await expect(getCodeforcesUser("tourist", fetcher)).rejects.toMatchObject({
      kind: "unavailable",
    });
  });
});

describe("getCodeforcesUsers", () => {
  it("asks for the whole batch in one call and answers in request order", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        status: "OK",
        result: [
          { handle: "tourist", maxRating: 4009 },
          { handle: "Petr", maxRating: 3597 },
          { handle: "new_user" },
        ],
      }),
    );

    await expect(getCodeforcesUsers(["tourist", "Petr", "new_user"], fetcher)).resolves.toEqual([
      { handle: "tourist", maxRating: 4009 },
      { handle: "Petr", maxRating: 3597 },
      { handle: "new_user", maxRating: null },
    ]);
    expect(fetcher).toHaveBeenCalledOnce();
    const url = new URL(String(fetcher.mock.calls[0][0]));
    expect(url.searchParams.get("handles")).toBe("tourist;Petr;new_user");
  });

  it("makes no call for an empty batch", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(getCodeforcesUsers([], fetcher)).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fails the whole batch when one handle is unknown", async () => {
    // Codeforces' own behaviour: no partial result, so the caller cannot tell
    // which handle was to blame without splitting the batch.
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        { status: "FAILED", comment: "handles: User with handle missing not found", result: null },
        { status: 400 },
      ),
    );

    await expect(getCodeforcesUsers(["tourist", "missing"], fetcher)).rejects.toMatchObject({
      kind: "invalid-handle",
    });
  });

  it("treats a short response as unavailable, never as a bad handle", async () => {
    // A result that cannot be mapped back to the request is a broken response.
    // Calling it `invalid-handle` would send the caller bisecting a healthy batch.
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ status: "OK", result: [{ handle: "tourist", maxRating: 4009 }] }),
    );

    await expect(getCodeforcesUsers(["tourist", "Petr"], fetcher)).rejects.toMatchObject({
      kind: "unavailable",
    });
  });

  it("rejects a malformed entry anywhere in the batch", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        status: "OK",
        result: [{ handle: "tourist", maxRating: 4009 }, { handle: 42 }],
      }),
    );

    await expect(getCodeforcesUsers(["tourist", "Petr"], fetcher)).rejects.toMatchObject({
      kind: "unavailable",
    });
  });
});

describe("getUserSubmissions", () => {
  const PAGE_SIZE = 1000;
  /** Mirrors the runaway guard in src/lib/codeforces.ts. */
  const MAX_PAGES = 15;

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

    await expect(getUserSubmissions("alice", { since: 0, fetcher })).resolves.toMatchObject({
      submissions: expect.objectContaining({ length: 3 }),
      truncated: false,
    });
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

    const { submissions, truncated } = await getUserSubmissions("alice", { since: 0, fetcher });

    expect(submissions).toHaveLength(2 * PAGE_SIZE + 10);
    expect(truncated).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(new URL(String(fetcher.mock.calls[1][0])).searchParams.get("from")).toBe("1001");
  });

  it("stops and drops everything older than the cutoff", async () => {
    // The page reaches back past `since`, so there is nothing older to fetch.
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ status: "OK", result: page(9_000, PAGE_SIZE) }));

    const { submissions, truncated } = await getUserSubmissions("alice", { since: 8_500, fetcher });

    expect(submissions).toHaveLength(501);
    expect(truncated).toBe(false);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("reports truncation when the paging cap runs out mid-history", async () => {
    // Every page is full and every entry is inside the cutoff, so paging can
    // only end by exhausting MAX_PAGES — and the oldest submissions are lost.
    // A fresh Response per call: a body can only be read once, and this is the
    // only case that reads more than one page of the same fixture.
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () =>
        Response.json({ status: "OK", result: page(9_000, PAGE_SIZE) }),
      );

    const { truncated } = await getUserSubmissions("alice", { since: 0, fetcher });

    expect(truncated).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(MAX_PAGES);
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
