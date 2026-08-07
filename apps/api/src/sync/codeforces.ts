import {
  CodeforcesApiError,
  formatCodeforcesError,
  getUserSubmissions,
} from "../lib/codeforces";
import type { Solve, SolvePage, SyncPlatform } from "./runner";

// ---------------------------------------------------------------------------
// Codeforces adapter for the shared sync runner.
//
// `user.status` is the only endpoint that exposes practice submissions, and so
// the only one that can see upsolves: `contest.standings` rejects every extra
// parameter for non-admin callers and returns official contestant rows alone.
// One call covers a user across every contest they have ever touched.
// ---------------------------------------------------------------------------

/** Codeforces' own word for "this was the live contest". */
const IN_CONTEST_PARTICIPANT_TYPES = new Set(["CONTESTANT", "OUT_OF_COMPETITION"]);

export const codeforcesPlatform: SyncPlatform = {
  handleType: "codeforces",

  // Gym and group contests are private to the API — anonymous calls get "You
  // have to be authenticated to use this method" — so they stay manual.
  accepts: (contest) => contest.platform === "codeforces" && contest.kind === "contest",

  /**
   * Codeforces permits one request per 2s, but production Workers egress still
   * received HTTP 429 at 3s. Five seconds is the largest interval that keeps a
   * 100-handle batch comfortably inside the runner's 10-minute wall budget.
   */
  requestDelayMs: 5000,

  isRateLimit: (cause) => cause instanceof CodeforcesApiError && cause.kind === "call-limit",

  // "unavailable" covers a dead connection, a non-JSON body and a FAILED status
  // that is not about the handle — all judge-side. "invalid-handle" is the one
  // kind a handle owns, and it deliberately does not count: a few dead accounts
  // in a row are normal and must never stop the batch.
  isOutage: (cause) => cause instanceof CodeforcesApiError && cause.kind === "unavailable",

  formatError: formatCodeforcesError,

  // Nothing to load up front: every signal needed to classify a submission is
  // on the submission itself.
  start: async ({ since, fetcher }) => ({
    fetchSolves: async (handle: string): Promise<SolvePage> => {
      const { submissions, truncated } = await getUserSubmissions(handle, { since, fetcher });
      const solves: Solve[] = [];
      for (const submission of submissions) {
        if (submission.verdict !== "OK") continue;
        const contestId = submission.problem.contestId ?? submission.contestId;
        if (contestId === undefined) continue;
        solves.push({
          contestId: String(contestId),
          problemId: submission.problem.index,
          inContest: IN_CONTEST_PARTICIPANT_TYPES.has(submission.author.participantType),
        });
      }
      return { solves, truncated };
    },
  }),
};
