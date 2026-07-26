#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";

const DEFAULT_EXPORT_URL = "https://diuacm.com/api/migration/export";
const DEFAULT_DATABASE = "diuacm-db";
const VALID_EVENT_TYPES = new Set(["contest", "class", "other"]);
const VALID_EVENT_SCOPES = new Set([
  "open_for_all",
  "only_girls",
  "junior_programmers",
  "selected_persons",
]);
const VALID_HANDLE_TYPES = new Set(["codeforces", "vjudge", "atcoder"]);

const aliases = {
  users: ["users", "programmers"],
  userHandles: ["user_handles", "userHandles", "handles"],
  events: ["events"],
  trackers: ["trackers"],
  ranklists: ["ranklists", "rank_lists"],
  ranklistEvents: [
    "event_rank_list",
    "eventRankList",
    "ranklist_event",
    "ranklist_events",
    "ranklistEvent",
    "ranklistEvents",
  ],
  ranklistUsers: [
    "rank_list_user",
    "rankListUser",
    "ranklist_user",
    "ranklist_users",
    "ranklistUser",
    "ranklistUsers",
  ],
  attendance: ["event_attendance", "event_attendances", "attendance", "attendances"],
};

const usage = `Usage:
  pnpm import:structure [--remote] [--input export.json] [--dry-run] [--out tmp/import.sql]

Options:
  --input <file>       Read JSON from a local file instead of the protected URL.
  --url <url>          Override the export URL.
  --remote            Import into remote D1. Defaults to local D1.
  --local             Import into local D1. This is the default.
  --dry-run           Generate SQL only; do not run wrangler.
  --out <file>        Write generated SQL to this path.
  --database <name>   D1 database name or binding. Defaults to ${DEFAULT_DATABASE}.
  --help              Show this help text.

URL mode requires MIGRATION_EXPORT_KEY or MIGRATION_EXPORT_API_KEY. The key is sent as X-Migration-Export-Key.`;

const parseArgs = (argv) => {
  const options = {
    database: DEFAULT_DATABASE,
    dryRun: false,
    input: null,
    local: true,
    out: null,
    url: DEFAULT_EXPORT_URL,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      console.log(usage);
      process.exit(0);
    }
    if (arg === "--remote") {
      options.local = false;
      continue;
    }
    if (arg === "--local") {
      options.local = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--input" || arg === "--out" || arg === "--url" || arg === "--database") {
      const value = argv[++i];
      if (!value) fail(`${arg} requires a value`);
      options[arg.slice(2)] = value;
      continue;
    }
    fail(`Unknown argument: ${arg}`);
  }

  return options;
};

const fail = (message) => {
  console.error(`Import failed: ${message}`);
  process.exit(1);
};

const warn = (warnings, table, sourceId, message) => {
  warnings.push({ table, sourceId: sourceId ?? "unknown", message });
};

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const normalizeKey = (key) => key.replace(/[^a-z0-9]/gi, "").toLowerCase();

const direct = (row, keys) => {
  if (!isRecord(row)) return undefined;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) return row[key];
  }

  const wanted = new Set(keys.map(normalizeKey));
  for (const [key, value] of Object.entries(row)) {
    if (wanted.has(normalizeKey(key))) return value;
  }

  return undefined;
};

const nested = (row, keys) => {
  const pivot = direct(row, ["pivot"]);
  const value = direct(row, keys);
  if (value !== undefined) return value;
  return isRecord(pivot) ? direct(pivot, keys) : undefined;
};

const findRows = (payload, keyAliases) => {
  const queue = [payload];
  const wanted = new Set(keyAliases.map(normalizeKey));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!isRecord(current)) continue;

    for (const [key, value] of Object.entries(current)) {
      if (wanted.has(normalizeKey(key)) && Array.isArray(value)) return value;
    }

    for (const key of ["data", "tables", "structure", "payload", "export"]) {
      const value = current[key];
      if (isRecord(value)) queue.push(value);
    }
  }

  return [];
};

