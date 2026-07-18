import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  // Stored lowercased (normalized in the route handlers).
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  // Optional. SQLite allows multiple NULLs in a UNIQUE column, so this can be
  // both nullable and unique.
  studentId: text("student_id").unique(),
  // Nullable: users who sign in with Google have no password of their own.
  passwordHash: text("password_hash"),
  // R2 object key for the profile image (null if none). Served via GET /files/:key.
  imageKey: text("image_key"),
  // Highest Codeforces rating reached. Null until populated (by a future CF sync).
  maxCfRating: integer("max_cf_rating"),
  // Unix epoch seconds (UTC). `updatedAt` is bumped by the profile-update handler.
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

// Admin-panel permissions. Access control is permission-based: a user may hold
// any subset of these. The super admin (email matches SUPER_ADMIN_EMAIL in
// wrangler.jsonc) implicitly holds all of them.
export const PERMISSIONS = [
  "manage_users",
  "manage_events",
  "manage_attendance",
  "manage_trackers",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const userPermissions = sqliteTable(
  "user_permissions",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permission: text("permission", { enum: PERMISSIONS }).notNull(),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.permission] }),
    index("user_permissions_user_id_idx").on(t.userId),
  ],
);

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    type: text("type", { enum: ["contest", "class", "other"] })
      .notNull()
      .default("other"),
    status: text("status", { enum: ["published", "draft"] })
      .notNull()
      .default("draft"),
    // Unix epoch seconds (UTC).
    startingAt: integer("starting_at").notNull(),
    endingAt: integer("ending_at").notNull(),
    eventLink: text("event_link"),
    // Plaintext (intentionally not hashed). NEVER returned by read endpoints —
    // only compared inside the attendance handler.
    eventPassword: text("event_password"),
    participationScope: text("participation_scope", {
      enum: ["open_for_all", "only_girls", "junior_programmers", "selected_persons"],
    })
      .notNull()
      .default("open_for_all"),
    openForAttendance: integer("open_for_attendance", { mode: "boolean" })
      .notNull()
      .default(false),
    strictAttendance: integer("strict_attendance", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index("events_type_idx").on(t.type),
    index("events_scope_idx").on(t.participationScope),
    index("events_status_idx").on(t.status),
    index("events_starting_at_idx").on(t.startingAt),
  ],
);

export const eventMedia = sqliteTable(
  "event_media",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["image", "video"] }).notNull(),
    // R2 object key; served via GET /files/:key.
    key: text("key").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("event_media_event_id_idx").on(t.eventId)],
);

export const eventAttendance = sqliteTable(
  "event_attendance",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Attendance timestamp — Unix epoch seconds (UTC).
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex("event_attendance_event_user_unique").on(t.eventId, t.userId),
    index("event_attendance_event_id_idx").on(t.eventId),
    index("event_attendance_user_id_idx").on(t.userId),
  ],
);

export const eventPerformance = sqliteTable(
  "event_performance",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Nullable — a performance row may exist without a position; these sort last.
    // This is the user's standing within the single event (contest).
    position: integer("position"),
    solveCount: integer("solve_count").notNull().default(0),
    upsolveCount: integer("upsolve_count").notNull().default(0),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex("event_performance_event_user_unique").on(t.eventId, t.userId),
    index("event_performance_event_id_idx").on(t.eventId),
    index("event_performance_user_id_idx").on(t.userId),
  ],
);

export const trackers = sqliteTable(
  "trackers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    slug: text("slug").notNull().unique(),
    status: text("status", { enum: ["published", "draft"] })
      .notNull()
      .default("draft"),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("trackers_status_idx").on(t.status)],
);

export const ranklists = sqliteTable(
  "ranklists",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    trackerId: integer("tracker_id")
      .notNull()
      .references(() => trackers.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    description: text("description").notNull().default(""),
    status: text("status", { enum: ["published", "draft"] })
      .notNull()
      .default("draft"),
    upsolveWeight: real("upsolve_weight").notNull().default(0),
    isLocked: integer("is_locked", { mode: "boolean" }).notNull().default(false),
    considerStrictAttendance: integer("consider_strict_attendance", { mode: "boolean" })
      .notNull()
      .default(false),
    // When true, SQLite triggers keep membership in sync with participation: any user
    // with performance/attendance on an attached event is auto-added (auto_added = 1)
    // and auto-removed when their participation disappears.
    autoAddUsers: integer("auto_add_users", { mode: "boolean" }).notNull().default(false),
    // Maintained by SQLite triggers on ranklist_user / ranklist_event — never
    // write these directly from application code.
    userCount: integer("user_count").notNull().default(0),
    eventCount: integer("event_count").notNull().default(0),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    uniqueIndex("ranklists_tracker_keyword_unique").on(t.trackerId, t.keyword),
    index("ranklists_tracker_id_idx").on(t.trackerId),
    index("ranklists_status_idx").on(t.status),
    check(
      "ranklists_upsolve_weight_range",
      sql`${t.upsolveWeight} >= 0 AND ${t.upsolveWeight} <= 1`,
    ),
  ],
);

