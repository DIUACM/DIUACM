import { CodeforcesApiError, getUserSubmissions } from "../lib/codeforces";
import type { Solve, SyncPlatform } from "./runner";

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

  /** Codeforces documents roughly one request per two seconds. Stay there. */
  requestDelayMs: 2000,

  isRateLimit: (cause) => cause instanceof CodeforcesApiError && cause.kind === "call-limit",

  // Nothing to load up front: every signal needed to classify a submission is
  // on the submission itself.
  start: async ({ since, fetcher }) => ({
    fetchSolves: async (handle: string): Promise<Solve[]> => {
      const submissions = await getUserSubmissions(handle, { since, fetcher });
      const solves: Solve[] = [];
      for (const submission of submissions) {
        if (submission.verdict !== "OK") continue;
        const contestId = submission.problem.contestId ?? submission.contestId;
        if (contestId === undefined) continue;
        solves.push({
          contestId: String(contestId),
          problemId: submission.problem.index,
          solvedAt: submission.creationTimeSeconds,
          inContest: IN_CONTEST_PARTICIPANT_TYPES.has(submission.author.participantType),
        });
      }
      return solves;
    },
  }),
};
