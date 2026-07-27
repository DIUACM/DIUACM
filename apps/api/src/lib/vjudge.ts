// ---------------------------------------------------------------------------
// VJudge has no documented API, but the endpoint its own standings page calls —
// /contest/rank/single/<id> — is public JSON and needs no session, even for the
// password-protected contests the club runs. One call returns every
// participant's whole submission history for that contest, in-contest and after
// it, which is why the VJudge sync walks contests instead of handles.
//
// The site sits behind Cloudflare bot protection. An empty User-Agent is
// answered with 403 and `cf-mitigated: challenge`; any non-empty one is let
// through. Workers' fetch sends none by default, so USER_AGENT below is load
// bearing, not decoration.
// ---------------------------------------------------------------------------

const RANK_URL = "https://vjudge.net/contest/rank/single/";

/** Identifies us rather than showing up anonymous — and gets us past the bot check. */
const USER_AGENT = "diuacm-sync (+https://diuacm.com)";

/** VJudge's own code for an accepted submission; everything else is a failure. */
const ACCEPTED = 1;

export class VjudgeApiError extends Error {
  constructor(
    message: string,
    readonly kind: "unavailable" | "rate-limited" | "not-found",
  ) {
    super(message);
    this.name = "VjudgeApiError";
  }
}

/**
 * One row of the standings feed: participant id, problem index within the
 * contest, verdict, and seconds since the contest began. The last one runs past
 * the contest length for upsolves — months past it, on older contests.
 */
export type VjudgeSubmission = [
  participantId: number,
  problemIndex: number,
  status: number,
  secondsSinceBegin: number,
];

export type VjudgeRank = {
  /** Contest start, epoch **milliseconds**. */
  begin: number;
  /** Contest duration, **milliseconds**. */
  length: number;
  /** Keyed by participant id as a string; `name` is the VJudge username. */
  participants: Record<string, { name: string }>;
  submissions: VjudgeSubmission[];
};

const isSubmission = (value: unknown): value is VjudgeSubmission =>
  Array.isArray(value) && value.length >= 4 && value.every((n) => typeof n === "number");

/** Only the username is used; the rest of the participant object is ignored. */
const participantName = (value: unknown): string | null => {
  const name = (value as { name?: unknown } | undefined)?.name;
  return typeof name === "string" && name !== "" ? name : null;
};

/** The raw body, or `null` for the empty-200 case. Throws on everything else. */
const request = async (contestId: string, fetcher: typeof fetch): Promise<string | null> => {
  let response: Response;
  try {
    response = await fetcher(`${RANK_URL}${encodeURIComponent(contestId)}`, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });
  } catch {
    throw new VjudgeApiError("Could not reach VJudge.", "unavailable");
  }

  // 403 is the Cloudflare challenge, not a permission error on this contest:
  // the next contest would be answered the same way, so back the whole run off.
  if (response.status === 429 || response.status === 403) {
    throw new VjudgeApiError(
      `VJudge refused the request (HTTP ${response.status}).`,
      "rate-limited",
    );
  }
  if (!response.ok) {
    throw new VjudgeApiError(`VJudge returned HTTP ${response.status}.`, "unavailable");
  }

  const body = await response.text();
  return body.trim() === "" ? null : body;
};

/**
 * Standings for one contest.
 *
 * A contest id that does not exist, or one whose standings are not public,
 * comes back as **HTTP 200 with an empty body** rather than a 404. So does a
 * live contest now and then — measured at ~2% of a 121-contest pass, where the
 * same id answered normally seconds later. The two are indistinguishable from
 * the response, so an empty body is retried once before it is believed.
 */
export const getContestRank = async (
  contestId: string,
  fetcher: typeof fetch = fetch,
): Promise<VjudgeRank> => {
  const body = (await request(contestId, fetcher)) ?? (await request(contestId, fetcher));
  if (body === null) {
    throw new VjudgeApiError(
      "VJudge returned an empty response twice — contest deleted, made private, or unwell.",
      "not-found",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new VjudgeApiError("VJudge returned an invalid response.", "unavailable");
  }

  const rank = parsed as Partial<VjudgeRank> | null;
  if (
    !rank ||
    typeof rank.begin !== "number" ||
    typeof rank.length !== "number" ||
    typeof rank.participants !== "object" ||
    rank.participants === null ||
    !Array.isArray(rank.submissions)
  ) {
    throw new VjudgeApiError("VJudge returned an unexpected contest shape.", "unavailable");
  }

  const participants: Record<string, { name: string }> = {};
  for (const [id, participant] of Object.entries(rank.participants)) {
    const name = participantName(participant);
    if (name !== null) participants[id] = { name };
  }

  return {
    begin: rank.begin,
    length: rank.length,
    participants,
    submissions: rank.submissions.filter(isSubmission),
  };
};

export const isAccepted = (submission: VjudgeSubmission): boolean =>
  submission[2] === ACCEPTED;
