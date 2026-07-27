import { AtcoderApiError, getContests, getUserSubmissions } from "../lib/atcoder";
import type { Solve, SolvePage, SyncPlatform } from "./runner";

// ---------------------------------------------------------------------------
// AtCoder adapter for the shared sync runner.
//
// AtCoder submissions carry no equivalent of Codeforces' `participantType`, so
// the "was this the live contest?" signal has to come from the contest's real
// start and duration. Those arrive in one ~80 KB fetch of every AtCoder contest,
// made once per run and narrowed to the contests this run's events reference.
// ---------------------------------------------------------------------------

export const atcoderPlatform: SyncPlatform = {
  handleType: "atcoder",

  accepts: (contest) => contest.platform === "atcoder",

  /** The API asks for more than a second between accesses; leave margin. */
  requestDelayMs: 1500,

  isRateLimit: (cause) => cause instanceof AtcoderApiError && cause.kind === "rate-limited",

  start: async ({ events, since, fetcher }) => {
    const wanted = new Set(events.map((event) => event.contestId));
    const windows = new Map<string, { start: number; end: number }>();
    for (const contest of await getContests(fetcher)) {
      if (!wanted.has(contest.id)) continue;
      windows.set(contest.id, {
        start: contest.start_epoch_second,
        end: contest.start_epoch_second + contest.duration_second,
      });
    }

    return {
      fetchSolves: async (handle: string): Promise<SolvePage> => {
        const { submissions, truncated } = await getUserSubmissions(handle, { since, fetcher });
        const solves: Solve[] = [];
        for (const submission of submissions) {
          if (submission.result !== "AC") continue;
          const window = windows.get(submission.contest_id);
          solves.push({
            contestId: submission.contest_id,
            problemId: submission.problem_id,
            solvedAt: submission.epoch_second,
            // Unknown contest → let the runner fall back to the event's own
            // window rather than silently calling everything an upsolve.
            inContest:
              window !== undefined &&
              submission.epoch_second >= window.start &&
              submission.epoch_second <= window.end,
          });
        }
        return { solves, truncated };
      },
    };
  },
};