const loadJson = async (options) => {
  if (options.input) {
    const path = resolve(options.input);
    return JSON.parse(readFileSync(path, "utf8"));
  }

  const apiKey = process.env.MIGRATION_EXPORT_KEY ?? process.env.MIGRATION_EXPORT_API_KEY;
  if (!apiKey) {
    fail("MIGRATION_EXPORT_KEY or MIGRATION_EXPORT_API_KEY is required when --input is not provided");
  }

  const response = await fetch(options.url, {
    headers: {
      Accept: "application/json",
      "X-Migration-Export-Key": apiKey,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();
  if (!response.ok) {
    fail(`export endpoint returned HTTP ${response.status}`);
  }
  if (!contentType.includes("application/json")) {
    fail(`export endpoint returned ${contentType || "unknown content type"} instead of JSON`);
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    fail(`could not parse export JSON: ${error.message}`);
  }
};

const toInt = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "boolean") return value ? 1 : 0;
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const toBoolInt = (value, defaultValue = false) => {
  if (value === null || value === undefined || value === "") return defaultValue ? 1 : 0;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value === 0 ? 0 : 1;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "published", "open", "enabled"].includes(normalized)) return 1;
  if (["0", "false", "no", "n", "draft", "closed", "disabled"].includes(normalized)) return 0;
  return defaultValue ? 1 : 0;
};

// Matches a trailing "Z" or a numeric UTC offset like "+06:00" / "+0600".
const HAS_TIMEZONE = /[zZ]$|[+-]\d{2}:?\d{2}$/;

const toEpochSeconds = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Math.floor(value.getTime() / 1000);

  const numeric = toNumber(value);
  if (numeric !== null && /^\d+(\.\d+)?$/.test(String(value).trim())) {
    return numeric > 10_000_000_000 ? Math.floor(numeric / 1000) : Math.floor(numeric);
  }

  // The source stores MySQL/Laravel-style "YYYY-MM-DD HH:mm:ss" timestamps in UTC with
  // no offset. Date.parse would otherwise treat those as local time on whatever machine
  // runs this script, silently shifting every timestamp by the host's UTC offset.
  const trimmed = String(value).trim();
  const isoLike = HAS_TIMEZONE.test(trimmed) ? trimmed : `${trimmed.replace(" ", "T")}Z`;

  const parsed = Date.parse(isoLike);
  return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000);
};

const textOrNull = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
};

const requiredText = (value) => textOrNull(value);

const sanitizeUsername = (value, id) => {
  const base = textOrNull(value) ?? `user_${id}`;
  const cleaned = base.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^_+|_+$/g, "");
  const compact = cleaned.length >= 3 ? cleaned.slice(0, 30) : `user_${id}`;
  return compact || `user_${id}`;
};

const slugify = (value, fallback) => {
  const slug = (textOrNull(value) ?? fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
};

const normalizeStatus = (row, defaultStatus = "published") => {
  const status = textOrNull(direct(row, ["status"]));
  if (status) {
    const normalized = status.toLowerCase();
    if (["published", "publish", "active", "public", "1"].includes(normalized)) return "published";
    if (["draft", "hidden", "private", "inactive", "0"].includes(normalized)) return "draft";
  }
  const published = direct(row, ["published", "is_published", "isPublished", "active", "is_active"]);
  if (published !== undefined) return toBoolInt(published) ? "published" : "draft";
  return defaultStatus;
};

const normalizeEventType = (value) => {
  const normalized = (textOrNull(value) ?? "other").toLowerCase();
  if (VALID_EVENT_TYPES.has(normalized)) return normalized;
  if (["contest", "contest_event", "programming_contest"].includes(normalized)) return "contest";
  if (["class", "training", "workshop", "session"].includes(normalized)) return "class";
  return "other";
};

const normalizeScope = (value) => {
  const normalized = (textOrNull(value) ?? "open_for_all").toLowerCase();
  const snake = normalized.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (VALID_EVENT_SCOPES.has(snake)) return snake;
  if (["girls", "female", "only_girl"].includes(snake)) return "only_girls";
  if (["junior", "juniors"].includes(snake)) return "junior_programmers";
  if (["selected", "selected_users", "selected_person"].includes(snake)) return "selected_persons";
  return "open_for_all";
};

const normalizeImageKey = (value) => {
  const key = textOrNull(value);
  if (!key) return null;
  if (/^(https?:|data:|\/|storage\/|public\/)/i.test(key)) return null;
  return key;
};

const normalizeWeight = (value, warnings, table, sourceId) => {
  const number = toNumber(value);
  if (number === null) return 0;
  if (number >= 0 && number <= 1) return number;
  if (Number.isInteger(number) && number > 1 && number <= 100) {
    warn(warnings, table, sourceId, `converted percentage-like weight ${number} to ${number / 100}`);
    return number / 100;
  }
  warn(warnings, table, sourceId, `weight ${number} is outside 0..1; clamped to 1`);
  return 1;
};

const sqlValue = (value) => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "NULL";
    return String(value);
  }
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${String(value).replace(/'/g, "''")}'`;
};

const insertSql = (table, row, conflictTarget, updateColumns) => {
  const columns = Object.keys(row);
  const values = columns.map((column) => sqlValue(row[column]));
  const quotedColumns = columns.map((column) => `\`${column}\``).join(", ");
  const conflict = conflictTarget.map((column) => `\`${column}\``).join(", ");
  const updates = updateColumns
    .filter((column) => columns.includes(column))
    .map((column) => `\`${column}\` = excluded.\`${column}\``);
  const action = updates.length > 0 ? `DO UPDATE SET ${updates.join(", ")}` : "DO NOTHING";
  return `INSERT INTO \`${table}\` (${quotedColumns}) VALUES (${values.join(", ")}) ON CONFLICT (${conflict}) ${action};`;
};