export const ranklistEvents = sqliteTable(
  "ranklist_event",
  {
    ranklistId: integer("ranklist_id")
      .notNull()
      .references(() => ranklists.id, { onDelete: "cascade" }),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    weight: real("weight").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.ranklistId, t.eventId] }),
    index("ranklist_event_event_id_idx").on(t.eventId),
    check("ranklist_event_weight_range", sql`${t.weight} >= 0 AND ${t.weight} <= 1`),
  ],
);

export const ranklistUsers = sqliteTable(
  "ranklist_user",
  {
    ranklistId: integer("ranklist_id")
      .notNull()
      .references(() => ranklists.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Maintained by SQLite triggers (see the score-triggers migration) — never write
    // these directly from application code. `score` is the weighted solve/upsolve sum;
    // `rank` is the competition rank within the ranklist (1 = highest score).
    score: real("score").notNull().default(0),
    rank: integer("rank").notNull().default(0),
    // 1 = added by the auto-add triggers (removable by them); 0 = added manually by an
    // admin (never auto-removed). An explicit admin add resets it to 0.
    autoAdded: integer("auto_added", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.ranklistId, t.userId] }),
    index("ranklist_user_user_id_idx").on(t.userId),
  ],
);

export const userHandles = sqliteTable(
  "user_handles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["codeforces", "vjudge", "atcoder"] }).notNull(),
    handle: text("handle").notNull(),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    // A user can have at most one handle per platform.
    uniqueIndex("user_handles_user_type_unique").on(t.userId, t.type),
    // A handle value is unique within its platform (no two users share it).
    uniqueIndex("user_handles_type_handle_unique").on(t.type, t.handle),
    index("user_handles_user_id_idx").on(t.userId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  attendance: many(eventAttendance),
  performance: many(eventPerformance),
  ranklists: many(ranklistUsers),
  handles: many(userHandles),
  permissions: many(userPermissions),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, { fields: [userPermissions.userId], references: [users.id] }),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  media: many(eventMedia),
  attendance: many(eventAttendance),
  performance: many(eventPerformance),
  ranklists: many(ranklistEvents),
}));

export const eventMediaRelations = relations(eventMedia, ({ one }) => ({
  event: one(events, { fields: [eventMedia.eventId], references: [events.id] }),
}));

export const eventAttendanceRelations = relations(eventAttendance, ({ one }) => ({
  event: one(events, { fields: [eventAttendance.eventId], references: [events.id] }),
  user: one(users, { fields: [eventAttendance.userId], references: [users.id] }),
}));

export const eventPerformanceRelations = relations(eventPerformance, ({ one }) => ({
  event: one(events, { fields: [eventPerformance.eventId], references: [events.id] }),
  user: one(users, { fields: [eventPerformance.userId], references: [users.id] }),
}));

export const trackersRelations = relations(trackers, ({ many }) => ({
  ranklists: many(ranklists),
}));

export const ranklistsRelations = relations(ranklists, ({ one, many }) => ({
  tracker: one(trackers, { fields: [ranklists.trackerId], references: [trackers.id] }),
  events: many(ranklistEvents),
  users: many(ranklistUsers),
}));

export const ranklistEventsRelations = relations(ranklistEvents, ({ one }) => ({
  ranklist: one(ranklists, { fields: [ranklistEvents.ranklistId], references: [ranklists.id] }),
  event: one(events, { fields: [ranklistEvents.eventId], references: [events.id] }),
}));

export const ranklistUsersRelations = relations(ranklistUsers, ({ one }) => ({
  ranklist: one(ranklists, { fields: [ranklistUsers.ranklistId], references: [ranklists.id] }),
  user: one(users, { fields: [ranklistUsers.userId], references: [users.id] }),
}));

export const userHandlesRelations = relations(userHandles, ({ one }) => ({
  user: one(users, { fields: [userHandles.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventMedia = typeof eventMedia.$inferSelect;
export type EventAttendance = typeof eventAttendance.$inferSelect;
export type EventPerformance = typeof eventPerformance.$inferSelect;
export type Tracker = typeof trackers.$inferSelect;
export type NewTracker = typeof trackers.$inferInsert;
export type Ranklist = typeof ranklists.$inferSelect;
export type NewRanklist = typeof ranklists.$inferInsert;
export type RanklistEvent = typeof ranklistEvents.$inferSelect;
export type RanklistUser = typeof ranklistUsers.$inferSelect;
export type UserHandle = typeof userHandles.$inferSelect;
export type NewUserHandle = typeof userHandles.$inferInsert;
export type UserPermission = typeof userPermissions.$inferSelect;
