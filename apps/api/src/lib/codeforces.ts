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

/**
 * Validate a current or historic Codeforces handle and return the account's
 * current canonical handle/rating.
 */
export const getCodeforcesUser = async (
  handle: string,
  fetcher: typeof fetch = fetch,
): Promise<{ handle: string; maxRating: number | null }> => {
  const url = new URL("https://codeforces.com/api/user.info");
  url.searchParams.set("handles", handle);
  url.searchParams.set("checkHistoricHandles", "true");

  let response: Response;
  try {
    response = await fetcher(url, {
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
    body = (await response.json()) as CodeforcesResponse;
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

  const user = body.result?.[0];
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

  return {
    handle: user.handle,
    maxRating: user.maxRating ?? null,
  };
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

const isCallLimitComment = (comment: string | undefined): boolean =>
  !!comment && /call limit exceeded/i.test(comment);

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
      response = await fetcher(url, { headers: { Accept: "application/json" } });
    } catch {
      throw new CodeforcesApiError("Could not reach Codeforces.", "unavailable");
    }

    let body: SubmissionsResponse;
    try {
      body = (await response.json()) as SubmissionsResponse;
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