const rowId = (row) => toInt(direct(row, ["id", "source_id", "sourceId"]));

const requiredId = (row, table, warnings) => {
  const id = rowId(row);
  if (id === null) warn(warnings, table, null, "missing id");
  return id;
};

const addUnique = (rows, keyFn) => {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = keyFn(row);
    if (key === null || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
};

const mapUsers = (rows, warnings) => {
  const usedUsernames = new Set();
  const usedEmails = new Set();
  const usedStudentIds = new Set();
  const out = [];

  for (const row of rows) {
    const id = requiredId(row, "users", warnings);
    if (id === null) continue;

    const email = textOrNull(direct(row, ["email", "email_address", "emailAddress"]))?.toLowerCase();
    if (!email) {
      warn(warnings, "users", id, "missing email; skipped");
      continue;
    }
    if (usedEmails.has(email)) {
      warn(warnings, "users", id, "duplicate email; skipped");
      continue;
    }
    usedEmails.add(email);

    const name = requiredText(direct(row, ["name", "full_name", "fullName", "display_name"])) ??
      email.split("@")[0];
    let username = sanitizeUsername(
      direct(row, ["username", "user_name", "handle", "slug"]) ?? email.split("@")[0],
      id,
    );
    if (usedUsernames.has(username)) username = sanitizeUsername(`${username}_${id}`, id);
    usedUsernames.add(username);

    const rawStudentId = textOrNull(direct(row, ["student_id", "studentId", "studentid"]));
    const studentId = rawStudentId && !usedStudentIds.has(rawStudentId) ? rawStudentId : null;
    if (rawStudentId && studentId === null) warn(warnings, "users", id, "duplicate student_id; using NULL");
    if (studentId) usedStudentIds.add(studentId);

    const now = Math.floor(Date.now() / 1000);
    out.push({
      id,
      name,
      email,
      username,
      student_id: studentId,
      password_hash: null,
      image_key: normalizeImageKey(
        direct(row, ["image_key", "imageKey", "image", "avatar", "profile_photo", "profile_photo_path"]),
      ),
      max_cf_rating: toInt(direct(row, ["max_cf_rating", "maxCfRating", "cf_rating", "rating"])),
      created_at: toEpochSeconds(direct(row, ["created_at", "createdAt"])) ?? now,
      updated_at: toEpochSeconds(direct(row, ["updated_at", "updatedAt"])) ?? now,
    });
  }

  return out;
};

const mapUserHandles = (handleRows, userRows, warnings) => {
  const out = [];

  for (const row of handleRows) {
    const userId = toInt(direct(row, ["user_id", "userId", "programmer_id", "programmerId"]));
    const type = textOrNull(direct(row, ["type", "platform", "name"]))?.toLowerCase();
    const handle = textOrNull(direct(row, ["handle", "value", "username"]));
    if (userId === null || !type || !handle || !VALID_HANDLE_TYPES.has(type)) {
      warn(warnings, "user_handles", rowId(row), "missing user_id, valid type, or handle; skipped");
      continue;
    }
    const now = Math.floor(Date.now() / 1000);
    out.push({
      id: rowId(row),
      user_id: userId,
      type,
      handle,
      created_at: toEpochSeconds(direct(row, ["created_at", "createdAt"])) ?? now,
      updated_at: toEpochSeconds(direct(row, ["updated_at", "updatedAt"])) ?? now,
    });
  }

  for (const row of userRows) {
    const userId = rowId(row);
    if (userId === null) continue;
    const nestedHandles = direct(row, ["handles", "user_handles"]);
    if (Array.isArray(nestedHandles)) {
      for (const child of nestedHandles) {
        if (!isRecord(child)) continue;
        const type = textOrNull(direct(child, ["type", "platform", "name"]))?.toLowerCase();
        const handle = textOrNull(direct(child, ["handle", "value", "username"]));
        if (!type || !handle || !VALID_HANDLE_TYPES.has(type)) {
          warn(warnings, "user_handles", userId, "nested handle is missing a valid type or handle; skipped");
          continue;
        }
        out.push({ id: rowId(child), user_id: userId, type, handle, created_at: null, updated_at: null });
      }
    }
    for (const [type, keys] of [
      ["codeforces", ["codeforces", "codeforces_handle", "cf_handle", "cfHandle"]],
      ["vjudge", ["vjudge", "vjudge_handle", "vjudgeHandle"]],
      ["atcoder", ["atcoder", "atcoder_handle", "atcoderHandle"]],
    ]) {
      const handle = textOrNull(direct(row, keys));
      if (handle) out.push({ id: null, user_id: userId, type, handle, created_at: null, updated_at: null });
    }
  }

  const byUserAndType = addUnique(out, (row) => `${row.user_id}:${row.type}`);
  const usedHandles = new Set();
  const uniqueHandles = [];
  for (const row of byUserAndType) {
    const key = `${row.type}:${row.handle.toLowerCase()}`;
    if (usedHandles.has(key)) {
      warn(warnings, "user_handles", row.user_id, "duplicate platform handle; skipped");
      continue;
    }
    usedHandles.add(key);
    uniqueHandles.push(row);
  }

  return uniqueHandles;
};

const mapEvents = (rows, warnings) => {
  const out = [];
  for (const row of rows) {
    const id = requiredId(row, "events", warnings);
    if (id === null) continue;

    const title = requiredText(direct(row, ["title", "name"]));
    const startingAt = toEpochSeconds(
      direct(row, ["starting_at", "start_at", "starts_at", "started_at", "startingAt", "startAt"]),
    );
    const endingAt =
      toEpochSeconds(direct(row, ["ending_at", "end_at", "ends_at", "ended_at", "endingAt", "endAt"])) ??
      startingAt;

    if (!title || startingAt === null || endingAt === null) {
      warn(warnings, "events", id, "missing title or start/end time; skipped");
      continue;
    }

    const now = Math.floor(Date.now() / 1000);
    out.push({
      id,
      title,
      description: textOrNull(direct(row, ["description", "details", "body"])) ?? "",
      type: normalizeEventType(direct(row, ["type", "event_type", "eventType"])),
      status: normalizeStatus(row),
      starting_at: startingAt,
      ending_at: endingAt,
      event_link: textOrNull(direct(row, ["event_link", "eventLink", "link", "url"])),
      event_password: textOrNull(direct(row, ["event_password", "eventPassword", "password", "attendance_password"])),
      participation_scope: normalizeScope(
        direct(row, ["participation_scope", "participationScope", "scope"]),
      ),
      open_for_attendance: toBoolInt(
        direct(row, ["open_for_attendance", "openForAttendance", "attendance_open", "attendanceOpen"]),
      ),
      strict_attendance: toBoolInt(
        direct(row, ["strict_attendance", "strictAttendance", "is_strict_attendance"]),
      ),
      created_at: toEpochSeconds(direct(row, ["created_at", "createdAt"])) ?? now,
      updated_at: toEpochSeconds(direct(row, ["updated_at", "updatedAt"])) ?? now,
    });
  }
  return out;
};

const mapTrackers = (rows, warnings) => {
  const out = [];
  const slugs = new Set();
  for (const row of rows) {
    const id = requiredId(row, "trackers", warnings);
    if (id === null) continue;
    const title = requiredText(direct(row, ["title", "name"]));
    if (!title) {
      warn(warnings, "trackers", id, "missing title; skipped");
      continue;
    }
    let slug = slugify(direct(row, ["slug", "key"]), `tracker-${id}`);
    if (slugs.has(slug)) slug = `${slug}-${id}`;
    slugs.add(slug);
    const now = Math.floor(Date.now() / 1000);
    out.push({
      id,
      title,
      description: textOrNull(direct(row, ["description", "details"])) ?? "",
      slug,
      status: normalizeStatus(row),
      created_at: toEpochSeconds(direct(row, ["created_at", "createdAt"])) ?? now,
      updated_at: toEpochSeconds(direct(row, ["updated_at", "updatedAt"])) ?? now,
    });
  }
  return out;
};

const collectRanklistSources = (rows, trackerRows) => {
  const expanded = [...rows];
  for (const tracker of trackerRows) {
    const trackerId = rowId(tracker);
    const nestedRanklists = direct(tracker, ["ranklists", "rank_lists"]);
    if (trackerId !== null && Array.isArray(nestedRanklists)) {
      expanded.push(...nestedRanklists.map((ranklist) => ({ ...ranklist, tracker_id: trackerId })));
    }
  }
  return expanded;
};

const mapRanklists = (rows, warnings) => {
  const out = [];
  for (const row of rows) {
    const id = requiredId(row, "ranklists", warnings);
    const trackerId = toInt(direct(row, ["tracker_id", "trackerId"]));
    const keyword = requiredText(direct(row, ["keyword", "key", "name", "title"]));
    if (id === null || trackerId === null || !keyword) {
      warn(warnings, "ranklists", id, "missing id, tracker_id, or keyword; skipped");
      continue;
    }
    const now = Math.floor(Date.now() / 1000);
    out.push({
      id,
      tracker_id: trackerId,
      keyword,
      description: textOrNull(direct(row, ["description", "details"])) ?? "",
      status: normalizeStatus(row),
      upsolve_weight: normalizeWeight(
        direct(row, [
          "upsolve_weight",
          "upsolveWeight",
          "weight_of_upsolve",
          "weightOfUpsolve",
          "upsolve_ratio",
        ]),
        warnings,
        "ranklists",
        id,
      ),
      is_locked: toBoolInt(direct(row, ["is_locked", "isLocked", "locked"])),
      consider_strict_attendance: toBoolInt(
        direct(row, ["consider_strict_attendance", "considerStrictAttendance"]),
      ),
      created_at: toEpochSeconds(direct(row, ["created_at", "createdAt"])) ?? now,
      updated_at: toEpochSeconds(direct(row, ["updated_at", "updatedAt"])) ?? now,
    });
  }

  return addUnique(out, (row) => String(row.id));
};

const expandRanklistChildren = (ranklistRows, childKeys, idKeys) => {
  const out = [];
  for (const ranklist of ranklistRows) {
    const ranklistId = rowId(ranklist);
    const children = direct(ranklist, childKeys);
    if (ranklistId === null || !Array.isArray(children)) continue;
    for (const child of children) {
      if (isRecord(child)) out.push({ ...child, ranklist_id: ranklistId });
      else out.push({ ranklist_id: ranklistId, [idKeys[0]]: child });
    }
  }
  return out;
};

const expandEventAttendance = (eventRows) => {
  const out = [];
  for (const event of eventRows) {
    const eventId = rowId(event);
    const children = direct(event, ["attendance", "attendances", "attendees"]);
    if (eventId === null || !Array.isArray(children)) continue;
    for (const child of children) {
      if (isRecord(child)) out.push({ ...child, event_id: eventId });
      else out.push({ event_id: eventId, user_id: child });
    }
  }
  return out;
};

const mapRanklistEvents = (rows, ranklistRows, warnings) => {
  const expanded = [
    ...rows,
    ...expandRanklistChildren(ranklistRows, ["events", "ranklist_events"], ["event_id"]),
  ];
  const out = [];
  for (const row of expanded) {
    const ranklistId = toInt(
      nested(row, ["rank_list_id", "rankListId", "ranklist_id", "ranklistId"]),
    );
    const eventId = toInt(nested(row, ["event_id", "eventId", "id"]));
    if (ranklistId === null || eventId === null) {
      warn(warnings, "ranklist_event", rowId(row), "missing ranklist_id or event_id; skipped");
      continue;
    }
    out.push({
      ranklist_id: ranklistId,
      event_id: eventId,
      weight: normalizeWeight(nested(row, ["weight"]), warnings, "ranklist_event", `${ranklistId}:${eventId}`),
    });
  }
  return addUnique(out, (row) => `${row.ranklist_id}:${row.event_id}`);
};

const mapRanklistUsers = (rows, ranklistRows, warnings) => {
  const expanded = [
    ...rows,
    ...expandRanklistChildren(ranklistRows, ["users", "programmers", "ranklist_users"], ["user_id"]),
  ];
  const out = [];
  for (const row of expanded) {
    const ranklistId = toInt(
      nested(row, ["rank_list_id", "rankListId", "ranklist_id", "ranklistId"]),
    );
    const userId = toInt(nested(row, ["user_id", "userId", "programmer_id", "programmerId", "id"]));
    if (ranklistId === null || userId === null) {
      warn(warnings, "ranklist_user", rowId(row), "missing ranklist_id or user_id; skipped");
      continue;
    }
    out.push({ ranklist_id: ranklistId, user_id: userId });
  }
  return addUnique(out, (row) => `${row.ranklist_id}:${row.user_id}`);
};

const mapAttendance = (rows, eventRows, warnings) => {
  const expanded = [...rows, ...expandEventAttendance(eventRows)];
  const out = [];
  for (const row of expanded) {
    const eventId = toInt(nested(row, ["event_id", "eventId"]));
    const userId = toInt(nested(row, ["user_id", "userId", "programmer_id", "programmerId", "id"]));
    if (eventId === null || userId === null) {
      warn(warnings, "event_attendance", rowId(row), "missing event_id or user_id; skipped");
      continue;
    }
    out.push({
      event_id: eventId,
      user_id: userId,
      created_at:
        toEpochSeconds(nested(row, ["created_at", "createdAt", "attended_at", "attendedAt"])) ??
        Math.floor(Date.now() / 1000),
    });
  }
  return addUnique(out, (row) => `${row.event_id}:${row.user_id}`);
};

const buildImport = (payload, options) => {
  const warnings = [];
  const raw = {
    users: findRows(payload, aliases.users),
    userHandles: findRows(payload, aliases.userHandles),
    events: findRows(payload, aliases.events),
    trackers: findRows(payload, aliases.trackers),
    ranklists: findRows(payload, aliases.ranklists),
    ranklistEvents: findRows(payload, aliases.ranklistEvents),
    ranklistUsers: findRows(payload, aliases.ranklistUsers),
    attendance: findRows(payload, aliases.attendance),
  };
  const ranklistSources = collectRanklistSources(raw.ranklists, raw.trackers);

  const rows = {
    users: mapUsers(raw.users, warnings),
    userHandles: null,
    events: mapEvents(raw.events, warnings),
    trackers: mapTrackers(raw.trackers, warnings),
    ranklists: null,
    ranklistEvents: null,
    ranklistUsers: null,
    attendance: null,
  };
  rows.userHandles = mapUserHandles(raw.userHandles, raw.users, warnings);
  rows.ranklists = mapRanklists(ranklistSources, warnings);
  rows.ranklistEvents = mapRanklistEvents(raw.ranklistEvents, ranklistSources, warnings);
  rows.ranklistUsers = mapRanklistUsers(raw.ranklistUsers, ranklistSources, warnings);
  rows.attendance = mapAttendance(raw.attendance, raw.events, warnings);

  const lines = [
    "-- Generated by scripts/import-structure.mjs",
    "-- Structure only: event_performance (solve/upsolve data) is deliberately not imported.",
  ];
  if (options.local) lines.push("BEGIN TRANSACTION;");

  for (const row of rows.users) {
    lines.push(
      insertSql("users", row, ["id"], [
        "name",
        "email",
        "username",
        "student_id",
        "password_hash",
        "image_key",
        "max_cf_rating",
        "created_at",
        "updated_at",
      ]),
    );
  }

  for (const row of rows.userHandles) {
    const payloadRow = {
      user_id: row.user_id,
      type: row.type,
      handle: row.handle,
      created_at: row.created_at ?? Math.floor(Date.now() / 1000),
      updated_at: row.updated_at ?? Math.floor(Date.now() / 1000),
    };
    if (row.id !== null) payloadRow.id = row.id;
    lines.push(insertSql("user_handles", payloadRow, ["user_id", "type"], ["handle", "updated_at"]));
  }

  for (const row of rows.events) {
    lines.push(
      insertSql("events", row, ["id"], [
        "title",
        "description",
        "type",
        "status",
        "starting_at",
        "ending_at",
        "event_link",
        "event_password",
        "participation_scope",
        "open_for_attendance",
        "strict_attendance",
        "created_at",
        "updated_at",
      ]),
    );
  }

  for (const row of rows.trackers) {
    lines.push(
      insertSql("trackers", row, ["id"], [
        "title",
        "description",
        "slug",
        "status",
        "created_at",
        "updated_at",
      ]),
    );
  }

  for (const row of rows.ranklists) {
    lines.push(
      insertSql("ranklists", row, ["id"], [
        "tracker_id",
        "keyword",
        "description",
        "status",
        "upsolve_weight",
        "is_locked",
        "consider_strict_attendance",
        "created_at",
        "updated_at",
      ]),
    );
  }

  for (const row of rows.ranklistEvents) {
    lines.push(insertSql("ranklist_event", row, ["ranklist_id", "event_id"], ["weight"]));
  }

  for (const row of rows.ranklistUsers) {
    lines.push(insertSql("ranklist_user", row, ["ranklist_id", "user_id"], []));
  }

  for (const row of rows.attendance) {
    lines.push(
      insertSql("event_attendance", row, ["event_id", "user_id"], ["created_at"]),
    );
  }

  if (options.local) lines.push("COMMIT;");
  lines.push("");

  return {
    rawCounts: Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value.length])),
    rowCounts: Object.fromEntries(Object.entries(rows).map(([key, value]) => [key, value.length])),
    sql: lines.join("\n"),
    warnings,
  };
};

