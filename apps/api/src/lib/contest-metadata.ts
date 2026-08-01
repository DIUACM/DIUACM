import { detectContestLink, type ContestPlatform } from "@diuacm/contest-link";

import { AtcoderApiError, getContests } from "./atcoder";
import { getContestRank, VjudgeApiError } from "./vjudge";

const CODEFORCES_CONTESTS_URL = "https://codeforces.com/api/contest.list";
const ATCODER_ORIGIN = "https://atcoder.jp";
const USER_AGENT = "diuacm-sync (+https://diuacm.com)";
const MAX_ATCODER_PAGE_BYTES = 2_000_000;

export type ContestMetadata = {
  platform: ContestPlatform;
  title: string;
  description: string;
  startingAt: number;
  endingAt: number;
};

export class ContestMetadataError extends Error {
  constructor(
    message: string,
    readonly kind: "invalid-link" | "unsupported" | "not-found" | "rate-limited" | "unavailable",
  ) {
    super(message);
    this.name = "ContestMetadataError";
  }
}

type CodeforcesContest = {
  id: number;
  name: string;
  description?: string;
  startTimeSeconds?: number;
  durationSeconds: number;
};

type CodeforcesContestListResponse =
  | { status: "OK"; result: CodeforcesContest[] }
  | { status: "FAILED"; comment?: string };

const isCodeforcesContest = (value: unknown): value is CodeforcesContest => {
  const contest = value as Partial<CodeforcesContest> | null;
  return (
    contest !== null &&
    typeof contest === "object" &&
    typeof contest.id === "number" &&
    typeof contest.name === "string" &&
    typeof contest.durationSeconds === "number"
  );
};

const resolveCodeforces = async (
  contestId: string,
  gym: boolean,
  fetcher: typeof fetch,
): Promise<ContestMetadata> => {
  const url = new URL(CODEFORCES_CONTESTS_URL);
  url.searchParams.set("gym", String(gym));

  let response: Response;
  try {
    response = await fetcher(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new ContestMetadataError("Could not reach Codeforces.", "unavailable");
  }

  if (response.status === 429) {
    throw new ContestMetadataError("Codeforces rate limit hit. Please try again shortly.", "rate-limited");
  }
  if (!response.ok) {
    throw new ContestMetadataError(
      `Codeforces returned HTTP ${response.status}.`,
      "unavailable",
    );
  }

  let body: CodeforcesContestListResponse;
  try {
    body = (await response.json()) as CodeforcesContestListResponse;
  } catch {
    throw new ContestMetadataError("Codeforces returned an invalid response.", "unavailable");
  }

  if (body.status !== "OK" || !Array.isArray(body.result)) {
    const comment = body.status === "FAILED" ? body.comment : undefined;
    if (comment?.toLowerCase().includes("call limit")) {
      throw new ContestMetadataError(
        "Codeforces rate limit hit. Please try again shortly.",
        "rate-limited",
      );
    }
    throw new ContestMetadataError(
      comment ? `Codeforces: ${comment}` : "Codeforces returned an invalid response.",
      "unavailable",
    );
  }

  const numericId = Number(contestId);
  const contest = body.result.find(
    (candidate) => isCodeforcesContest(candidate) && candidate.id === numericId,
  );
  if (!contest) {
    throw new ContestMetadataError(
      `Codeforces contest ${contestId} was not found or is private.`,
      "not-found",
    );
  }
  if (contest.startTimeSeconds === undefined) {
    throw new ContestMetadataError(
      `Codeforces contest ${contestId} does not publish a start time yet.`,
      "unavailable",
    );
  }

  return {
    platform: "codeforces",
    title: contest.name,
    description: contest.description?.trim() ?? "",
    startingAt: contest.startTimeSeconds,
    endingAt: contest.startTimeSeconds + contest.durationSeconds,
  };
};

const decodeHtmlEntities = (value: string): string =>
  value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (entity, code: string) => {
    const lower = code.toLowerCase();
    if (lower === "amp") return "&";
    if (lower === "quot") return '"';
    if (lower === "apos") return "'";
    if (lower === "lt") return "<";
    if (lower === "gt") return ">";
    const radix = lower.startsWith("#x") ? 16 : 10;
    const number = Number.parseInt(lower.slice(radix === 16 ? 2 : 1), radix);
    return Number.isInteger(number) && number >= 0 && number <= 0x10ffff
      ? String.fromCodePoint(number)
      : entity;
  });

