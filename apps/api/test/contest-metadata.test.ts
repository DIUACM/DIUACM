import { describe, expect, it, vi } from "vitest";

import { ContestMetadataError, getContestMetadata } from "../src/lib/contest-metadata";

describe("getContestMetadata", () => {
  it("resolves a public Codeforces contest", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        status: "OK",
        result: [
          {
            id: 2148,
            name: "Codeforces Round 1050",
            description: "A rated round.",
            startTimeSeconds: 1_750_000_000,
            durationSeconds: 7_200,
          },
        ],
      }),
    );

    await expect(
      getContestMetadata("https://codeforces.com/contest/2148", fetcher),
    ).resolves.toEqual({
      platform: "codeforces",
      title: "Codeforces Round 1050",
      description: "A rated round.",
      startingAt: 1_750_000_000,
      endingAt: 1_750_007_200,
    });

    const url = new URL(String(fetcher.mock.calls[0][0]));
    expect(url.pathname).toBe("/api/contest.list");
    expect(url.searchParams.get("gym")).toBe("false");
  });

  it("uses the gym listing for a Codeforces gym link", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        status: "OK",
        result: [
          {
            id: 104000,
            name: "Training Contest",
            startTimeSeconds: 1_700_000_000,
            durationSeconds: 18_000,
          },
        ],
      }),
    );

    await getContestMetadata("https://codeforces.com/gym/104000", fetcher);

    const url = new URL(String(fetcher.mock.calls[0][0]));
    expect(url.searchParams.get("gym")).toBe("true");
  });

  it("resolves an AtCoder contest", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json([
        {
          id: "abc300",
          title: "AtCoder Beginner Contest 300",
          start_epoch_second: 1_680_350_400,
          duration_second: 6_000,
        },
      ]),
    );

    await expect(
      getContestMetadata("https://atcoder.jp/contests/abc300", fetcher),
    ).resolves.toEqual({
      platform: "atcoder",
      title: "AtCoder Beginner Contest 300",
      description: "",
      startingAt: 1_680_350_400,
      endingAt: 1_680_356_400,
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("falls back to the official page for an upcoming AtCoder contest", async () => {
    const html = `<!doctype html>
      <html>
        <head>
          <title>JPRS Programming Contest 2026#2 (AtCoder Beginner Contest 470) - AtCoder</title>
          <script>
            var startTime = moment("2026-08-08T21:00:00+09:00");
            var endTime = moment("2026-08-08T22:40:00+09:00");
          </script>
        </head>
      </html>`;
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(new Response(html, { headers: { "Content-Type": "text/html" } }));

    await expect(
      getContestMetadata("https://atcoder.jp/contests/abc470", fetcher),
    ).resolves.toEqual({
      platform: "atcoder",
      title: "JPRS Programming Contest 2026#2 (AtCoder Beginner Contest 470)",
      description: "",
      startingAt: Math.floor(Date.parse("2026-08-08T21:00:00+09:00") / 1000),
      endingAt: Math.floor(Date.parse("2026-08-08T22:40:00+09:00") / 1000),
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    const pageUrl = new URL(String(fetcher.mock.calls[1][0]));
    expect(pageUrl.origin).toBe("https://atcoder.jp");
    expect(pageUrl.pathname).toBe("/contests/abc470");
    expect(pageUrl.searchParams.get("lang")).toBe("en");
  });

  it("rejects an AtCoder page without valid contest timing", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(new Response("<title>Contest - AtCoder</title>"));

    await expect(
      getContestMetadata("https://atcoder.jp/contests/abc999", fetcher),
    ).rejects.toMatchObject({ kind: "unavailable" } satisfies Partial<ContestMetadataError>);
  });

  it("resolves a VJudge contest", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        title: "DIU Team Forming Contest 13",
        begin: 1_748_340_000_000,
        length: 14_400_000,
        participants: {},
        submissions: [],
      }),
    );

    await expect(
      getContestMetadata("https://vjudge.net/contest/719705", fetcher),
    ).resolves.toEqual({
      platform: "vjudge",
      title: "DIU Team Forming Contest 13",
      description: "",
      startingAt: 1_748_340_000,
      endingAt: 1_748_354_400,
    });
  });

  it("rejects non-contest URLs before making a request", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(getContestMetadata("https://example.com/contest/1", fetcher)).rejects.toMatchObject(
      { kind: "invalid-link" } satisfies Partial<ContestMetadataError>,
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("explains why private Codeforces group contests cannot be fetched", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      getContestMetadata(
        "https://codeforces.com/group/MEqF8b6wBT/contest/537484",
        fetcher,
      ),
    ).rejects.toMatchObject({ kind: "unsupported" } satisfies Partial<ContestMetadataError>);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
