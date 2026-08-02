import { fetchWithTimeout, readLimitedJson } from "./upstream";

const MAX_CODEFORCES_RESPONSE_BYTES = 8_000_000;

export class CodeforcesApiError extends Error {
  constructor(
    message: string,
    readonly kind: "invalid-handle" | "unavailable" | "call-limit",
  ) {
    super(message);
    this.name = "CodeforcesApiError";
  }
}

type CodeforcesUser = {
  handle: string;
  maxRating?: number;
};

type CodeforcesResponse =
  | { status: "OK"; result: CodeforcesUser[] }
  | { status: "FAILED"; comment?: string };

const isInvalidHandleComment = (comment: string | undefined): boolean => {
  if (!comment) return false;
  return (
    /user with handle .* not found/i.test(comment) ||
    /handles?:.*(?:invalid|not found|should)/i.test(comment)
  );
};

const isCallLimitComment = (comment: string | undefined): boolean =>
  !!comment && /call limit exceeded/i.test(comment);

export type ResolvedCodeforcesUser = { handle: string; maxRating: number | null };

/**
 * Resolve a batch of current or historic handles to their accounts' canonical
 * handle and highest rating, in the order they were asked for.
 *
 * One call covers up to 10,000 handles, which is what makes the daily rating
 * refresh (see src/sync/cf-rating.ts) three requests rather than three hundred.
 *
 * The catch, and the reason callers need a recovery strategy: Codeforces fails
 * the *whole* request if any single handle is unknown — `status: "FAILED"` with
 * a null result, not a partial list. So a clean response proves every handle in
 * it is good, and an `invalid-handle` throw says nothing about which one is not.
 */
