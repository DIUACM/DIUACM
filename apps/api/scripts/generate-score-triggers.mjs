#!/usr/bin/env node
// Generates the ranklist score/rank trigger migration SQL. The score formula
// exists ONCE here (SCORE_EXPR) instead of being hand-pasted into a dozen
// trigger bodies — when the formula changes, edit it here and emit a fresh
// migration:
//
//   pnpm db:generate -- --custom --name score_triggers_v2   # empty custom migration
//   node scripts/generate-score-triggers.mjs > drizzle/00XX_score_triggers_v2.sql
//
// The output drops every existing score trigger, recreates all of them from
// the current formula, and re-runs the backfill so stored scores/ranks match.
// The originally committed 0002_score_triggers.sql was generated this way; the
// trigger test suite (test/triggers.test.ts) guards the behavior.
//
// NOTE: each CREATE TRIGGER is emitted on a single line on purpose — some
// SQLite runners split a SQL blob on ";\n", which would chop a multi-line
// BEGIN…END body apart.

// score(user U in ranklist R) = SUM over events E in R of:
//   * strict-attendance exception: when R.consider_strict_attendance = 1 AND
//     E.strict_attendance = 1 AND U has no attendance row for E, solves count
//     as upsolves -> (solve + upsolve) * weight * upsolve_weight
//   * otherwise -> solve * weight + upsolve * weight * upsolve_weight
const SCORE_EXPR =
  "(SELECT COALESCE(SUM(CASE WHEN rl.consider_strict_attendance = 1 AND e.strict_attendance = 1 AND NOT EXISTS (SELECT 1 FROM event_attendance ea WHERE ea.event_id = ep.event_id AND ea.user_id = ep.user_id) THEN (ep.solve_count + ep.upsolve_count) * re.weight * rl.upsolve_weight ELSE ep.solve_count * re.weight + ep.upsolve_count * re.weight * rl.upsolve_weight END), 0) FROM ranklist_event re JOIN events e ON e.id = re.event_id JOIN ranklists rl ON rl.id = re.ranklist_id JOIN event_performance ep ON ep.event_id = re.event_id AND ep.user_id = ranklist_user.user_id WHERE re.ranklist_id = ranklist_user.ranklist_id)";

// Competition ranking (1,2,2,4): 1 + count of members with a strictly greater score.
const RANK_EXPR =
  "(1 + (SELECT COUNT(*) FROM ranklist_user r2 WHERE r2.ranklist_id = ranklist_user.ranklist_id AND r2.score > ranklist_user.score))";

// Scope fragments. A narrow score scope is paired with a ranklist-wide re-rank
// scope, because one user's score change shifts every other user's rank.
const ranklistsOfEvent = (ref) =>
  `ranklist_id IN (SELECT ranklist_id FROM ranklist_event WHERE event_id = ${ref})`;

