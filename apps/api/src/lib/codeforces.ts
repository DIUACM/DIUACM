export class CodeforcesApiError extends Error {
  constructor(
    message: string,
    readonly kind: "invalid-handle" | "unavailable",
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
