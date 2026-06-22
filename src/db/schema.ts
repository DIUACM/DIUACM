import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  // Stored lowercased (normalized in the route handlers).
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  // Optional. SQLite allows multiple NULLs in a UNIQUE column, so this can be
  // both nullable and unique.
  studentId: text("student_id").unique(),
  passwordHash: text("password_hash").notNull(),
  // Unix epoch seconds (UTC). `updatedAt` is bumped by the profile-update handler.
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at")
    .notNull()
    .default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
