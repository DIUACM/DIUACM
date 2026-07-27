import { z } from "zod";

import { PERMISSIONS } from "../db/schema";
import { pageFields } from "../lib/pagination";
import { EVENT_SCOPES, EVENT_TYPES } from "./events";

export const PUBLISH_STATUSES = ["published", "draft"] as const;

// Shared field fragments, kept identical to the public auth schemas.
const nameField = z.string().trim().min(1).max(100);
const usernameField = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores");
const passwordField = z.string().min(8).max(128);
const studentIdField = z.string().trim().min(1).max(20);
const descriptionField = z.string().max(10000);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const adminUsersListQuery = z.object({
  ...pageFields,
  // Searches name / username / email / student id.
  q: z.string().trim().min(1).max(100).optional(),
  // Only users granted this permission.
  permission: z.enum(PERMISSIONS).optional(),
});

export const adminUserCreateSchema = z.object({
  name: nameField,
  email: z.email(),
  username: usernameField,
  // Omitted → the account has no password (Google sign-in only).
  password: passwordField.optional(),
  studentId: studentIdField.optional(),
  maxCfRating: z.number().int().nullable().optional(),
});

export const adminUserUpdateSchema = z.object({
  name: nameField.optional(),
  email: z.email().optional(),
  username: usernameField.optional(),
  // `null` removes the password (making the account Google sign-in only).
  password: passwordField.nullable().optional(),
  studentId: studentIdField.nullable().optional(),
  maxCfRating: z.number().int().nullable().optional(),
});

// Path param for the toggle endpoint (PUT /admin/users/:id/permissions/:permission).
export const permissionParam = z.object({
  permission: z.enum(PERMISSIONS),
});

// `enabled: true` grants the permission, `false` revokes it. Idempotent both ways.
export const permissionToggleSchema = z.object({
  enabled: z.boolean(),
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const adminEventsListQuery = z.object({
  ...pageFields,
  type: z.enum(EVENT_TYPES).optional(),
  scope: z.enum(EVENT_SCOPES).optional(),
  status: z.enum(PUBLISH_STATUSES).optional(),
  // Searches title / description / event link.
  q: z.string().trim().min(1).max(100).optional(),
});

export const adminEventCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: descriptionField.optional(),
  type: z.enum(EVENT_TYPES).optional(),
  status: z.enum(PUBLISH_STATUSES).optional(),
  startingAt: z.number().int().min(0),
  endingAt: z.number().int().min(0),
  eventLink: z.url().max(500).nullable().optional(),
  eventPassword: z.string().min(1).max(200).nullable().optional(),
  participationScope: z.enum(EVENT_SCOPES).optional(),
  openForAttendance: z.boolean().optional(),
  strictAttendance: z.boolean().optional(),
});

export const adminEventUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: descriptionField.optional(),
  type: z.enum(EVENT_TYPES).optional(),
  status: z.enum(PUBLISH_STATUSES).optional(),
  startingAt: z.number().int().min(0).optional(),
  endingAt: z.number().int().min(0).optional(),
  eventLink: z.url().max(500).nullable().optional(),
  eventPassword: z.string().min(1).max(200).nullable().optional(),
  participationScope: z.enum(EVENT_SCOPES).optional(),
  openForAttendance: z.boolean().optional(),
  strictAttendance: z.boolean().optional(),
});

export const adminAttendanceAddSchema = z.object({
  userId: z.number().int().min(1),
});

// PUT semantics: the row is fully replaced, so omitted fields fall back to
// these defaults rather than keeping their previous values.
export const adminPerformanceSetSchema = z.object({
  position: z.number().int().min(1).nullable().default(null),
  solveCount: z.number().int().min(0).default(0),
  upsolveCount: z.number().int().min(0).default(0),
});

// ---------------------------------------------------------------------------
// Trackers & ranklists
// ---------------------------------------------------------------------------

export const adminTrackersListQuery = z.object({
  ...pageFields,
  status: z.enum(PUBLISH_STATUSES).optional(),
  // Searches title / slug.
  q: z.string().trim().min(1).max(100).optional(),
});

const slugField = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens");

export const adminTrackerCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: descriptionField.optional(),
  slug: slugField,
  status: z.enum(PUBLISH_STATUSES).optional(),
});

