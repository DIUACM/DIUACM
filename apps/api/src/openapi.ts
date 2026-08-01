import { z } from "zod";

import { PERMISSIONS, type Permission } from "./db/schema";
import {
  adminAttendanceAddSchema,
  adminBlogPostCreateSchema,
  adminBlogPostUpdateSchema,
  adminBulkIdsSchema,
  adminBulkPublishSchema,
  adminEventCreateSchema,
  adminEventUpdateSchema,
  adminGalleryAlbumCreateSchema,
  adminGalleryAlbumUpdateSchema,
  adminPerformanceSetSchema,
  adminRanklistBulkSchema,
  adminRanklistCreateSchema,
  adminRanklistEventBulkSchema,
  adminRanklistEventSetSchema,
  adminRanklistUpdateSchema,
  adminReorderSchema,
  adminTrackerCreateSchema,
  adminTrackerUpdateSchema,
  adminUserCreateSchema,
  adminUserUpdateSchema,
  permissionToggleSchema,
} from "./schemas/admin";
import { googleSignInSchema, loginSchema, profileUpdateSchema } from "./schemas/auth";
import { RUN_RETENTION_DAYS } from "./sync/runs";
import { attendanceGiveSchema } from "./schemas/events";
import { handleSetSchema } from "./schemas/handles";

// Request bodies are derived from the same Zod schemas the routes validate
// against (via `z.toJSONSchema`) so the docs can't drift from validation.
// Response shapes are authored by hand. Output targets JSON Schema 2020-12,
// which is what OpenAPI 3.1 uses.
const toSchema = (s: z.ZodType) => z.toJSONSchema(s);

const jsonBody = (schema: unknown) => ({ "application/json": { schema } });
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const binaryBody = (...contentTypes: string[]) =>
  Object.fromEntries(
    contentTypes.map((ct) => [ct, { schema: { type: "string", format: "binary" } }]),
  );

const epoch = (description: string) => ({ type: "integer", description });

// ---------------------------------------------------------------------------
// Access markers — every operation declares who may call it. Produces the
// Scalar-rendered `x-badges` chip next to the summary, the `security` field,
// and an "**Access:**" line opening the description. Levels:
//   "public"       — no authentication
//   "user"         — any signed-in user
//   a permission   — signed-in user granted that permission (super admin passes)
//   "super-admin"  — only the super admin (SUPER_ADMIN_EMAIL)
// ---------------------------------------------------------------------------

type AccessLevel = "public" | "user" | "super-admin" | Permission;

const access = (level: AccessLevel, description?: string) => {
  const badge = (name: string, color: string) => [{ name, color, position: "after" }];
  let fields: { security?: unknown; "x-badges": unknown; note: string };
  if (level === "public") {
    fields = {
      "x-badges": badge("Public", "#16a34a"),
      note: "**Access:** `Public` — No authentication required.",
    };
  } else if (level === "user") {
    fields = {
      security: [{ bearerAuth: [] }],
      "x-badges": badge("User", "#2563eb"),
      note: "**Access:** `User` — Requires a bearer token (`Authorization: Bearer <token>`).",
    };
  } else if (level === "super-admin") {
    fields = {
      security: [{ bearerAuth: [] }],
      "x-badges": badge("super admin", "#7c3aed"),
      note:
        "**Access:** `Super admin` — Requires a bearer token for the super admin " +
        "(the account whose email matches `SUPER_ADMIN_EMAIL`).",
    };
  } else {
    fields = {
      security: [{ bearerAuth: [] }],
      "x-badges": badge(level, "#dc2626"),
      note:
        `**Access:** \`${level}\` — Requires a bearer token for a user granted the ` +
        `\`${level}\` permission. The super admin always passes.`,
    };
  }
  const { note, ...rest } = fields;
  return { ...rest, description: description ? `${note}\n\n${description}` : note };
};

const userSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    email: { type: "string", format: "email" },
    username: { type: "string" },
    studentId: {
      type: ["string", "null"],
      description: "Optional DIU student id, or null if not set.",
    },
    image: {
      type: ["string", "null"],
      format: "uri",
      description: "Absolute URL to the profile image, or null if none is set.",
    },
    maxCfRating: {
      type: ["integer", "null"],
      description: "Highest Codeforces rating reached, or null if not set.",
    },
    permissions: {
      type: "array",
      items: ref("Permission"),
      description:
        "Effective admin-panel permissions. The super admin always reports all of them.",
    },
    isSuperAdmin: {
      type: "boolean",
      description: "True when this user's email matches the configured `SUPER_ADMIN_EMAIL`.",
    },
    createdAt: epoch("Unix epoch seconds (UTC)."),
    updatedAt: epoch("Unix epoch seconds (UTC)."),
  },
  required: [
    "id",
    "name",
    "email",
    "username",
    "studentId",
    "image",
    "maxCfRating",
    "permissions",
    "isSuperAdmin",
    "createdAt",
    "updatedAt",
  ],
};

const permissionSchema = {
  type: "string",
  enum: [...PERMISSIONS],
  description: "An admin-panel permission.",
};

const userSummarySchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    username: { type: "string" },
    image: { type: ["string", "null"], format: "uri" },
  },
  required: ["id", "name", "username", "image"],
};

const authResponseSchema = {
  type: "object",
  properties: {
    token: {
      type: "string",
      description: "JWT — send as `Authorization: Bearer <token>`.",
    },
    user: ref("User"),
  },
  required: ["token", "user"],
};

const userResponseSchema = {
  type: "object",
  properties: { user: ref("User") },
  required: ["user"],
};

const authConfigSchema = {
  type: "object",
  properties: {
    googleClientId: {
      type: "string",
      description: "Google OAuth client id, for initializing Google Sign-In on the frontend.",
    },
  },
  required: ["googleClientId"],
};

const errorSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
    issues: {
      type: "array",
      description: "Field-level details, present on validation failures.",
      items: {
        type: "object",
        properties: { field: { type: "string" }, message: { type: "string" } },
        required: ["field", "message"],
      },
    },
  },
  required: ["error"],
};

const healthSchema = {
  type: "object",
  properties: {
    status: { type: "string", examples: ["ok"] },
    timestamp: epoch("Unix epoch seconds (UTC)."),
  },
  required: ["status", "timestamp"],
};

const imageUploadSchema = {
  type: "object",
  properties: {
    image: {
      type: "string",
      format: "binary",
      description: "PNG, JPEG, GIF, or WebP — max 5 MB.",
    },
  },
  required: ["image"],
};

const paginationMetaSchema = {
  type: "object",
  properties: {
    page: { type: "integer" },
    perPage: { type: "integer" },
    total: { type: "integer" },
    totalPages: { type: "integer" },
  },
  required: ["page", "perPage", "total", "totalPages"],
};

// Public event fields (no `eventPassword`). EventDetail extends this with media.
const eventCoreProps = {
  id: { type: "integer" },
  title: { type: "string" },
  description: { type: "string" },
  type: { type: "string", enum: ["contest", "class", "other"] },
  status: { type: "string", enum: ["published", "draft"] },
  startingAt: epoch("Unix epoch seconds (UTC)."),
  endingAt: epoch("Unix epoch seconds (UTC)."),
  eventLink: { type: ["string", "null"] },
  participationScope: {
    type: "string",
    enum: ["open_for_all", "only_girls", "junior_programmers", "selected_persons"],
  },
  openForAttendance: { type: "boolean" },
  strictAttendance: { type: "boolean" },
  attendanceCount: {
    type: "integer",
    description: "Number of attendance rows, maintained by database triggers.",
  },
  performanceCount: {
    type: "integer",
    description: "Number of performance rows, maintained by database triggers.",
  },
  createdAt: epoch("Unix epoch seconds (UTC)."),
  updatedAt: epoch("Unix epoch seconds (UTC)."),
};
const eventCoreRequired = Object.keys(eventCoreProps);

const eventListItemSchema = {
  type: "object",
  properties: eventCoreProps,
  required: eventCoreRequired,
};

const eventMediaSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    type: { type: "string", enum: ["image", "video"] },
    url: { type: ["string", "null"], format: "uri", description: "Absolute URL to the object." },
  },
  required: ["id", "type", "url"],
};

const eventDetailSchema = {
  type: "object",
  properties: { ...eventCoreProps, media: { type: "array", items: ref("EventMedia") } },
  required: [...eventCoreRequired, "media"],
};

const eventListSchema = {
  type: "object",
  properties: { data: { type: "array", items: ref("EventListItem") }, meta: ref("PaginationMeta") },
  required: ["data", "meta"],
};

const attendanceSchema = {
  type: "object",
  properties: {
    attendedAt: epoch("Unix epoch seconds (UTC)."),
    user: { oneOf: [ref("UserSummary"), { type: "null" }] },
  },
  required: ["attendedAt", "user"],
};

const attendanceListSchema = {
  type: "object",
  properties: { data: { type: "array", items: ref("Attendance") } },
  required: ["data"],
};

const attendanceResultSchema = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    attendedAt: epoch("When the attendance was recorded (Unix epoch seconds, UTC)."),
  },
  required: ["ok", "attendedAt"],
};

const performanceSchema = {
  type: "object",
  properties: {
    position: {
      type: ["integer", "null"],
      description: "Standing in the event; null when unranked (those rows sort last).",
    },
    solveCount: { type: "integer" },
    upsolveCount: { type: "integer" },
    user: ref("UserSummary"),
  },
  required: ["position", "solveCount", "upsolveCount", "user"],
};

const performanceListSchema = {
  type: "object",
  properties: { data: { type: "array", items: ref("Performance") } },
  required: ["data"],
};

const trackerSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    slug: { type: "string" },
  },
  required: ["title", "description", "slug"],
};

const trackerListSchema = {
  type: "object",
  properties: { data: { type: "array", items: ref("Tracker") }, meta: ref("PaginationMeta") },
  required: ["data", "meta"],
};

const ranklistSummarySchema = {
  type: "object",
  properties: {
    keyword: { type: "string" },
    userCount: { type: "integer" },
    eventCount: { type: "integer" },
    upsolveWeight: { type: "number", description: "0.00–1.00." },
    isLocked: { type: "boolean" },
    considerStrictAttendance: { type: "boolean" },
    autoAddUsers: { type: "boolean" },
  },
  required: [
    "keyword",
    "userCount",
    "eventCount",
    "upsolveWeight",
    "isLocked",
    "considerStrictAttendance",
    "autoAddUsers",
  ],
};

const trackerDetailSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    slug: { type: "string" },
    ranklists: { type: "array", items: ref("RanklistSummary") },
  },
  required: ["title", "description", "slug", "ranklists"],
};

const ranklistEventEntrySchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    title: { type: "string" },
    startingAt: epoch("Unix epoch seconds (UTC)."),
    weight: { type: "number", description: "This event's weight in the ranklist (0.00–1.00)." },
  },
  required: ["id", "title", "startingAt", "weight"],
};

const ranklistUserPerformanceSchema = {
  type: "object",
  properties: {
    eventId: { type: "integer" },
    position: { type: ["integer", "null"], description: "Standing in this event; null when unranked." },
    solveCount: { type: "integer" },
    upsolveCount: { type: "integer" },
  },
  required: ["eventId", "position", "solveCount", "upsolveCount"],
};

const ranklistStandingSchema = {
  type: "object",
  properties: {
    user: ref("UserSummary"),
    score: { type: "number" },
    rank: { type: "integer", description: "Competition rank within the ranklist (1 = top)." },
    performance: { type: "array", items: ref("RanklistUserPerformance") },
  },
  required: ["user", "score", "rank", "performance"],
};

const ranklistStandingsSchema = {
  type: "object",
  properties: {
    keyword: { type: "string" },
    events: { type: "array", items: ref("RanklistEventEntry") },
    users: { type: "array", items: ref("RanklistStanding") },
  },
  required: ["keyword", "events", "users"],
};

const handleEntrySchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    handle: { type: "string" },
  },
  required: ["id", "handle"],
};

const handlesMapSchema = {
  type: "object",
  description:
    "A user's handles grouped by platform. VJudge may contain multiple entries; " +
    "Codeforces and AtCoder contain at most one.",
  properties: {
    codeforces: { type: "array", items: ref("HandleEntry"), maxItems: 1 },
    vjudge: { type: "array", items: ref("HandleEntry") },
    atcoder: { type: "array", items: ref("HandleEntry"), maxItems: 1 },
  },
  required: ["codeforces", "vjudge", "atcoder"],
};

const handlesResponseSchema = {
  type: "object",
  properties: {
    handles: ref("HandlesMap"),
    maxCfRating: {
      type: ["integer", "null"],
      description: "The user's highest Codeforces rating, or null when unrated or unlinked.",
    },
  },
  required: ["handles", "maxCfRating"],
};

const programmerListItemSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    username: { type: "string" },
    image: { type: ["string", "null"], format: "uri" },
    maxCfRating: { type: ["integer", "null"] },
    handles: ref("HandlesMap"),
  },
  required: ["id", "name", "username", "image", "maxCfRating", "handles"],
};

const programmerListSchema = {
  type: "object",
  properties: {
    data: { type: "array", items: ref("ProgrammerListItem") },
    meta: ref("PaginationMeta"),
  },
  required: ["data", "meta"],
};

const trackerPerformanceRanklistSchema = {
  type: "object",
  properties: {
    keyword: { type: "string" },
    userCount: { type: "integer", description: "Total users in the ranklist." },
    eventCount: { type: "integer", description: "Number of events in the ranklist." },
    score: { type: "number", description: "This user's score in the ranklist." },
    rank: { type: "integer", description: "This user's rank in the ranklist (1 = top)." },
  },
  required: ["keyword", "userCount", "eventCount", "score", "rank"],
};

const trackerPerformanceEntrySchema = {
  type: "object",
  properties: {
    tracker: {
      type: "object",
      properties: { title: { type: "string" }, slug: { type: "string" } },
      required: ["title", "slug"],
    },
    ranklists: { type: "array", items: ref("TrackerPerformanceRanklist") },
  },
  required: ["tracker", "ranklists"],
};

const programmerDetailSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    username: { type: "string" },
    image: { type: ["string", "null"], format: "uri" },
    maxCfRating: { type: ["integer", "null"] },
    handles: ref("HandlesMap"),
    trackerPerformance: { type: "array", items: ref("TrackerPerformanceEntry") },
  },
  required: ["id", "name", "username", "image", "maxCfRating", "handles", "trackerPerformance"],
};

const galleryAlbumListItemSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    title: { type: "string" },
    description: { type: "string" },
    slug: { type: "string" },
    coverUrl: {
      type: ["string", "null"],
      format: "uri",
      description: "Absolute URL to the album's first image, or null when empty.",
    },
    mediaCount: { type: "integer" },
  },
  required: ["id", "title", "description", "slug", "coverUrl", "mediaCount"],
};

const galleryAlbumListSchema = {
  type: "object",
  properties: {
    data: { type: "array", items: ref("GalleryAlbumListItem") },
    meta: ref("PaginationMeta"),
  },
  required: ["data", "meta"],
};

const galleryMediaSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    url: { type: ["string", "null"], format: "uri", description: "Absolute URL to the image." },
  },
  required: ["id", "url"],
};

const galleryAlbumDetailSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    title: { type: "string" },
    description: { type: "string" },
    slug: { type: "string" },
    media: { type: "array", items: ref("GalleryMedia") },
  },
  required: ["id", "title", "description", "slug", "media"],
};

const blogPostListItemSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    title: { type: "string" },
    slug: { type: "string" },
    excerpt: { type: "string", description: "Plain-text preview of the body (~240 chars)." },
    featuredImageUrl: { type: ["string", "null"], format: "uri" },
    publishedAt: {
      type: ["integer", "null"],
      description: "Unix epoch seconds (UTC); set when the post was first published.",
    },
    author: { oneOf: [ref("UserSummary"), { type: "null" }] },
  },
  required: ["id", "title", "slug", "excerpt", "featuredImageUrl", "publishedAt", "author"],
};

const blogPostListSchema = {
  type: "object",
  properties: {
    data: { type: "array", items: ref("BlogPostListItem") },
    meta: ref("PaginationMeta"),
  },
  required: ["data", "meta"],
};

const blogPostDetailSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    title: { type: "string" },
    slug: { type: "string" },
    content: { type: "string", description: "Full post body (Markdown/plain text as authored)." },
    featuredImageUrl: { type: ["string", "null"], format: "uri" },
    publishedAt: { type: ["integer", "null"], description: "Unix epoch seconds (UTC)." },
    author: { oneOf: [ref("UserSummary"), { type: "null" }] },
  },
  required: ["id", "title", "slug", "content", "featuredImageUrl", "publishedAt", "author"],
};

// ---------------------------------------------------------------------------
// Admin shapes — like the public ones, but nothing is hidden: drafts are
// visible, events include eventPassword, trackers/ranklists expose ids,
// statuses, and timestamps.
// ---------------------------------------------------------------------------

const okSchema = {
  type: "object",
  properties: { ok: { type: "boolean" } },
  required: ["ok"],
};

const bulkResultSchema = {
  type: "object",
  properties: {
    ok: { type: "boolean" },
    affected: {
      type: "integer",
      description:
        "Rows the action actually touched. Lower than the number of ids sent when " +
        "some of them no longer exist or fall outside the parent in the path.",
    },
  },
  required: ["ok", "affected"],
};

const userListSchema = {
  type: "object",
  properties: { data: { type: "array", items: ref("User") }, meta: ref("PaginationMeta") },
  required: ["data", "meta"],
};

const adminUserDetailSchema = {
  type: "object",
  properties: { user: ref("User"), handles: ref("HandlesMap") },
  required: ["user", "handles"],
};

const adminEventProps = {
  ...eventCoreProps,
  eventPassword: {
    type: ["string", "null"],
    description: "The attendance password (visible to admins only).",
  },
};
const adminEventRequired = Object.keys(adminEventProps);

const adminEventSchema = {
  type: "object",
  properties: adminEventProps,
  required: adminEventRequired,
};

const adminEventDetailSchema = {
  type: "object",
  properties: { ...adminEventProps, media: { type: "array", items: ref("EventMedia") } },
  required: [...adminEventRequired, "media"],
};

const adminEventListSchema = {
  type: "object",
  properties: { data: { type: "array", items: ref("AdminEvent") }, meta: ref("PaginationMeta") },
  required: ["data", "meta"],
};

const contestMetadataSchema = {
  type: "object",
  properties: {
    platform: { type: "string", enum: ["codeforces", "vjudge", "atcoder"] },
    title: { type: "string" },
    description: {
      type: "string",
      description: "The source description, or an empty string when none is available.",
    },
    startingAt: epoch("Contest start in Unix epoch seconds (UTC)."),
    endingAt: epoch("Contest end in Unix epoch seconds (UTC)."),
  },
  required: ["platform", "title", "description", "startingAt", "endingAt"],
};

const adminTrackerProps = {
  id: { type: "integer" },
  title: { type: "string" },
  description: { type: "string" },
  slug: { type: "string" },
  status: { type: "string", enum: ["published", "draft"] },
  order: { type: "integer", description: "Display order (0 = first)." },
  createdAt: epoch("Unix epoch seconds (UTC)."),
  updatedAt: epoch("Unix epoch seconds (UTC)."),
};
const adminTrackerRequired = Object.keys(adminTrackerProps);

const adminTrackerSchema = {
  type: "object",
  properties: adminTrackerProps,
  required: adminTrackerRequired,
};

const adminTrackerListSchema = {
  type: "object",
  properties: { data: { type: "array", items: ref("AdminTracker") }, meta: ref("PaginationMeta") },
  required: ["data", "meta"],
};

const adminRanklistSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    trackerId: { type: "integer" },
    keyword: { type: "string" },
    description: { type: "string" },
    status: { type: "string", enum: ["published", "draft"] },
    upsolveWeight: { type: "number", description: "0.00–1.00." },
    isLocked: { type: "boolean" },
    considerStrictAttendance: { type: "boolean" },
    autoAddUsers: {
      type: "boolean",
      description:
        "When true, DB triggers keep membership in sync with participation on attached events.",
    },
    order: {
      type: "integer",
      description: "Display order within the tracker (0 = first = latest).",
    },
    userCount: { type: "integer" },
    eventCount: { type: "integer" },
    createdAt: epoch("Unix epoch seconds (UTC)."),
    updatedAt: epoch("Unix epoch seconds (UTC)."),
  },
  required: [
    "id",
    "trackerId",
    "keyword",
    "description",
    "status",
    "upsolveWeight",
    "isLocked",
    "considerStrictAttendance",
    "autoAddUsers",
    "order",
    "userCount",
    "eventCount",
    "createdAt",
    "updatedAt",
  ],
};