export const getCodeforcesUsers = async (
  handles: string[],
  fetcher: typeof fetch = fetch,
): Promise<ResolvedCodeforcesUser[]> => {
  if (handles.length === 0) return [];

  const url = new URL("https://codeforces.com/api/user.info");
  // Semicolons are the documented separator. URLSearchParams percent-encodes
  // them, which Codeforces decodes back — verified against the live API.
  url.searchParams.set("handles", handles.join(";"));
  url.searchParams.set("checkHistoricHandles", "true");

  let response: Response;
  try {
    response = await fetchWithTimeout(fetcher, url, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new CodeforcesApiError(
      "Could not reach Codeforces. Please try again.",
      "unavailable",
    );
  }

  let body: CodeforcesResponse;
  try {
    body = (await readLimitedJson(
      response,
      MAX_CODEFORCES_RESPONSE_BYTES,
    )) as CodeforcesResponse;
  } catch {
    throw new CodeforcesApiError(
      "Codeforces returned an invalid response. Please try again.",
      "unavailable",
    );
  }

  if (body.status === "FAILED") {
    if (isInvalidHandleComment(body.comment)) {
      throw new CodeforcesApiError("Invalid Codeforces handle.", "invalid-handle");
    }
    // Distinguished from a plain outage because a caller working through a queue
    // has to stop rather than retry — the next call would be refused too.
    if (isCallLimitComment(body.comment)) {
      throw new CodeforcesApiError("Codeforces call limit exceeded.", "call-limit");
    }
    throw new CodeforcesApiError(
      "Codeforces is temporarily unavailable. Please try again.",
      "unavailable",
    );
  }

  if (!response.ok) {
    throw new CodeforcesApiError(
      "Codeforces is temporarily unavailable. Please try again.",
      "unavailable",
    );
  }

  // One user per requested handle, positionally. A different length means the
  // response cannot be mapped back at all, so it is a bad response, not a bad
  // handle — callers must not bisect on this.
  const users = body.result;
  if (!Array.isArray(users) || users.length !== handles.length) {
    throw new CodeforcesApiError(
      "Codeforces returned an invalid response. Please try again.",
      "unavailable",
    );
  }

  return users.map((user) => {
    if (
      !user ||
      typeof user.handle !== "string" ||
      (user.maxRating !== undefined && !Number.isInteger(user.maxRating))
    ) {
      throw new CodeforcesApiError(
        "Codeforces returned an invalid response. Please try again.",
        "unavailable",
      );
    }
    return { handle: user.handle, maxRating: user.maxRating ?? null };
  });
};

/**
 * Validate a current or historic Codeforces handle and return the account's
 * current canonical handle/rating.
 */
export const getCodeforcesUser = async (
  handle: string,
  fetcher: typeof fetch = fetch,
): Promise<ResolvedCodeforcesUser> => {
  const [user] = await getCodeforcesUsers([handle], fetcher);
  return user;
};

// ---------------------------------------------------------------------------
// Submissions — the source for solve/upsolve counts.
//
// `contest.standings` cannot be used: Codeforces rejects every extra parameter
// for non-admin callers, and the bare call returns official contestant rows
// only, with no practice submissions at all. `user.status` is the one endpoint
// that exposes both, and one call covers every contest a user has touched.
// ---------------------------------------------------------------------------

export type CodeforcesSubmission = {
  contestId?: number;
  creationTimeSeconds: number;
  problem: { contestId?: number; index: string };
  author: { participantType: string };
  verdict?: string;
};

type SubmissionsResponse =
  | { status: "OK"; result: CodeforcesSubmission[] }
  | { status: "FAILED"; comment?: string };

/** Submissions come back newest-first, so a page is worth this many. */
const PAGE_SIZE = 1000;
/** Runaway guard only — paging normally stops at the cutoff long before this. */
const MAX_PAGES = 15;

const isValidSubmission = (value: unknown): value is CodeforcesSubmission => {
  const s = value as CodeforcesSubmission | undefined;
  return (
    !!s &&
    typeof s.creationTimeSeconds === "number" &&
    !!s.problem &&
    typeof s.problem.index === "string" &&
    !!s.author &&
    typeof s.author.participantType === "string"
  );
};

export type SubmissionPage = {
  submissions: CodeforcesSubmission[];
  /**
   * MAX_PAGES ran out before the history reached `since`, so older submissions
   * were dropped and any counts derived from this are too low. Silent data
   * loss, hence surfaced rather than swallowed.
   */
  truncated: boolean;
};

/**
 * Every submission the user made at or after `since`, newest first. Paging stops
 * as soon as a page reaches past the cutoff, so a typical user costs one call.
 */
export const getUserSubmissions = async (
  handle: string,
  options: { since: number; fetcher?: typeof fetch },
): Promise<SubmissionPage> => {
  const fetcher = options.fetcher ?? fetch;
  const collected: CodeforcesSubmission[] = [];
  let truncated = true;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL("https://codeforces.com/api/user.status");
    url.searchParams.set("handle", handle);
    url.searchParams.set("from", String(page * PAGE_SIZE + 1));
    url.searchParams.set("count", String(PAGE_SIZE));

    let response: Response;
    try {
      response = await fetchWithTimeout(fetcher, url, {
        headers: { Accept: "application/json" },
      });
    } catch {
      throw new CodeforcesApiError("Could not reach Codeforces.", "unavailable");
    }

    let body: SubmissionsResponse;
    try {
      body = (await readLimitedJson(
        response,
        MAX_CODEFORCES_RESPONSE_BYTES,
      )) as SubmissionsResponse;
    } catch {
      throw new CodeforcesApiError("Codeforces returned an invalid response.", "unavailable");
    }

    if (body.status === "FAILED") {
      if (isCallLimitComment(body.comment)) {
        throw new CodeforcesApiError("Codeforces call limit exceeded.", "call-limit");
      }
      if (isInvalidHandleComment(body.comment)) {
        throw new CodeforcesApiError("Invalid Codeforces handle.", "invalid-handle");
      }
      throw new CodeforcesApiError(
        body.comment ?? "Codeforces is temporarily unavailable.",
        "unavailable",
      );
    }

    if (!response.ok || !Array.isArray(body.result)) {
      throw new CodeforcesApiError("Codeforces returned an invalid response.", "unavailable");
    }

    const submissions = body.result.filter(isValidSubmission);
    for (const submission of submissions) {
      if (submission.creationTimeSeconds >= options.since) collected.push(submission);
    }

    // A short page means we reached the end of the account's history; a page
    // whose oldest entry predates the cutoff means everything older is too old.
    // Either way the history is complete — only running out of pages is not.
    const oldest = body.result.at(-1);
    if (body.result.length < PAGE_SIZE) {
      truncated = false;
      break;
    }
    if (oldest && oldest.creationTimeSeconds < options.since) {
      truncated = false;
      break;
    }
  }

  return { submissions: collected, truncated };
};
