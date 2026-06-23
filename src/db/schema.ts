import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
  // Unix epoch seconds (UTC). `updatedAt` is bumped by the profile-update handler.
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

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
    rank: integer("rank").notNull(),
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

export const usersRelations = relations(users, ({ many }) => ({
  attendance: many(eventAttendance),
  performance: many(eventPerformance),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  media: many(eventMedia),
  attendance: many(eventAttendance),
  performance: many(eventPerformance),
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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventMedia = typeof eventMedia.$inferSelect;
export type EventAttendance = typeof eventAttendance.$inferSelect;
export type EventPerformance = typeof eventPerformance.$inferSelect;