export const parseAtcoderContestPage = (
  html: string,
): Pick<ContestMetadata, "title" | "startingAt" | "endingAt"> => {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const startMatch = html.match(/\bstartTime\s*=\s*moment\(\s*["']([^"']+)["']\s*\)/i);
  const endMatch = html.match(/\bendTime\s*=\s*moment\(\s*["']([^"']+)["']\s*\)/i);

  const title = titleMatch
    ? decodeHtmlEntities(titleMatch[1]).replace(/\s+-\s+AtCoder\s*$/i, "").trim()
    : "";
  const startingAt = startMatch ? Math.floor(Date.parse(startMatch[1]) / 1000) : Number.NaN;
  const endingAt = endMatch ? Math.floor(Date.parse(endMatch[1]) / 1000) : Number.NaN;

  if (
    title === "" ||
    !Number.isFinite(startingAt) ||
    !Number.isFinite(endingAt) ||
    endingAt <= startingAt
  ) {
    throw new ContestMetadataError(
      "AtCoder's contest page did not contain valid title and timing details.",
      "unavailable",
    );
  }

  return { title, startingAt, endingAt };
};

const resolveAtcoderPage = async (
  contestId: string,
  fetcher: typeof fetch,
): Promise<ContestMetadata> => {
  const url = new URL(`/contests/${encodeURIComponent(contestId)}`, ATCODER_ORIGIN);
  url.searchParams.set("lang", "en");

  let response: Response;
  try {
    response = await fetcher(url, {
      headers: { Accept: "text/html", "User-Agent": USER_AGENT },
    });
  } catch {
    throw new ContestMetadataError("Could not reach AtCoder's contest page.", "unavailable");
  }

  if (response.status === 404) {
    throw new ContestMetadataError(`AtCoder contest ${contestId} was not found.`, "not-found");
  }
  if (response.status === 429) {
    throw new ContestMetadataError(
      "AtCoder rate limit hit. Please try again shortly.",
      "rate-limited",
    );
  }
  if (!response.ok) {
    throw new ContestMetadataError(
      `AtCoder's contest page returned HTTP ${response.status}.`,
      "unavailable",
    );
  }

  const contentLength = Number(response.headers.get("Content-Length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_ATCODER_PAGE_BYTES) {
    throw new ContestMetadataError("AtCoder's contest page was unexpectedly large.", "unavailable");
  }

  const html = await response.text();
  if (html.length > MAX_ATCODER_PAGE_BYTES) {
    throw new ContestMetadataError("AtCoder's contest page was unexpectedly large.", "unavailable");
  }

  return {
    platform: "atcoder",
    description: "",
    ...parseAtcoderContestPage(html),
  };
};

/** Resolve safe, allow-listed contest URLs without accepting arbitrary fetch targets. */
export const getContestMetadata = async (
  link: string,
  fetcher: typeof fetch = fetch,
): Promise<ContestMetadata> => {
  const detected = detectContestLink(link);
  if (!detected) {
    throw new ContestMetadataError(
      "Use a Codeforces, VJudge, or AtCoder contest link.",
      "invalid-link",
    );
  }

  if (detected.platform === "codeforces") {
    if (detected.kind === "group") {
      throw new ContestMetadataError(
        "Private Codeforces group contests cannot be fetched without the group's credentials.",
        "unsupported",
      );
    }
    return resolveCodeforces(detected.contestId, detected.kind === "gym", fetcher);
  }

  if (detected.platform === "atcoder") {
    try {
      const contests = await getContests(fetcher);
      const contest = contests.find((candidate) => candidate.id === detected.contestId);
      if (contest?.title?.trim()) {
        return {
          platform: "atcoder",
          title: contest.title.trim(),
          description: "",
          startingAt: contest.start_epoch_second,
          endingAt: contest.start_epoch_second + contest.duration_second,
        };
      }
    } catch (error) {
      // The official contest page is an independent fallback when the
      // community dataset is delayed or temporarily unavailable.
      if (!(error instanceof AtcoderApiError)) throw error;
    }
    return resolveAtcoderPage(detected.contestId, fetcher);
  }

  try {
    const contest = await getContestRank(detected.contestId, fetcher);
    if (!contest.title?.trim()) {
      throw new ContestMetadataError(
        `VJudge contest ${detected.contestId} does not publish a title.`,
        "unavailable",
      );
    }
    const startingAt = Math.floor(contest.begin / 1000);
    return {
      platform: "vjudge",
      title: contest.title.trim(),
      description: "",
      startingAt,
      endingAt: startingAt + Math.floor(contest.length / 1000),
    };
  } catch (error) {
    if (error instanceof ContestMetadataError) throw error;
    if (error instanceof VjudgeApiError) {
      throw new ContestMetadataError(
        error.message,
        error.kind === "rate-limited"
          ? "rate-limited"
          : error.kind === "not-found"
            ? "not-found"
            : "unavailable",
      );
    }
    throw error;
  }
};
