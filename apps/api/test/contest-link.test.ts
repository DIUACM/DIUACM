import { detectContestLink } from "@diuacm/contest-link";
import { describe, expect, it } from "vitest";

describe("detectContestLink — Codeforces", () => {
  it("reads a plain contest link", () => {
    expect(detectContestLink("https://codeforces.com/contest/1900")).toEqual({
      platform: "codeforces",
      kind: "contest",
      contestId: "1900",
    });
  });

  it("accepts the short domain, www, subdomains and a missing scheme", () => {
    for (const link of [
      "https://www.codeforces.com/contest/1900",
      "https://m1.codeforces.com/contest/1900",
      "https://codeforc.es/contest/1900",
      "codeforces.com/contest/1900/standings",
    ]) {
      expect(detectContestLink(link)).toMatchObject({ kind: "contest", contestId: "1900" });
    }
  });

  it("keeps gyms distinct — they are not public to the API", () => {
    expect(detectContestLink("https://codeforces.com/gym/104000")).toEqual({
      platform: "codeforces",
      kind: "gym",
      contestId: "104000",
    });
  });

  it("marks group contests as group, not contest", () => {
    // The /contest/<id> shape is identical, but the standings are private.
    expect(detectContestLink("https://codeforces.com/group/MEqF8b6wBT/contest/537484")).toEqual({
      platform: "codeforces",
      kind: "group",
      contestId: "537484",
      groupCode: "MEqF8b6wBT",
    });
  });

  it("ignores non-contest pages on a known judge", () => {
    expect(detectContestLink("https://codeforces.com/profile/tourist")).toBeNull();
    expect(detectContestLink("https://codeforces.com/problemset")).toBeNull();
  });
});

describe("detectContestLink — other judges", () => {
  it("reads VJudge and AtCoder links", () => {
    expect(detectContestLink("https://vjudge.net/contest/700000")).toEqual({
      platform: "vjudge",
      kind: "contest",
      contestId: "700000",
    });
    expect(detectContestLink("https://atcoder.jp/contests/abc300")).toEqual({
      platform: "atcoder",
      kind: "contest",
      contestId: "abc300",
    });
  });

  it("returns null for unknown hosts and garbage", () => {
    expect(detectContestLink("https://example.com/contest/1")).toBeNull();
    expect(detectContestLink("")).toBeNull();
    expect(detectContestLink("   ")).toBeNull();
    expect(detectContestLink("not a url at all")).toBeNull();
  });
});