const adminTrackerDetailSchema = {
  type: "object",
  properties: { ...adminTrackerProps, ranklists: { type: "array", items: ref("AdminRanklist") } },
  required: [...adminTrackerRequired, "ranklists"],
};

const adminRanklistEventEntrySchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    title: { type: "string" },
    status: { type: "string", enum: ["published", "draft"] },
    startingAt: epoch("Unix epoch seconds (UTC)."),
    weight: { type: "number", description: "This event's weight in the ranklist (0.00–1.00)." },
  },
  required: ["id", "title", "status", "startingAt", "weight"],
};

const adminRanklistStandingSchema = {
  type: "object",
  properties: {
    user: ref("UserSummary"),
    score: { type: "number" },
    rank: { type: "integer" },
    autoAdded: {
      type: "boolean",
      description: "True when the member was added by the auto-add triggers, not an admin.",
    },
  },
  required: ["user", "score", "rank", "autoAdded"],
};

const adminRanklistDetailSchema = {
  type: "object",
  properties: {
    ...adminRanklistSchema.properties,
    events: { type: "array", items: ref("AdminRanklistEventEntry") },
    users: { type: "array", items: ref("AdminRanklistStanding") },
  },
  required: [...adminRanklistSchema.required, "events", "users"],
};

const adminGalleryAlbumProps = {
  id: { type: "integer" },
  title: { type: "string" },
  description: { type: "string" },
  slug: { type: "string" },
  status: { type: "string", enum: ["published", "draft"] },
  order: { type: "integer", description: "Display order (0 = first)." },
  createdAt: epoch("Unix epoch seconds (UTC)."),
  updatedAt: epoch("Unix epoch seconds (UTC)."),
};
const adminGalleryAlbumRequired = Object.keys(adminGalleryAlbumProps);

const adminGalleryAlbumSchema = {
  type: "object",
  properties: adminGalleryAlbumProps,
  required: adminGalleryAlbumRequired,
};

const adminGalleryAlbumListSchema = {
  type: "object",
  properties: {
    data: {
      type: "array",
      items: {
        type: "object",
        properties: { ...adminGalleryAlbumProps, mediaCount: { type: "integer" } },
        required: [...adminGalleryAlbumRequired, "mediaCount"],
      },
    },
    meta: ref("PaginationMeta"),
  },
  required: ["data", "meta"],
};

const adminGalleryMediaSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    order: { type: "integer", description: "Display order within the album (0 = first)." },
    url: { type: ["string", "null"], format: "uri" },
  },
  required: ["id", "order", "url"],
};

const adminGalleryAlbumDetailSchema = {
  type: "object",
  properties: {
    ...adminGalleryAlbumProps,
    media: { type: "array", items: ref("AdminGalleryMedia") },
  },
  required: [...adminGalleryAlbumRequired, "media"],
};

const adminBlogPostProps = {
  id: { type: "integer" },
  title: { type: "string" },
  slug: { type: "string" },
  content: { type: "string" },
  status: { type: "string", enum: ["published", "draft"] },
  featuredImageUrl: { type: ["string", "null"], format: "uri" },
  authorId: { type: ["integer", "null"] },
  publishedAt: {
    type: ["integer", "null"],
    description: "Unix epoch seconds (UTC); stamped on the first transition to published.",
  },
  createdAt: epoch("Unix epoch seconds (UTC)."),
  updatedAt: epoch("Unix epoch seconds (UTC)."),
};
const adminBlogPostRequired = Object.keys(adminBlogPostProps);

const adminBlogPostSchema = {
  type: "object",
  properties: adminBlogPostProps,
  required: adminBlogPostRequired,
};

const adminBlogPostListSchema = {
  type: "object",
  properties: { data: { type: "array", items: ref("AdminBlogPost") }, meta: ref("PaginationMeta") },
  required: ["data", "meta"],
};

const adminBlogAssetSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    kind: { type: "string", enum: ["image", "video", "file"] },
    filename: { type: "string" },
    mime: { type: "string" },
    url: { type: ["string", "null"], format: "uri" },
  },
  required: ["id", "kind", "filename", "mime", "url"],
};

const adminBlogPostDetailSchema = {
  type: "object",
  properties: {
    ...adminBlogPostProps,
    author: { oneOf: [ref("UserSummary"), { type: "null" }] },
    assets: { type: "array", items: ref("AdminBlogAsset") },
  },
  required: [...adminBlogPostRequired, "author", "assets"],
};

const assetUploadSchema = {
  type: "object",
  properties: {
    file: {
      type: "string",
      format: "binary",
      description: "Image, video, or file — max 25 MB.",
    },
  },
  required: ["file"],
};

// ---------------------------------------------------------------------------
// System health — the scheduled jobs, as seen from the admin panel.
// ---------------------------------------------------------------------------

const runStatusSchema = {
  type: "string",
  enum: ["ok", "degraded", "crashed"],
  description:
    "`degraded` is an invocation that finished but raised faults — the state " +
    "Cloudflare's own dashboard cannot show, because the invocation succeeded.",
};

const cronRunSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    job: { type: "string" },
    startedAt: epoch("Unix epoch seconds (UTC)."),
    durationMs: { type: "integer" },
    status: ref("CronRunStatus"),
    faults: {
      type: "array",
      items: { type: "string" },
      description: "Fault keys raised by this run, e.g. `codeforces:blocked`.",
    },
    rowsWritten: { type: ["integer", "null"] },
    errors: { type: ["integer", "null"] },
    summary: {
      description: "The job's own summary object; shape varies by job.",
    },
  },
  required: [
    "id",
    "job",
    "startedAt",
    "durationMs",
    "status",
    "faults",
    "rowsWritten",
    "errors",
    "summary",
  ],
};

const cronRunListSchema = {
  type: "object",
  properties: { data: { type: "array", items: ref("CronRun") }, meta: ref("PaginationMeta") },
  required: ["data", "meta"],
};

const systemJobSchema = {
  type: "object",
  properties: {
    job: { type: "string" },
    cron: { type: "string", description: "The expression registered in wrangler.jsonc." },
    expected: {
      type: ["integer", "null"],
      description:
        "Ticks a full day should contain, derived from `cron`. Null when the " +
        "expression restricts day-of-month/month/day-of-week, which makes the " +
        "count depend on the calendar.",
    },
    observed: {
      type: "integer",
      description: "Ticks recorded within `livenessWindowSeconds`.",
    },
    lastRunAt: { type: ["integer", "null"] },
    lastStatus: { oneOf: [ref("CronRunStatus"), { type: "null" }] },
    lastDurationMs: { type: ["integer", "null"] },
    lastFaults: { type: "array", items: { type: "string" } },
    day: {
      type: "object",
      description: "Totals over the last 24 hours.",
      properties: {
        runs: { type: "integer" },
        ok: { type: "integer" },
        degraded: { type: "integer" },
        crashed: { type: "integer" },
        rowsWritten: { type: "integer" },
        errors: { type: "integer" },
        slowestMs: { type: "integer" },
      },
      required: ["runs", "ok", "degraded", "crashed", "rowsWritten", "errors", "slowestMs"],
    },
    recent: {
      type: "array",
      description: "The job's most recent runs, oldest first — ready to chart as-is.",
      items: {
        type: "object",
        properties: {
          startedAt: epoch("Unix epoch seconds (UTC)."),
          durationMs: { type: "integer" },
          status: ref("CronRunStatus"),
          rowsWritten: { type: ["integer", "null"] },
          errors: { type: ["integer", "null"] },
        },
        required: ["startedAt", "durationMs", "status", "rowsWritten", "errors"],
      },
    },
  },
  required: [
    "job",
    "cron",
    "expected",
    "observed",
    "lastRunAt",
    "lastStatus",
    "lastDurationMs",
    "lastFaults",
    "day",
    "recent",
  ],
};

const systemNoticeSchema = {
  type: "object",
  properties: {
    key: { type: "string", description: "Stable fault id, e.g. `codeforces:paging-truncated`." },
    firstSeenAt: epoch("Unix epoch seconds (UTC)."),
    lastSeenAt: epoch("Unix epoch seconds (UTC)."),
    lastSentAt: { type: ["integer", "null"], description: "When the last alert mail went out." },
    occurrences: { type: "integer", description: "Occurrences since that mail." },
    lastDetail: { type: ["string", "null"] },
  },
  required: ["key", "firstSeenAt", "lastSeenAt", "lastSentAt", "occurrences", "lastDetail"],
};

const systemHealthSchema = {
  type: "object",
  properties: {
    now: epoch("Server time, so the client can age the timestamps below consistently."),
    recordingSince: {
      type: ["integer", "null"],
      description: "Oldest run still in the ledger.",
    },
    livenessReady: {
      type: "boolean",
      description:
        "False while the ledger is younger than one liveness window, when " +
        "`observed` counts the ledger's age rather than the job's health.",
    },
    livenessWindowSeconds: { type: "integer" },
    retentionDays: { type: "integer", description: "How long runs are kept." },
    jobs: { type: "array", items: ref("SystemJob") },
    notices: { type: "array", items: ref("SystemNotice") },
  },
  required: [
    "now",
    "recordingSince",
    "livenessReady",
    "livenessWindowSeconds",
    "retentionDays",
    "jobs",
    "notices",
  ],
};

const featuredImageResultSchema = {
  type: "object",
  properties: { featuredImageUrl: { type: "string", format: "uri" } },
  required: ["featuredImageUrl"],
};

const ranklistEventSetResultSchema = {
  type: "object",
  properties: { eventId: { type: "integer" }, weight: { type: "number" } },
  required: ["eventId", "weight"],
};

const ranklistUserSetResultSchema = {
  type: "object",
  properties: {
    userId: { type: "integer" },
    score: { type: "number" },
    rank: { type: "integer" },
  },
  required: ["userId", "score", "rank"],
};