const writeSql = (sql, outPath) => {
  const path = resolve(outPath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, sql);
  return path;
};

const runWrangler = (sqlPath, options) => {
  const args = [
    "d1",
    "execute",
    options.database,
    options.local ? "--local" : "--remote",
    "--file",
    sqlPath,
  ];
  const result = spawnSync("wrangler", args, { stdio: "inherit" });
  if (result.error) fail(`could not run wrangler: ${result.error.message}`);
  if (result.status !== 0) fail(`wrangler exited with status ${result.status}`);
};

const printSummary = (result, sqlPath, options) => {
  console.log("Import SQL generated:", sqlPath);
  console.log("Rows prepared:");
  for (const [key, count] of Object.entries(result.rowCounts)) {
    console.log(`  ${key}: ${count}`);
  }
  if (result.warnings.length > 0) {
    console.log("Warnings:");
    for (const item of result.warnings.slice(0, 100)) {
      console.log(`  [${item.table}:${item.sourceId}] ${item.message}`);
    }
    if (result.warnings.length > 100) {
      console.log(`  ... ${result.warnings.length - 100} more warnings`);
    }
  }

  if (options.dryRun) {
    console.log("Dry run complete. No D1 changes were made.");
  }
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const payload = await loadJson(options);
  const result = buildImport(payload, options);

  const tempDir = options.out ? null : mkdtempSync(resolve(tmpdir(), "diuacm-import-"));
  const sqlPath = writeSql(result.sql, options.out ?? `${tempDir}/import.sql`);
  printSummary(result, sqlPath, options);

  if (!options.dryRun) {
    runWrangler(sqlPath, options);
    console.log(`Imported into ${options.local ? "local" : "remote"} D1 database ${options.database}.`);
  }

  if (!options.out && tempDir) rmSync(tempDir, { force: true, recursive: true });
};

main().catch((error) => fail(error?.message ?? String(error)));