export const adminTrackerUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: descriptionField.optional(),
  slug: slugField.optional(),
  status: z.enum(PUBLISH_STATUSES).optional(),
});

// Keyword appears in the public URL path (/trackers/:slug/:keyword), so keep
// it URL-safe.
const keywordField = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, underscores, and hyphens");

export const adminRanklistCreateSchema = z.object({
  keyword: keywordField,
  description: descriptionField.optional(),
  status: z.enum(PUBLISH_STATUSES).optional(),
  upsolveWeight: z.number().min(0).max(1).optional(),
  isLocked: z.boolean().optional(),
  considerStrictAttendance: z.boolean().optional(),
  autoAddUsers: z.boolean().optional(),
});

export const adminRanklistUpdateSchema = z.object({
  keyword: keywordField.optional(),
  description: descriptionField.optional(),
  status: z.enum(PUBLISH_STATUSES).optional(),
  upsolveWeight: z.number().min(0).max(1).optional(),
  isLocked: z.boolean().optional(),
  considerStrictAttendance: z.boolean().optional(),
  autoAddUsers: z.boolean().optional(),
});

export const adminRanklistEventSetSchema = z.object({
  weight: z.number().min(0).max(1),
});

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export const adminGalleryListQuery = z.object({
  ...pageFields,
  status: z.enum(PUBLISH_STATUSES).optional(),
  // Searches title / slug.
  q: z.string().trim().min(1).max(100).optional(),
});

export const adminGalleryAlbumCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: descriptionField.optional(),
  slug: slugField,
  status: z.enum(PUBLISH_STATUSES).optional(),
});

export const adminGalleryAlbumUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: descriptionField.optional(),
  slug: slugField.optional(),
  status: z.enum(PUBLISH_STATUSES).optional(),
});

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

// Post bodies can be much longer than the shared description field.
const blogContentField = z.string().max(100000);

export const adminBlogListQuery = z.object({
  ...pageFields,
  status: z.enum(PUBLISH_STATUSES).optional(),
  // Searches title / slug.
  q: z.string().trim().min(1).max(100).optional(),
});

export const adminBlogPostCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: slugField,
  content: blogContentField.optional(),
  status: z.enum(PUBLISH_STATUSES).optional(),
});

export const adminBlogPostUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  slug: slugField.optional(),
  content: blogContentField.optional(),
  status: z.enum(PUBLISH_STATUSES).optional(),
});

// Explicit order values per row (not a full ordering), so partial pages can
// swap neighbours without knowing the whole collection.
export const adminReorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        order: z.number().int().min(0),
      }),
    )
    .min(1)
    .max(200),
});

// ---------------------------------------------------------------------------
// Bulk actions
// ---------------------------------------------------------------------------

// D1 allows at most 100 bound parameters per statement. Some scoped bulk
// queries bind an owning resource id as well, so leave room below that ceiling.
const bulkIdsField = z.array(z.number().int().positive()).min(1).max(90);

// Bulk endpoints whose only action is removal take the ids alone.
export const adminBulkIdsSchema = z.object({ ids: bulkIdsField });

// Shared by every top-level publishable resource (events, trackers, gallery
// albums, blog posts).
export const adminBulkPublishSchema = z.object({
  ids: bulkIdsField,
  action: z.enum(["publish", "draft", "delete"]),
});

export const adminRanklistBulkSchema = z.object({
  ids: bulkIdsField,
  action: z.enum(["publish", "draft", "lock", "unlock", "delete"]),
});

export const adminRanklistEventBulkSchema = z.object({
  ids: bulkIdsField,
  action: z.enum(["detach", "set-weight"]),
  // Required by "set-weight"; the route rejects the combination when missing.
  weight: z.number().min(0).max(1).optional(),
});

// ---------------------------------------------------------------------------
// System health
// ---------------------------------------------------------------------------

export const adminSystemRunsQuery = z.object({
  ...pageFields,
  // Unconstrained rather than z.enum(JOB_NAMES): the ledger keeps runs under
  // whatever name recorded them, so filtering has to stay able to reach rows
  // written by a job that has since been renamed or removed.
  job: z.string().trim().min(1).max(64).optional(),
  status: z.enum(["ok", "degraded", "crashed"]).optional(),
});

// Fault keys are structured ("codeforces:paging-truncated"), not numeric ids.
export const adminNoticeKeyParam = z.object({
  key: z.string().trim().min(1).max(200),
});