const pageParams = [
  {
    name: "page",
    in: "query",
    description: "1-based page number.",
    schema: { type: "integer", minimum: 1, default: 1 },
  },
  {
    name: "perPage",
    in: "query",
    description: "Items per page (max 100).",
    schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
  },
];

const idParam = (name: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "integer" },
});

const permissionPathParam = {
  name: "permission",
  in: "path",
  required: true,
  schema: ref("Permission"),
};

const handleTypePathParam = {
  name: "type",
  in: "path",
  required: true,
  schema: { type: "string", enum: ["codeforces", "vjudge", "atcoder"] },
};

// Every admin endpoint returns these when the caller lacks access.
const adminAuthResponses = {
  "401": { description: "Missing or invalid token", content: jsonBody(ref("Error")) },
  "403": {
    description: "Caller lacks the required permission",
    content: jsonBody(ref("Error")),
  },
};

const infoDescription = `Backend API for **diuacm**, running on Cloudflare Workers.

## Authentication

Sign in with \`POST /auth/google\` (Google ID token, verified \`@diu.edu.bd\`
accounts only — the super admin's email is exempt from the domain restriction);
new accounts are created on first Google sign-in. \`POST /auth/login\` (email or
username + password) works for accounts an admin gave a password to.

Every successful auth response includes a JWT — pass it on authenticated requests:

\`\`\`
Authorization: Bearer <token>
\`\`\`

## Permissions

Admin access is **permission-based**, not role-based. A user may hold any subset of:

| Permission | Grants |
| --- | --- |
| \`manage_users\` | Users under \`/admin/users\` |
| \`manage_events\` | Events, media, and performance under \`/admin/events\` |
| \`manage_attendance\` | Attendance under \`/admin/events/{id}/attendance\` |
| \`manage_trackers\` | Trackers and ranklists under \`/admin/trackers\` and \`/admin/ranklists\` |
| \`manage_gallery\` | Gallery albums and their images under \`/admin/gallery\` |
| \`manage_blog\` | Blog posts under \`/admin/blog\` |

The **super admin** — the account whose email matches \`SUPER_ADMIN_EMAIL\` — implicitly
holds every permission and is the only one who can turn permissions on or off
(\`PUT /admin/users/{id}/permissions/{permission}\` with \`{ "enabled": true | false }\`).
Each operation's badge shows the access it requires.

## Conventions

- All timestamps are **Unix epoch seconds** (UTC integers), not ISO 8601 strings.
- Errors return \`{ "error": "<message>" }\`. Validation failures additionally include an
  \`issues\` array with field-level details.
- List endpoints are paginated via \`page\` / \`perPage\` and return a \`meta\` block.`;