/** @type {{name: string, on: string, scoreWhere: string | null, rankWhere: string}[]} */
const TRIGGERS = [
  // Participation rows: recompute the affected user in every ranklist that
  // includes the event, then re-rank those ranklists.
  {
    name: "rl_score_ep_ai",
    on: "AFTER INSERT ON `event_performance`",
    scoreWhere: `user_id = NEW.user_id AND ${ranklistsOfEvent("NEW.event_id")}`,
    rankWhere: ranklistsOfEvent("NEW.event_id"),
  },
  {
    name: "rl_score_ep_au",
    on: "AFTER UPDATE OF `solve_count`, `upsolve_count` ON `event_performance`",
    scoreWhere: `user_id = NEW.user_id AND ${ranklistsOfEvent("NEW.event_id")}`,
    rankWhere: ranklistsOfEvent("NEW.event_id"),
  },
  {
    name: "rl_score_ep_ad",
    on: "AFTER DELETE ON `event_performance`",
    scoreWhere: `user_id = OLD.user_id AND ${ranklistsOfEvent("OLD.event_id")}`,
    rankWhere: ranklistsOfEvent("OLD.event_id"),
  },
  {
    name: "rl_score_ea_ai",
    on: "AFTER INSERT ON `event_attendance`",
    scoreWhere: `user_id = NEW.user_id AND ${ranklistsOfEvent("NEW.event_id")}`,
    rankWhere: ranklistsOfEvent("NEW.event_id"),
  },
  {
    name: "rl_score_ea_ad",
    on: "AFTER DELETE ON `event_attendance`",
    scoreWhere: `user_id = OLD.user_id AND ${ranklistsOfEvent("OLD.event_id")}`,
    rankWhere: ranklistsOfEvent("OLD.event_id"),
  },
  // Ranklist-event links: attaching, detaching, or re-weighting an event
  // affects every member of that ranklist.
  {
    name: "rl_score_re_ai",
    on: "AFTER INSERT ON `ranklist_event`",
    scoreWhere: "ranklist_id = NEW.ranklist_id",
    rankWhere: "ranklist_id = NEW.ranklist_id",
  },
  {
    name: "rl_score_re_ad",
    on: "AFTER DELETE ON `ranklist_event`",
    scoreWhere: "ranklist_id = OLD.ranklist_id",
    rankWhere: "ranklist_id = OLD.ranklist_id",
  },
  {
    name: "rl_score_re_au",
    on: "AFTER UPDATE OF `weight` ON `ranklist_event`",
    scoreWhere: "ranklist_id = NEW.ranklist_id",
    rankWhere: "ranklist_id = NEW.ranklist_id",
  },
  // Ranklist / event settings that feed the formula.
  {
    name: "rl_score_rl_au",
    on: "AFTER UPDATE OF `upsolve_weight`, `consider_strict_attendance` ON `ranklists`",
    scoreWhere: "ranklist_id = NEW.id",
    rankWhere: "ranklist_id = NEW.id",
  },
  {
    name: "rl_score_ev_au",
    on: "AFTER UPDATE OF `strict_attendance` ON `events`",
    scoreWhere: ranklistsOfEvent("NEW.id"),
    rankWhere: ranklistsOfEvent("NEW.id"),
  },
  // Membership: a new member needs their score computed; a removed member
  // shifts everyone else's rank (their score rows are already gone).
  {
    name: "rl_score_ru_ai",
    on: "AFTER INSERT ON `ranklist_user`",
    scoreWhere: "ranklist_id = NEW.ranklist_id AND user_id = NEW.user_id",
    rankWhere: "ranklist_id = NEW.ranklist_id",
  },
  {
    name: "rl_score_ru_ad",
    on: "AFTER DELETE ON `ranklist_user`",
    scoreWhere: null,
    rankWhere: "ranklist_id = OLD.ranklist_id",
  },
];

const scoreUpdate = (where) =>
  `UPDATE ranklist_user SET score = ${SCORE_EXPR}${where ? ` WHERE ${where}` : ""};`;
const rankUpdate = (where) =>
  `UPDATE ranklist_user SET rank = ${RANK_EXPR}${where ? ` WHERE ${where}` : ""};`;

const statements = [];

for (const t of TRIGGERS) statements.push(`DROP TRIGGER IF EXISTS \`${t.name}\`;`);

for (const t of TRIGGERS) {
  const body = [
    ...(t.scoreWhere !== null ? [scoreUpdate(t.scoreWhere)] : []),
    rankUpdate(t.rankWhere),
  ].join(" ");
  statements.push(`CREATE TRIGGER \`${t.name}\` ${t.on} BEGIN ${body} END;`);
}

// Backfill: scores first, then ranks (ranks depend on final scores).
statements.push(scoreUpdate(null));
statements.push(rankUpdate(null));

const header = `-- Custom SQL migration file, put your code below! --

-- GENERATED by scripts/generate-score-triggers.mjs — edit the formula there,
-- not here, then emit a new migration (see the script header for how).
`;

process.stdout.write(header + "\n" + statements.join("\n--> statement-breakpoint\n") + "\n");
