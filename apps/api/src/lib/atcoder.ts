// ---------------------------------------------------------------------------
// AtCoder has no official API, and its own standings are private: a plain GET
// of https://atcoder.jp/contests/<slug>/standings/json redirects to the login
// page. The community AtCoder Problems service (kenkoooo) is the usable source,
// and the only one that exposes practice submissions — hence upsolves.
//
// Its documented policy: "Please don't hit API so often. Please sleep for more
// than 1 second between accesses." The runner's throttled fetcher enforces that
// for every call made through here, paging included.
// ---------------------------------------------------------------------------

const SUBMISSIONS_URL = "https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions";
const CONTESTS_URL = "https://kenkoooo.com/atcoder/resources/contests.json";

/** Identifies us to a volunteer-run service rather than showing up anonymous. */
const USER_AGENT = "diuacm-sync (+https://diuacm.com)";

/** The endpoint's documented page size. A short page means the end of history. */
const PAGE_SIZE = 500;
/** Runaway guard only — paging normally ends on a short page long before this. */
const MAX_PAGES = 20;

export class AtcoderApiError extends Error {
  constructor(
    message: string,
    readonly kind: "unavailable" | "rate-limited",
  ) {
    super(message);
    this.name = "AtcoderApiError";
  }
}

export type AtcoderSubmission = {
  epoch_second: number;
  problem_id: string;
  contest_id: string;
  result: string;
};

export type AtcoderContest = {
  id: string;
  title?: string;
  start_epoch_second: number;
  duration_second: number;
};

const request = async (url: URL, fetcher: typeof fetch): Promise<unknown> => {
  let response: Response;
  try {
    response = await fetcher(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });
  } catch {
    throw new AtcoderApiError("Could not reach AtCoder Problems.", "unavailable");
  }

  if (response.status === 429) {
    throw new AtcoderApiError("AtCoder Problems rate limit hit.", "rate-limited");
  }
  if (!response.ok) {
    throw new AtcoderApiError(
      `AtCoder Problems returned HTTP ${response.status}.`,
      "unavailable",
    );
  }

  try {
    return await response.json();
  } catch {
    throw new AtcoderApiError("AtCoder Problems returned an invalid response.", "unavailable");
  }
};

const isSubmission = (value: unknown): value is AtcoderSubmission => {
  const s = value as AtcoderSubmission | undefined;
  return (
    !!s &&
    typeof s.epoch_second === "number" &&
    typeof s.problem_id === "string" &&
    typeof s.contest_id === "string" &&
    typeof s.result === "string"
  );
};

const isContest = (value: unknown): value is AtcoderContest => {
  const c = value as AtcoderContest | undefined;
  return (
    !!c &&
    typeof c.id === "string" &&
    (c.title === undefined || typeof c.title === "string") &&
    typeof c.start_epoch_second === "number" &&
    typeof c.duration_second === "number"
  );
};

export type SubmissionPage = {
  submissions: AtcoderSubmission[];
  /**
   * MAX_PAGES ran out before the history was exhausted, so the newest
   * submissions were dropped and any counts derived from this are too low.
   * Silent data loss, hence surfaced rather than swallowed.
   */
  truncated: boolean;
};

/**
 * Every submission the user made at or after `since`.
 *
 * Results come back **oldest first** — the opposite of Codeforces — so paging
 * walks forward by moving `from_second` past the last row of each full page.
 *
 * A handle that does not exist returns HTTP 200 and an empty list, exactly like
 * a real account with no submissions. There is no way to tell them apart here,
 * so a typo'd handle syncs "successfully" forever.
 */
export const getUserSubmissions = async (
  handle: string,
  options: { since: number; fetcher?: typeof fetch },
): Promise<SubmissionPage> => {
  const fetcher = options.fetcher ?? fetch;
  const collected: AtcoderSubmission[] = [];
  let from = options.since;
  let truncated = true;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(SUBMISSIONS_URL);
    url.searchParams.set("user", handle);
    url.searchParams.set("from_second", String(from));

    const body = await request(url, fetcher);
    if (!Array.isArray(body)) {
      throw new AtcoderApiError("AtCoder Problems returned an invalid response.", "unavailable");
    }

    const submissions = body.filter(isSubmission);
    collected.push(...submissions);

    // A short page is the end of the account's history; running out of pages
    // is not, and means the newest submissions never arrived.
    if (body.length < PAGE_SIZE) {
      truncated = false;
      break;
    }
    const last = submissions.at(-1);
    if (!last) {
      truncated = false;
      break;
    }
    // +1 guarantees forward progress. The pathological case — more than a full
    // page sharing one second — would skip the remainder rather than loop.
    from = last.epoch_second + 1;
  }

  return { submissions: collected, truncated };
};

/** Start time and duration for every AtCoder contest (~6k rows, ~80 KB gzipped). */
export const getContests = async (fetcher: typeof fetch = fetch): Promise<AtcoderContest[]> => {
  const body = await request(new URL(CONTESTS_URL), fetcher);
  if (!Array.isArray(body)) {
    throw new AtcoderApiError("AtCoder Problems returned an invalid response.", "unavailable");
  }
  return body.filter(isContest);
};