export const openApiDoc = {
  openapi: "3.1.0",
  info: {
    title: "diuacm API",
    version: "0.1.0",
    description: infoDescription,
  },
  servers: [{ url: "/", description: "Current origin" }],
  tags: [
    { name: "meta", description: "Service metadata" },
    { name: "auth", description: "Login, Google sign-in, and the current user" },
    { name: "events", description: "Events, media, and attendance" },
    { name: "trackers", description: "Trackers and their ranklists" },
    { name: "programmers", description: "Programmer directory, handles, and tracker performance" },
    { name: "gallery", description: "Photo albums" },
    { name: "blog", description: "Blog posts" },
    { name: "files", description: "Stored object serving" },
    {
      name: "admin-users",
      description:
        "Admin: manage users (`manage_users`) and their permissions (super admin only).",
    },
    {
      name: "admin-events",
      description:
        "Admin: manage events, media, and performance (`manage_events`); " +
        "attendance requires `manage_attendance`.",
    },
    { name: "admin-trackers", description: "Admin: manage trackers (`manage_trackers`)." },
    {
      name: "admin-ranklists",
      description:
        "Admin: manage ranklists, their events, and their users (`manage_trackers`).",
    },
    { name: "admin-gallery", description: "Admin: manage gallery albums and images (`manage_gallery`)." },
    { name: "admin-blog", description: "Admin: manage blog posts (`manage_blog`)." },
    {
      name: "admin-system",
      description:
        "Admin: what the scheduled jobs have been doing (`manage_system`) — run " +
        "history, missed ticks, and the open fault list.",
    },
  ],
  "x-tagGroups": [
    {
      name: "Non-admin",
      tags: ["meta", "auth", "events", "trackers", "programmers", "gallery", "blog", "files"],
    },
    {
      name: "Admin",
      tags: [
        "admin-users",
        "admin-events",
        "admin-trackers",
        "admin-ranklists",
        "admin-gallery",
        "admin-blog",
        "admin-system",
      ],
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT obtained from `/auth/login` or `/auth/google`.",
      },
    },
    schemas: {
      User: userSchema,
      Permission: permissionSchema,
      UserSummary: userSummarySchema,
      AuthResponse: authResponseSchema,
      UserResponse: userResponseSchema,
      AuthConfig: authConfigSchema,
      Error: errorSchema,
      Health: healthSchema,
      PaginationMeta: paginationMetaSchema,
      EventListItem: eventListItemSchema,
      EventList: eventListSchema,
      EventMedia: eventMediaSchema,
      EventDetail: eventDetailSchema,
      Attendance: attendanceSchema,
      AttendanceList: attendanceListSchema,
      AttendanceResult: attendanceResultSchema,
      Performance: performanceSchema,
      PerformanceList: performanceListSchema,
      Tracker: trackerSchema,
      TrackerList: trackerListSchema,
      RanklistSummary: ranklistSummarySchema,
      TrackerDetail: trackerDetailSchema,
      RanklistEventEntry: ranklistEventEntrySchema,
      RanklistUserPerformance: ranklistUserPerformanceSchema,
      RanklistStanding: ranklistStandingSchema,
      RanklistStandings: ranklistStandingsSchema,
      HandleEntry: handleEntrySchema,
      HandlesMap: handlesMapSchema,
      HandlesResponse: handlesResponseSchema,
      ProgrammerListItem: programmerListItemSchema,
      ProgrammerList: programmerListSchema,
      TrackerPerformanceRanklist: trackerPerformanceRanklistSchema,
      TrackerPerformanceEntry: trackerPerformanceEntrySchema,
      ProgrammerDetail: programmerDetailSchema,
      GalleryAlbumListItem: galleryAlbumListItemSchema,
      GalleryAlbumList: galleryAlbumListSchema,
      GalleryMedia: galleryMediaSchema,
      GalleryAlbumDetail: galleryAlbumDetailSchema,
      BlogPostListItem: blogPostListItemSchema,
      BlogPostList: blogPostListSchema,
      BlogPostDetail: blogPostDetailSchema,
      LoginRequest: toSchema(loginSchema),
      GoogleSignInRequest: toSchema(googleSignInSchema),
      ProfileUpdateRequest: toSchema(profileUpdateSchema),
      AttendanceRequest: toSchema(attendanceGiveSchema),
      HandleSetRequest: toSchema(handleSetSchema),
      Ok: okSchema,
      BulkResult: bulkResultSchema,
      UserList: userListSchema,
      AdminUserDetail: adminUserDetailSchema,
      AdminEvent: adminEventSchema,
      AdminEventDetail: adminEventDetailSchema,
      AdminEventList: adminEventListSchema,
      ContestMetadata: contestMetadataSchema,
      AdminTracker: adminTrackerSchema,
      AdminTrackerList: adminTrackerListSchema,
      AdminTrackerDetail: adminTrackerDetailSchema,
      AdminRanklist: adminRanklistSchema,
      AdminRanklistEventEntry: adminRanklistEventEntrySchema,
      AdminRanklistStanding: adminRanklistStandingSchema,
      AdminRanklistDetail: adminRanklistDetailSchema,
      RanklistEventSetResult: ranklistEventSetResultSchema,
      RanklistUserSetResult: ranklistUserSetResultSchema,
      AdminUserCreateRequest: toSchema(adminUserCreateSchema),
      AdminUserUpdateRequest: toSchema(adminUserUpdateSchema),
      PermissionToggleRequest: toSchema(permissionToggleSchema),
      AdminEventCreateRequest: toSchema(adminEventCreateSchema),
      AdminEventUpdateRequest: toSchema(adminEventUpdateSchema),
      AdminAttendanceAddRequest: toSchema(adminAttendanceAddSchema),
      AdminPerformanceSetRequest: toSchema(adminPerformanceSetSchema),
      AdminTrackerCreateRequest: toSchema(adminTrackerCreateSchema),
      AdminTrackerUpdateRequest: toSchema(adminTrackerUpdateSchema),
      AdminRanklistCreateRequest: toSchema(adminRanklistCreateSchema),
      AdminRanklistUpdateRequest: toSchema(adminRanklistUpdateSchema),
      AdminRanklistEventSetRequest: toSchema(adminRanklistEventSetSchema),
      AdminReorderRequest: toSchema(adminReorderSchema),
      AdminBulkIdsRequest: toSchema(adminBulkIdsSchema),
      AdminBulkPublishRequest: toSchema(adminBulkPublishSchema),
      AdminRanklistBulkRequest: toSchema(adminRanklistBulkSchema),
      AdminRanklistEventBulkRequest: toSchema(adminRanklistEventBulkSchema),
      AdminGalleryAlbum: adminGalleryAlbumSchema,
      AdminGalleryAlbumList: adminGalleryAlbumListSchema,
      AdminGalleryMedia: adminGalleryMediaSchema,
      AdminGalleryAlbumDetail: adminGalleryAlbumDetailSchema,
      AdminBlogPost: adminBlogPostSchema,
      AdminBlogPostList: adminBlogPostListSchema,
      AdminBlogPostDetail: adminBlogPostDetailSchema,
      AdminBlogAsset: adminBlogAssetSchema,
      FeaturedImageResult: featuredImageResultSchema,
      AdminGalleryAlbumCreateRequest: toSchema(adminGalleryAlbumCreateSchema),
      AdminGalleryAlbumUpdateRequest: toSchema(adminGalleryAlbumUpdateSchema),
      AdminBlogPostCreateRequest: toSchema(adminBlogPostCreateSchema),
      AdminBlogPostUpdateRequest: toSchema(adminBlogPostUpdateSchema),
      CronRunStatus: runStatusSchema,
      CronRun: cronRunSchema,
      CronRunList: cronRunListSchema,
      SystemJob: systemJobSchema,
      SystemNotice: systemNoticeSchema,
      SystemHealth: systemHealthSchema,
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["meta"],
        summary: "Health check",
        ...access("public"),
        responses: {
          "200": { description: "Service is up", content: jsonBody(ref("Health")) },
        },
      },
    },
    "/auth/config": {
      get: {
        tags: ["auth"],
        summary: "Public auth configuration",
        ...access("public"),
        responses: {
          "200": { description: "Auth config", content: jsonBody(ref("AuthConfig")) },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Log in with email or username and password",
        ...access("public"),
        requestBody: { required: true, content: jsonBody(ref("LoginRequest")) },
        responses: {
          "200": { description: "Authenticated", content: jsonBody(ref("AuthResponse")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          "401": { description: "Invalid credentials", content: jsonBody(ref("Error")) },
          "429": { description: "Too many attempts from this IP", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/auth/google": {
      post: {
        tags: ["auth"],
        summary: "Sign in with a Google ID token (@diu.edu.bd only)",
        ...access("public"),
        requestBody: { required: true, content: jsonBody(ref("GoogleSignInRequest")) },
        responses: {
          "200": {
            description: "Authenticated (existing user)",
            content: jsonBody(ref("AuthResponse")),
          },
          "201": {
            description: "Authenticated (new user created)",
            content: jsonBody(ref("AuthResponse")),
          },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          "401": { description: "Invalid Google token", content: jsonBody(ref("Error")) },
          "403": {
            description: "Email domain not allowed (the super admin's email is exempt)",
            content: jsonBody(ref("Error")),
          },
          "429": { description: "Too many attempts from this IP", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["auth"],
        summary: "Get the current user",
        ...access("user"),
        responses: {
          "200": {
            description: "The authenticated user",
            content: jsonBody(ref("UserResponse")),
          },
          "401": {
            description: "Missing or invalid token",
            content: jsonBody(ref("Error")),
          },
        },
      },
      patch: {
        tags: ["auth"],
        summary: "Update the current user's profile",
        ...access("user"),
        requestBody: { required: true, content: jsonBody(ref("ProfileUpdateRequest")) },
        responses: {
          "200": {
            description: "The updated user",
            content: jsonBody(ref("UserResponse")),
          },
          "400": {
            description: "Validation failed or empty body",
            content: jsonBody(ref("Error")),
          },
          "401": {
            description: "Missing or invalid token",
            content: jsonBody(ref("Error")),
          },
          "409": {
            description: "Username or student id already exists",
            content: jsonBody(ref("Error")),
          },
        },
      },
    },
    "/auth/me/image": {
      put: {
        tags: ["auth"],
        summary: "Upload or replace the current user's profile image",
        ...access("user"),
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: imageUploadSchema } },
        },
        responses: {
          "200": {
            description: "The updated user",
            content: jsonBody(ref("UserResponse")),
          },
          "400": {
            description: "Missing or invalid image",
            content: jsonBody(ref("Error")),
          },
          "401": {
            description: "Missing or invalid token",
            content: jsonBody(ref("Error")),
          },
          "413": {
            description: "Image exceeds the 5 MB limit",
            content: jsonBody(ref("Error")),
          },
        },
      },
    },
    "/auth/me/handles": {
      get: {
        tags: ["programmers"],
        summary: "Get the current user's handles",
        ...access("user"),
        responses: {
          "200": { description: "The handles map", content: jsonBody(ref("HandlesResponse")) },
          "401": { description: "Missing or invalid token", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/auth/me/handles/{type}": {
      put: {
        tags: ["programmers"],
        summary: "Set the current user's handle for a platform",
        ...access(
          "user",
          "For VJudge, this creates the first handle or edits the existing handle. " +
            "When an admin has attached multiple VJudge handles, the user must remove " +
            "extras before this operation is allowed.",
        ),
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["codeforces", "vjudge", "atcoder"] },
          },
        ],
        requestBody: { required: true, content: jsonBody(ref("HandleSetRequest")) },
        responses: {
          "200": { description: "The updated handles map", content: jsonBody(ref("HandlesResponse")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          "401": { description: "Missing or invalid token", content: jsonBody(ref("Error")) },
          "502": {
            description: "Codeforces could not be reached or returned an invalid response",
            content: jsonBody(ref("Error")),
          },
          "409": {
            description:
              "Handle already taken, or multiple admin-managed VJudge handles prevent editing",
            content: jsonBody(ref("Error")),
          },
        },
      },
    },
    "/auth/me/handles/{type}/{handleId}": {
      delete: {
        tags: ["programmers"],
        summary: "Remove one of the current user's handles",
        ...access("user", "The handle id must belong to the signed-in user and platform."),
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["codeforces", "vjudge", "atcoder"] },
          },
          idParam("handleId"),
        ],
        responses: {
          "200": { description: "The updated handles map", content: jsonBody(ref("HandlesResponse")) },
          "401": { description: "Missing or invalid token", content: jsonBody(ref("Error")) },
          "404": { description: "Handle not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/events": {
      get: {
        tags: ["events"],
        summary: "List published events",
        ...access("public"),
        parameters: [
          ...pageParams,
          {
            name: "type",
            in: "query",
            schema: { type: "string", enum: ["contest", "class", "other"] },
          },
          {
            name: "scope",
            in: "query",
            schema: {
              type: "string",
              enum: ["open_for_all", "only_girls", "junior_programmers", "selected_persons"],
            },
          },
          {
            name: "q",
            in: "query",
            description: "Search on title, description, or event link.",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "A page of events", content: jsonBody(ref("EventList")) },
        },
      },
    },
    "/events/{id}": {
      get: {
        tags: ["events"],
        summary: "Get a published event with its media",
        ...access("public"),
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "The event", content: jsonBody(ref("EventDetail")) },
          "404": { description: "Not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/events/{id}/attendance": {
      post: {
        tags: ["events"],
        summary: "Mark attendance for the current user (event password required)",
        ...access(
          "user",
          "Requires the correct event password and that the current time is within the " +
            "attendance window (15 minutes before start to 15 minutes after end).",
        ),
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: jsonBody(ref("AttendanceRequest")) },
        responses: {
          "201": { description: "Attendance recorded", content: jsonBody(ref("AttendanceResult")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          "401": {
            description: "Missing or invalid token",
            content: jsonBody(ref("Error")),
          },
          "403": {
            description:
              "Incorrect event password, attendance not open, or outside the attendance window",
            content: jsonBody(ref("Error")),
          },
          "404": { description: "Event not found", content: jsonBody(ref("Error")) },
          "409": { description: "Attendance already recorded", content: jsonBody(ref("Error")) },
        },
      },
      get: {
        tags: ["events"],
        summary: "List attendees of an event",
        ...access("public"),
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "All attendees", content: jsonBody(ref("AttendanceList")) },
          "404": { description: "Event not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/events/{id}/performance": {
      get: {
        tags: ["events"],
        summary: "Event performance leaderboard (ordered by rank)",
        ...access("public"),
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": {
            description: "All performance rows",
            content: jsonBody(ref("PerformanceList")),
          },
          "404": { description: "Event not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/trackers": {
      get: {
        tags: ["trackers"],
        summary: "List published trackers",
        ...access("public"),
        parameters: [...pageParams],
        responses: {
          "200": { description: "A page of trackers", content: jsonBody(ref("TrackerList")) },
        },
      },
    },
    "/trackers/{slug}": {
      get: {
        tags: ["trackers"],
        summary: "Get a published tracker with its published ranklists",
        ...access("public"),
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "The tracker", content: jsonBody(ref("TrackerDetail")) },
          "404": { description: "Not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/trackers/{slug}/{keyword}": {
      get: {
        tags: ["trackers"],
        summary: "Ranklist standings — events (with weight) and users with per-event performance",
        ...access(
          "public",
          "`events` is ordered by `startingAt` descending (most recent contest first); " +
            "`users` by rank. Each user's `performance` entries carry their own `eventId`, " +
            "so they can be matched without relying on array position.",
        ),
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" } },
          { name: "keyword", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "The ranklist standings",
            content: jsonBody(ref("RanklistStandings")),
          },
          "404": { description: "Not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/programmers": {
      get: {
        tags: ["programmers"],
        summary: "List programmers (users with at least one handle)",
        ...access(
          "public",
          "Ordered by max Codeforces rating (unrated users last), then name. " +
            "Searchable on name and username via `q`.",
        ),
        parameters: [
          ...pageParams,
          {
            name: "q",
            in: "query",
            description: "Search on name or username.",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "A page of programmers", content: jsonBody(ref("ProgrammerList")) },
        },
      },
    },
    "/programmers/{username}": {
      get: {
        tags: ["programmers"],
        summary: "Get a programmer by username, with handles and tracker performance",
        ...access("public"),
        parameters: [
          { name: "username", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "The programmer", content: jsonBody(ref("ProgrammerDetail")) },
          "404": { description: "Not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/gallery": {
      get: {
        tags: ["gallery"],
        summary: "List published albums with cover image and media count",
        ...access("public"),
        parameters: [...pageParams],
        responses: {
          "200": { description: "A page of albums", content: jsonBody(ref("GalleryAlbumList")) },
        },
      },
    },
    "/gallery/{slug}": {
      get: {
        tags: ["gallery"],
        summary: "Get a published album with its images",
        ...access("public"),
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "The album", content: jsonBody(ref("GalleryAlbumDetail")) },
          "404": { description: "Not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/blog": {
      get: {
        tags: ["blog"],
        summary: "List published posts, newest first",
        ...access("public"),
        parameters: [
          ...pageParams,
          {
            name: "q",
            in: "query",
            description: "Search on title or content.",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "A page of posts", content: jsonBody(ref("BlogPostList")) },
        },
      },
    },
    "/blog/{slug}": {
      get: {
        tags: ["blog"],
        summary: "Get a published post with its full body",
        ...access("public"),
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "The post", content: jsonBody(ref("BlogPostDetail")) },
          "404": { description: "Not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/files/{key}": {
      get: {
        tags: ["files"],
        summary: "Stream a stored object (e.g. a profile image)",
        ...access("public"),
        parameters: [
          {
            name: "key",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Object key, e.g. `users/<uuid>.png`.",
          },
        ],
        responses: {
          "200": {
            description: "The object bytes (immutable, long-cached)",
            content: binaryBody("image/png", "image/jpeg", "image/gif", "image/webp"),
          },
          "404": { description: "Not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/users": {
      get: {
        tags: ["admin-users"],
        summary: "List all users",
        ...access("manage_users"),
        parameters: [
          ...pageParams,
          {
            name: "q",
            in: "query",
            description: "Search on name, username, email, or student id.",
            schema: { type: "string" },
          },
          {
            name: "permission",
            in: "query",
            description: "Only users granted this permission.",
            schema: ref("Permission"),
          },
        ],
        responses: {
          "200": { description: "A page of users", content: jsonBody(ref("UserList")) },
          ...adminAuthResponses,
        },
      },
      post: {
        tags: ["admin-users"],
        summary: "Create a user",
        ...access("manage_users"),
        requestBody: { required: true, content: jsonBody(ref("AdminUserCreateRequest")) },
        responses: {
          "201": { description: "User created", content: jsonBody(ref("UserResponse")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "409": {
            description: "Email, username, or student id already exists",
            content: jsonBody(ref("Error")),
          },
        },
      },
    },
    "/admin/users/{id}": {
      get: {
        tags: ["admin-users"],
        summary: "Get a user with their handles",
        ...access("manage_users"),
        parameters: [idParam("id")],
        responses: {
          "200": { description: "The user", content: jsonBody(ref("AdminUserDetail")) },
          ...adminAuthResponses,
          "404": { description: "User not found", content: jsonBody(ref("Error")) },
        },
      },
      patch: {
        tags: ["admin-users"],
        summary: "Update a user (including password)",
        ...access("manage_users"),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminUserUpdateRequest")) },
        responses: {
          "200": { description: "The updated user", content: jsonBody(ref("UserResponse")) },
          "400": {
            description: "Validation failed or empty body",
            content: jsonBody(ref("Error")),
          },
          ...adminAuthResponses,
          "404": { description: "User not found", content: jsonBody(ref("Error")) },
          "409": {
            description: "Email, username, or student id already exists",
            content: jsonBody(ref("Error")),
          },
        },
      },
      delete: {
        tags: ["admin-users"],
        summary: "Delete a user (cascades handles, permissions, attendance, performance, memberships)",
        ...access("manage_users"),
        parameters: [idParam("id")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          "400": {
            description: "You cannot delete yourself or the super admin",
            content: jsonBody(ref("Error")),
          },
          ...adminAuthResponses,
          "404": { description: "User not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/users/{id}/handles/{type}": {
      post: {
        tags: ["admin-users"],
        summary: "Add a platform handle to a user",
        ...access(
          "manage_users",
          "Admins may attach multiple VJudge handles. Codeforces and AtCoder remain " +
            "limited to one handle per user. Every handle remains globally unique within its platform.",
        ),
        parameters: [idParam("id"), handleTypePathParam],
        requestBody: { required: true, content: jsonBody(ref("HandleSetRequest")) },
        responses: {
          "201": { description: "Handle added", content: jsonBody(ref("HandleEntry")) },
          "400": {
            description: "Validation failed or invalid Codeforces handle",
            content: jsonBody(ref("Error")),
          },
          ...adminAuthResponses,
          "404": { description: "User not found", content: jsonBody(ref("Error")) },
          "409": {
            description: "Handle already belongs to a user, or the platform already has a handle",
            content: jsonBody(ref("Error")),
          },
          "502": {
            description: "Codeforces could not be reached or returned an invalid response",
            content: jsonBody(ref("Error")),
          },
        },
      },
    },
    "/admin/users/{id}/handles/{type}/{handleId}": {
      put: {
        tags: ["admin-users"],
        summary: "Edit one of a user's platform handles",
        ...access("manage_users"),
        parameters: [idParam("id"), handleTypePathParam, idParam("handleId")],
        requestBody: { required: true, content: jsonBody(ref("HandleSetRequest")) },
        responses: {
          "200": { description: "Handle updated", content: jsonBody(ref("HandleEntry")) },
          "400": {
            description: "Validation failed or invalid Codeforces handle",
            content: jsonBody(ref("Error")),
          },
          ...adminAuthResponses,
          "404": { description: "Handle not found", content: jsonBody(ref("Error")) },
          "409": {
            description: "Handle already belongs to a user",
            content: jsonBody(ref("Error")),
          },
          "502": {
            description: "Codeforces could not be reached or returned an invalid response",
            content: jsonBody(ref("Error")),
          },
        },
      },
      delete: {
        tags: ["admin-users"],
        summary: "Remove one of a user's platform handles",
        ...access("manage_users"),
        parameters: [idParam("id"), handleTypePathParam, idParam("handleId")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Handle not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/users/{id}/permissions/{permission}": {
      put: {
        tags: ["admin-users"],
        summary: "Turn a permission on or off for a user",
        ...access(
          "super-admin",
          "Designed for a toggle switch in the admin UI: `enabled: true` grants the " +
            "permission, `false` revokes it. Idempotent in both directions.",
        ),
        parameters: [idParam("id"), permissionPathParam],
        requestBody: { required: true, content: jsonBody(ref("PermissionToggleRequest")) },
        responses: {
          "200": {
            description: "The user with their updated permissions",
            content: jsonBody(ref("UserResponse")),
          },
          "400": {
            description: "Unknown permission or invalid body",
            content: jsonBody(ref("Error")),
          },
          "401": { description: "Missing or invalid token", content: jsonBody(ref("Error")) },
          "403": {
            description: "Caller is not the super admin",
            content: jsonBody(ref("Error")),
          },
          "404": { description: "User not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/events": {
      get: {
        tags: ["admin-events"],
        summary: "List all events (including drafts)",
        ...access("manage_events"),
        parameters: [
          ...pageParams,
          {
            name: "type",
            in: "query",
            schema: { type: "string", enum: ["contest", "class", "other"] },
          },
          {
            name: "scope",
            in: "query",
            schema: {
              type: "string",
              enum: ["open_for_all", "only_girls", "junior_programmers", "selected_persons"],
            },
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["published", "draft"] },
          },
          {
            name: "q",
            in: "query",
            description: "Search on title, description, or event link.",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "A page of events", content: jsonBody(ref("AdminEventList")) },
          ...adminAuthResponses,
        },
      },
      post: {
        tags: ["admin-events"],
        summary: "Create an event",
        ...access("manage_events"),
        requestBody: { required: true, content: jsonBody(ref("AdminEventCreateRequest")) },
        responses: {
          "201": { description: "Event created", content: jsonBody(ref("AdminEvent")) },
          "400": {
            description: "Validation failed or endingAt not after startingAt",
            content: jsonBody(ref("Error")),
          },
          ...adminAuthResponses,
        },
      },
    },
    "/admin/events/contest-details": {
      get: {
        tags: ["admin-events"],
        summary: "Fetch contest details from a supported judge link",
        ...access(
          "manage_events",
          "Resolves Codeforces, VJudge, and AtCoder contest links and returns editable event fields.",
        ),
        parameters: [
          {
            name: "link",
            in: "query",
            required: true,
            schema: { type: "string", format: "uri", maxLength: 500 },
          },
        ],
        responses: {
          "200": { description: "Resolved contest details", content: jsonBody(ref("ContestMetadata")) },
          "400": { description: "Unsupported or invalid contest link", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Contest not found or private", content: jsonBody(ref("Error")) },
          "429": { description: "Judge rate limit reached", content: jsonBody(ref("Error")) },
          "502": { description: "Judge unavailable or returned invalid data", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/events/{id}": {
      get: {
        tags: ["admin-events"],
        summary: "Get an event with its media (any status; includes eventPassword)",
        ...access("manage_events"),
        parameters: [idParam("id")],
        responses: {
          "200": { description: "The event", content: jsonBody(ref("AdminEventDetail")) },
          ...adminAuthResponses,
          "404": { description: "Event not found", content: jsonBody(ref("Error")) },
        },
      },
      patch: {
        tags: ["admin-events"],
        summary: "Update an event",
        ...access("manage_events"),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminEventUpdateRequest")) },
        responses: {
          "200": { description: "The updated event", content: jsonBody(ref("AdminEvent")) },
          "400": {
            description: "Validation failed, empty body, or endingAt not after startingAt",
            content: jsonBody(ref("Error")),
          },
          ...adminAuthResponses,
          "404": { description: "Event not found", content: jsonBody(ref("Error")) },
        },
      },
      delete: {
        tags: ["admin-events"],
        summary: "Delete an event (cascades media, attendance, performance, ranklist links)",
        ...access("manage_events"),
        parameters: [idParam("id")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Event not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/events/bulk": {
      post: {
        tags: ["admin-events"],
        summary: "Publish, unpublish, or delete a batch of events",
        ...access(
          "manage_events",
          "`delete` cascades each event's media, attendance, performance rows, and " +
            "ranklist links, exactly like `DELETE /admin/events/{id}`.",
        ),
        requestBody: { required: true, content: jsonBody(ref("AdminBulkPublishRequest")) },
        responses: {
          "200": { description: "Action applied", content: jsonBody(ref("BulkResult")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
        },
      },
    },
    "/admin/events/{id}/media": {
      post: {
        tags: ["admin-events"],
        summary: "Add an image to an event's media (appended last)",
        ...access("manage_events"),
        parameters: [idParam("id")],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: imageUploadSchema } },
        },
        responses: {
          "201": { description: "Media added", content: jsonBody(ref("EventMedia")) },
          "400": { description: "Missing or invalid image", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Event not found", content: jsonBody(ref("Error")) },
          "413": { description: "Image exceeds the 5 MB limit", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/events/{id}/media/{mediaId}": {
      delete: {
        tags: ["admin-events"],
        summary: "Remove a media item from an event",
        ...access("manage_events"),
        parameters: [idParam("id"), idParam("mediaId")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Media not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/events/{id}/media/bulk-remove": {
      post: {
        tags: ["admin-events"],
        summary: "Remove a batch of media items from an event",
        ...access("manage_events", "`ids` are media ids."),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminBulkIdsRequest")) },
        responses: {
          "200": { description: "Media removed", content: jsonBody(ref("BulkResult")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Event not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/events/{id}/attendance": {
      post: {
        tags: ["admin-events"],
        summary: "Record attendance for any user (no password or window checks)",
        ...access("manage_attendance"),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminAttendanceAddRequest")) },
        responses: {
          "201": { description: "Attendance recorded", content: jsonBody(ref("AttendanceResult")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Event or user not found", content: jsonBody(ref("Error")) },
          "409": { description: "Attendance already recorded", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/events/{id}/attendance/{userId}": {
      delete: {
        tags: ["admin-events"],
        summary: "Remove a user's attendance from an event",
        ...access("manage_attendance"),
        parameters: [idParam("id"), idParam("userId")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Attendance not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/events/{id}/attendance/bulk-remove": {
      post: {
        tags: ["admin-events"],
        summary: "Remove attendance for a batch of users",
        ...access("manage_attendance", "`ids` are user ids."),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminBulkIdsRequest")) },
        responses: {
          "200": { description: "Attendance removed", content: jsonBody(ref("BulkResult")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Event not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/events/{id}/performance/bulk-remove": {
      post: {
        tags: ["admin-events"],
        summary: "Delete performance rows for a batch of users",
        ...access(
          "manage_events",
          "`ids` are user ids. Ranklist scores and ranks recalculate automatically.",
        ),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminBulkIdsRequest")) },
        responses: {
          "200": { description: "Rows deleted", content: jsonBody(ref("BulkResult")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Event not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/events/{id}/performance/{userId}": {
      put: {
        tags: ["admin-events"],
        summary: "Create or replace a user's performance row for an event",
        ...access(
          "manage_events",
          "Full-replace semantics: omitted fields fall back to their defaults " +
            "(position null, counts 0). Ranklist scores and ranks recalculate automatically.",
        ),
        parameters: [idParam("id"), idParam("userId")],
        requestBody: { required: true, content: jsonBody(ref("AdminPerformanceSetRequest")) },
        responses: {
          "200": { description: "The performance row", content: jsonBody(ref("Performance")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Event or user not found", content: jsonBody(ref("Error")) },
        },
      },
      delete: {
        tags: ["admin-events"],
        summary: "Delete a user's performance row for an event",
        ...access("manage_events"),
        parameters: [idParam("id"), idParam("userId")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Performance not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/trackers": {
      get: {
        tags: ["admin-trackers"],
        summary: "List all trackers (including drafts)",
        ...access("manage_trackers"),
        parameters: [
          ...pageParams,
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["published", "draft"] },
          },
          {
            name: "q",
            in: "query",
            description: "Search on title or slug.",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "A page of trackers", content: jsonBody(ref("AdminTrackerList")) },
          ...adminAuthResponses,
        },
      },
      post: {
        tags: ["admin-trackers"],
        summary: "Create a tracker",
        ...access("manage_trackers"),
        requestBody: { required: true, content: jsonBody(ref("AdminTrackerCreateRequest")) },
        responses: {
          "201": { description: "Tracker created", content: jsonBody(ref("AdminTracker")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "409": { description: "Slug already exists", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/trackers/{id}": {
      get: {
        tags: ["admin-trackers"],
        summary: "Get a tracker with all of its ranklists",
        ...access("manage_trackers"),
        parameters: [idParam("id")],
        responses: {
          "200": { description: "The tracker", content: jsonBody(ref("AdminTrackerDetail")) },
          ...adminAuthResponses,
          "404": { description: "Tracker not found", content: jsonBody(ref("Error")) },
        },
      },
      patch: {
        tags: ["admin-trackers"],
        summary: "Update a tracker",
        ...access("manage_trackers"),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminTrackerUpdateRequest")) },
        responses: {
          "200": { description: "The updated tracker", content: jsonBody(ref("AdminTracker")) },
          "400": { description: "Validation failed or empty body", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Tracker not found", content: jsonBody(ref("Error")) },
          "409": { description: "Slug already exists", content: jsonBody(ref("Error")) },
        },
      },
      delete: {
        tags: ["admin-trackers"],
        summary: "Delete a tracker (cascades its ranklists)",
        ...access("manage_trackers"),
        parameters: [idParam("id")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Tracker not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/trackers/reorder": {
      post: {
        tags: ["admin-trackers"],
        summary: "Set display order for a batch of trackers",
        ...access("manage_trackers"),
        requestBody: { required: true, content: jsonBody(ref("AdminReorderRequest")) },
        responses: {
          "200": { description: "Order updated", content: jsonBody(ref("Ok")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
        },
      },
    },
    "/admin/trackers/bulk": {
      post: {
        tags: ["admin-trackers"],
        summary: "Publish, unpublish, or delete a batch of trackers",
        ...access("manage_trackers", "`delete` cascades each tracker's ranklists."),
        requestBody: { required: true, content: jsonBody(ref("AdminBulkPublishRequest")) },
        responses: {
          "200": { description: "Action applied", content: jsonBody(ref("BulkResult")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
        },
      },
    },
    "/admin/trackers/{id}/ranklists/bulk": {
      post: {
        tags: ["admin-ranklists"],
        summary: "Publish, unpublish, lock, unlock, or delete a batch of ranklists",
        ...access(
          "manage_trackers",
          "Scoped to the tracker in the path — ids belonging to another tracker are ignored " +
            "and left out of `affected`.",
        ),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminRanklistBulkRequest")) },
        responses: {
          "200": { description: "Action applied", content: jsonBody(ref("BulkResult")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Tracker not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/trackers/{id}/ranklists/reorder": {
      post: {
        tags: ["admin-ranklists"],
        summary: "Set display order for a batch of ranklists within a tracker",
        ...access("manage_trackers"),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminReorderRequest")) },
        responses: {
          "200": { description: "Order updated", content: jsonBody(ref("Ok")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Tracker not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/trackers/{id}/ranklists": {
      post: {
        tags: ["admin-ranklists"],
        summary: "Create a ranklist under a tracker",
        ...access("manage_trackers"),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminRanklistCreateRequest")) },
        responses: {
          "201": { description: "Ranklist created", content: jsonBody(ref("AdminRanklist")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Tracker not found", content: jsonBody(ref("Error")) },
          "409": {
            description: "Keyword already exists in this tracker",
            content: jsonBody(ref("Error")),
          },
        },
      },
    },
    "/admin/ranklists/{id}": {
      get: {
        tags: ["admin-ranklists"],
        summary: "Get a ranklist with its events (weights) and users (scores, ranks)",
        ...access(
          "manage_trackers",
          "`events` is ordered by `startingAt` descending (most recent contest first).",
        ),
        parameters: [idParam("id")],
        responses: {
          "200": { description: "The ranklist", content: jsonBody(ref("AdminRanklistDetail")) },
          ...adminAuthResponses,
          "404": { description: "Ranklist not found", content: jsonBody(ref("Error")) },
        },
      },
      patch: {
        tags: ["admin-ranklists"],
        summary: "Update a ranklist (weight changes recalculate scores)",
        ...access("manage_trackers"),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminRanklistUpdateRequest")) },
        responses: {
          "200": { description: "The updated ranklist", content: jsonBody(ref("AdminRanklist")) },
          "400": { description: "Validation failed or empty body", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Ranklist not found", content: jsonBody(ref("Error")) },
          "409": {
            description: "Keyword already exists in this tracker",
            content: jsonBody(ref("Error")),
          },
        },
      },
      delete: {
        tags: ["admin-ranklists"],
        summary: "Delete a ranklist",
        ...access("manage_trackers"),
        parameters: [idParam("id")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Ranklist not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/ranklists/{id}/events/bulk": {
      post: {
        tags: ["admin-ranklists"],
        summary: "Detach a batch of events, or set one weight across them",
        ...access(
          "manage_trackers",
          "`ids` are event ids. `set-weight` requires `weight`; scores and ranks " +
            "recalculate automatically either way.",
        ),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminRanklistEventBulkRequest")) },
        responses: {
          "200": { description: "Action applied", content: jsonBody(ref("BulkResult")) },
          "400": {
            description: "Validation failed, or `set-weight` sent without `weight`",
            content: jsonBody(ref("Error")),
          },
          ...adminAuthResponses,
          "404": { description: "Ranklist not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/ranklists/{id}/events/{eventId}": {
      put: {
        tags: ["admin-ranklists"],
        summary: "Attach an event to a ranklist, or update its weight",
        ...access("manage_trackers"),
        parameters: [idParam("id"), idParam("eventId")],
        requestBody: { required: true, content: jsonBody(ref("AdminRanklistEventSetRequest")) },
        responses: {
          "200": { description: "Attached/updated", content: jsonBody(ref("RanklistEventSetResult")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Ranklist or event not found", content: jsonBody(ref("Error")) },
        },
      },
      delete: {
        tags: ["admin-ranklists"],
        summary: "Detach an event from a ranklist",
        ...access("manage_trackers"),
        parameters: [idParam("id"), idParam("eventId")],
        responses: {
          "200": { description: "Detached", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": {
            description: "Ranklist not found or event not in it",
            content: jsonBody(ref("Error")),
          },
        },
      },
    },
    "/admin/ranklists/{id}/users/bulk-remove": {
      post: {
        tags: ["admin-ranklists"],
        summary: "Remove a batch of users from a ranklist",
        ...access("manage_trackers", "`ids` are user ids."),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminBulkIdsRequest")) },
        responses: {
          "200": { description: "Members removed", content: jsonBody(ref("BulkResult")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Ranklist not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/ranklists/{id}/users/{userId}": {
      put: {
        tags: ["admin-ranklists"],
        summary: "Add a user to a ranklist (idempotent)",
        ...access("manage_trackers"),
        parameters: [idParam("id"), idParam("userId")],
        responses: {
          "200": { description: "Membership ensured", content: jsonBody(ref("RanklistUserSetResult")) },
          ...adminAuthResponses,
          "404": { description: "Ranklist or user not found", content: jsonBody(ref("Error")) },
        },
      },
      delete: {
        tags: ["admin-ranklists"],
        summary: "Remove a user from a ranklist",
        ...access("manage_trackers"),
        parameters: [idParam("id"), idParam("userId")],
        responses: {
          "200": { description: "Removed", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": {
            description: "Ranklist not found or user not in it",
            content: jsonBody(ref("Error")),
          },
        },
      },
    },
    "/admin/gallery": {
      get: {
        tags: ["admin-gallery"],
        summary: "List all albums (including drafts)",
        ...access("manage_gallery"),
        parameters: [
          ...pageParams,
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["published", "draft"] },
          },
          {
            name: "q",
            in: "query",
            description: "Search on title or slug.",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "A page of albums",
            content: jsonBody(ref("AdminGalleryAlbumList")),
          },
          ...adminAuthResponses,
        },
      },
      post: {
        tags: ["admin-gallery"],
        summary: "Create an album",
        ...access("manage_gallery"),
        requestBody: { required: true, content: jsonBody(ref("AdminGalleryAlbumCreateRequest")) },
        responses: {
          "201": { description: "Album created", content: jsonBody(ref("AdminGalleryAlbum")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "409": { description: "Slug already exists", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/gallery/{id}": {
      get: {
        tags: ["admin-gallery"],
        summary: "Get an album with its images",
        ...access("manage_gallery"),
        parameters: [idParam("id")],
        responses: {
          "200": { description: "The album", content: jsonBody(ref("AdminGalleryAlbumDetail")) },
          ...adminAuthResponses,
          "404": { description: "Album not found", content: jsonBody(ref("Error")) },
        },
      },
      patch: {
        tags: ["admin-gallery"],
        summary: "Update an album",
        ...access("manage_gallery"),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminGalleryAlbumUpdateRequest")) },
        responses: {
          "200": { description: "The updated album", content: jsonBody(ref("AdminGalleryAlbum")) },
          "400": { description: "Validation failed or empty body", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Album not found", content: jsonBody(ref("Error")) },
          "409": { description: "Slug already exists", content: jsonBody(ref("Error")) },
        },
      },
      delete: {
        tags: ["admin-gallery"],
        summary: "Delete an album (cascades its images)",
        ...access("manage_gallery"),
        parameters: [idParam("id")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Album not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/gallery/bulk": {
      post: {
        tags: ["admin-gallery"],
        summary: "Publish, unpublish, or delete a batch of albums",
        ...access("manage_gallery", "`delete` cascades each album's photos."),
        requestBody: { required: true, content: jsonBody(ref("AdminBulkPublishRequest")) },
        responses: {
          "200": { description: "Action applied", content: jsonBody(ref("BulkResult")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
        },
      },
    },
    "/admin/gallery/reorder": {
      post: {
        tags: ["admin-gallery"],
        summary: "Set display order for a batch of albums",
        ...access("manage_gallery"),
        requestBody: { required: true, content: jsonBody(ref("AdminReorderRequest")) },
        responses: {
          "200": { description: "Order updated", content: jsonBody(ref("Ok")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
        },
      },
    },
    "/admin/gallery/{id}/media": {
      post: {
        tags: ["admin-gallery"],
        summary: "Add an image to an album (appended last)",
        ...access("manage_gallery"),
        parameters: [idParam("id")],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: imageUploadSchema } },
        },
        responses: {
          "201": { description: "Image added", content: jsonBody(ref("AdminGalleryMedia")) },
          "400": { description: "Missing or invalid image", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Album not found", content: jsonBody(ref("Error")) },
          "413": { description: "Image exceeds the 5 MB limit", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/gallery/{id}/media/{mediaId}": {
      delete: {
        tags: ["admin-gallery"],
        summary: "Remove an image from an album",
        ...access("manage_gallery"),
        parameters: [idParam("id"), idParam("mediaId")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Media not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/gallery/{id}/media/bulk-remove": {
      post: {
        tags: ["admin-gallery"],
        summary: "Remove a batch of photos from an album",
        ...access("manage_gallery", "`ids` are media ids."),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminBulkIdsRequest")) },
        responses: {
          "200": { description: "Photos removed", content: jsonBody(ref("BulkResult")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Album not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/gallery/{id}/media/reorder": {
      post: {
        tags: ["admin-gallery"],
        summary: "Set display order for a batch of images within an album",
        ...access("manage_gallery"),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminReorderRequest")) },
        responses: {
          "200": { description: "Order updated", content: jsonBody(ref("Ok")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Album not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/blog": {
      get: {
        tags: ["admin-blog"],
        summary: "List all posts (including drafts), newest first",
        ...access("manage_blog"),
        parameters: [
          ...pageParams,
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["published", "draft"] },
          },
          {
            name: "q",
            in: "query",
            description: "Search on title or slug.",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "A page of posts", content: jsonBody(ref("AdminBlogPostList")) },
          ...adminAuthResponses,
        },
      },
      post: {
        tags: ["admin-blog"],
        summary: "Create a post (the caller becomes the author)",
        ...access("manage_blog"),
        requestBody: { required: true, content: jsonBody(ref("AdminBlogPostCreateRequest")) },
        responses: {
          "201": { description: "Post created", content: jsonBody(ref("AdminBlogPost")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "409": { description: "Slug already exists", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/blog/{id}": {
      get: {
        tags: ["admin-blog"],
        summary: "Get a post with its author",
        ...access("manage_blog"),
        parameters: [idParam("id")],
        responses: {
          "200": { description: "The post", content: jsonBody(ref("AdminBlogPostDetail")) },
          ...adminAuthResponses,
          "404": { description: "Post not found", content: jsonBody(ref("Error")) },
        },
      },
      patch: {
        tags: ["admin-blog"],
        summary: "Update a post (first publish stamps publishedAt)",
        ...access("manage_blog"),
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminBlogPostUpdateRequest")) },
        responses: {
          "200": { description: "The updated post", content: jsonBody(ref("AdminBlogPost")) },
          "400": { description: "Validation failed or empty body", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Post not found", content: jsonBody(ref("Error")) },
          "409": { description: "Slug already exists", content: jsonBody(ref("Error")) },
        },
      },
      delete: {
        tags: ["admin-blog"],
        summary: "Delete a post",
        ...access("manage_blog"),
        parameters: [idParam("id")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Post not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/blog/bulk": {
      post: {
        tags: ["admin-blog"],
        summary: "Publish, unpublish, or delete a batch of posts",
        ...access(
          "manage_blog",
          "`publish` stamps `publishedAt` only on posts that have never been published, " +
            "matching `PATCH /admin/blog/{id}`.",
        ),
        requestBody: { required: true, content: jsonBody(ref("AdminBulkPublishRequest")) },
        responses: {
          "200": { description: "Action applied", content: jsonBody(ref("BulkResult")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
        },
      },
    },
    "/admin/blog/{id}/featured-image": {
      post: {
        tags: ["admin-blog"],
        summary: "Upload or replace a post's featured image",
        ...access("manage_blog"),
        parameters: [idParam("id")],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: imageUploadSchema } },
        },
        responses: {
          "201": { description: "Image set", content: jsonBody(ref("FeaturedImageResult")) },
          "400": { description: "Missing or invalid image", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Post not found", content: jsonBody(ref("Error")) },
          "413": { description: "Image exceeds the 5 MB limit", content: jsonBody(ref("Error")) },
        },
      },
      delete: {
        tags: ["admin-blog"],
        summary: "Remove a post's featured image",
        ...access("manage_blog"),
        parameters: [idParam("id")],
        responses: {
          "200": { description: "Removed", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": {
            description: "Post not found or has no featured image",
            content: jsonBody(ref("Error")),
          },
        },
      },
    },
    "/admin/blog/{id}/assets": {
      post: {
        tags: ["admin-blog"],
        summary: "Upload a body asset (image, video, or file) for a post",
        ...access(
          "manage_blog",
          "The returned `url` is embedded into the post body. Images and common " +
            "videos/PDFs are detected by content; anything else is stored as a " +
            "downloadable file.",
        ),
        parameters: [idParam("id")],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: assetUploadSchema } },
        },
        responses: {
          "201": { description: "Asset uploaded", content: jsonBody(ref("AdminBlogAsset")) },
          "400": { description: "Missing or empty file", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "Post not found", content: jsonBody(ref("Error")) },
          "413": { description: "File exceeds the 25 MB limit", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/blog/{id}/assets/{assetId}": {
      delete: {
        tags: ["admin-blog"],
        summary: "Delete a post's body asset",
        ...access("manage_blog"),
        parameters: [idParam("id"), idParam("assetId")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Asset not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/system/health": {
      get: {
        tags: ["admin-system"],
        summary: "Scheduled job health",
        ...access(
          "manage_system",
          "Per-job liveness, the last 24 hours of totals, a run strip to chart, " +
            "and every open fault.\n\n" +
            "`observed` against `expected` is what detects a cron that has stopped " +
            "firing — a failure no error, log line, or alert can show, because " +
            "nothing ran to produce one. Ignore it while `livenessReady` is false.",
        ),
        responses: {
          "200": { description: "Current health", content: jsonBody(ref("SystemHealth")) },
          ...adminAuthResponses,
        },
      },
    },
    "/admin/system/runs": {
      get: {
        tags: ["admin-system"],
        summary: "Scheduled run history",
        ...access(
          "manage_system",
          `Newest first. Runs are kept for ${RUN_RETENTION_DAYS} days, then pruned ` +
            "on the digest tick.",
        ),
        parameters: [
          ...pageParams,
          {
            name: "job",
            in: "query",
            description: "Filter to one job, e.g. `codeforces`.",
            schema: { type: "string" },
          },
          { name: "status", in: "query", schema: ref("CronRunStatus") },
        ],
        responses: {
          "200": { description: "A page of runs", content: jsonBody(ref("CronRunList")) },
          ...adminAuthResponses,
        },
      },
    },
    "/admin/system/notices/{key}": {
      delete: {
        tags: ["admin-system"],
        summary: "Acknowledge a fault",
        ...access(
          "manage_system",
          "Drops the fault's cooldown row. Its only purpose is to suppress repeat " +
            "mail for an hour, so clearing it means both *handled* and *tell me " +
            "immediately if it recurs* — rather than leaving the admin inside a " +
            "cooldown started by the problem they just fixed. The runs that raised " +
            "it stay in the history.",
        ),
        parameters: [
          {
            name: "key",
            in: "path",
            required: true,
            description: "Fault key, e.g. `codeforces:paging-truncated`.",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Acknowledged", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Notice not found", content: jsonBody(ref("Error")) },
        },
      },
    },
  },
};
