import { z } from "zod";

import {
  adminAttendanceAddSchema,
  adminEventCreateSchema,
  adminEventUpdateSchema,
  adminPerformanceSetSchema,
  adminRanklistCreateSchema,
  adminRanklistEventSetSchema,
  adminRanklistUpdateSchema,
  adminTrackerCreateSchema,
  adminTrackerUpdateSchema,
  adminUserCreateSchema,
  adminUserUpdateSchema,
} from "./schemas/admin";
import { googleSignInSchema, loginSchema, profileUpdateSchema, registerSchema } from "./schemas/auth";
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
    role: { type: "string", enum: ["user", "admin"] },
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
    "role",
    "createdAt",
    "updatedAt",
  ],
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
  },
  required: [
    "keyword",
    "userCount",
    "eventCount",
    "upsolveWeight",
    "isLocked",
    "considerStrictAttendance",
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

const handlesMapSchema = {
  type: "object",
  description: "A user's handles keyed by platform; each value is the handle or null.",
  properties: {
    codeforces: { type: ["string", "null"] },
    vjudge: { type: ["string", "null"] },
    atcoder: { type: ["string", "null"] },
  },
  required: ["codeforces", "vjudge", "atcoder"],
};

const handlesResponseSchema = {
  type: "object",
  properties: { handles: ref("HandlesMap") },
  required: ["handles"],
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

const adminTrackerProps = {
  id: { type: "integer" },
  title: { type: "string" },
  description: { type: "string" },
  slug: { type: "string" },
  status: { type: "string", enum: ["published", "draft"] },
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
  },
  required: ["user", "score", "rank"],
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
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  {
    name: "perPage",
    in: "query",
    schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
  },
];

const idParam = (name: string) => ({
  name,
  in: "path",
  required: true,
  schema: { type: "integer" },
});

// Every admin endpoint returns these when the caller isn't an admin.
const adminAuthResponses = {
  "401": { description: "Missing or invalid token", content: jsonBody(ref("Error")) },
  "403": { description: "Caller is not an admin", content: jsonBody(ref("Error")) },
};

export const openApiDoc = {
  openapi: "3.1.0",
  info: {
    title: "diuacm API",
    version: "0.1.0",
    description:
      "Backend API for diuacm. Authenticate via `/auth/register`, `/auth/login` " +
      "(email or username), or `/auth/google` (Google sign-in, @diu.edu.bd only), " +
      "then send the returned JWT as `Authorization: Bearer <token>`.",
  },
  servers: [{ url: "/", description: "Current origin" }],
  tags: [
    { name: "meta", description: "Service metadata" },
    { name: "auth", description: "Registration, login, Google sign-in, and the current user" },
    { name: "events", description: "Events, media, and attendance" },
    { name: "trackers", description: "Trackers and their ranklists" },
    { name: "programmers", description: "Programmer directory, handles, and tracker performance" },
    { name: "files", description: "Stored object serving" },
    {
      name: "admin",
      description:
        "Management APIs — require a bearer token for a user whose role is `admin`. " +
        "Drafts are visible and events include their password.",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      User: userSchema,
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
      HandlesMap: handlesMapSchema,
      HandlesResponse: handlesResponseSchema,
      ProgrammerListItem: programmerListItemSchema,
      ProgrammerList: programmerListSchema,
      TrackerPerformanceRanklist: trackerPerformanceRanklistSchema,
      TrackerPerformanceEntry: trackerPerformanceEntrySchema,
      ProgrammerDetail: programmerDetailSchema,
      RegisterRequest: toSchema(registerSchema),
      LoginRequest: toSchema(loginSchema),
      GoogleSignInRequest: toSchema(googleSignInSchema),
      ProfileUpdateRequest: toSchema(profileUpdateSchema),
      AttendanceRequest: toSchema(attendanceGiveSchema),
      HandleSetRequest: toSchema(handleSetSchema),
      Ok: okSchema,
      UserList: userListSchema,
      AdminUserDetail: adminUserDetailSchema,
      AdminEvent: adminEventSchema,
      AdminEventDetail: adminEventDetailSchema,
      AdminEventList: adminEventListSchema,
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
      AdminEventCreateRequest: toSchema(adminEventCreateSchema),
      AdminEventUpdateRequest: toSchema(adminEventUpdateSchema),
      AdminAttendanceAddRequest: toSchema(adminAttendanceAddSchema),
      AdminPerformanceSetRequest: toSchema(adminPerformanceSetSchema),
      AdminTrackerCreateRequest: toSchema(adminTrackerCreateSchema),
      AdminTrackerUpdateRequest: toSchema(adminTrackerUpdateSchema),
      AdminRanklistCreateRequest: toSchema(adminRanklistCreateSchema),
      AdminRanklistUpdateRequest: toSchema(adminRanklistUpdateSchema),
      AdminRanklistEventSetRequest: toSchema(adminRanklistEventSetSchema),
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["meta"],
        summary: "Health check",
        responses: {
          "200": { description: "Service is up", content: jsonBody(ref("Health")) },
        },
      },
    },
    "/auth/config": {
      get: {
        tags: ["auth"],
        summary: "Public auth configuration",
        responses: {
          "200": { description: "Auth config", content: jsonBody(ref("AuthConfig")) },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["auth"],
        summary: "Register a new user",
        requestBody: { required: true, content: jsonBody(ref("RegisterRequest")) },
        responses: {
          "201": { description: "User created", content: jsonBody(ref("AuthResponse")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          "409": {
            description: "Email, username, or student id already exists",
            content: jsonBody(ref("Error")),
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Log in with email or username and password",
        requestBody: { required: true, content: jsonBody(ref("LoginRequest")) },
        responses: {
          "200": { description: "Authenticated", content: jsonBody(ref("AuthResponse")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          "401": { description: "Invalid credentials", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/auth/google": {
      post: {
        tags: ["auth"],
        summary: "Sign in with a Google ID token (@diu.edu.bd only)",
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
            description: "Email domain not allowed",
            content: jsonBody(ref("Error")),
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["auth"],
        summary: "Get the current user",
        security: [{ bearerAuth: [] }],
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
        security: [{ bearerAuth: [] }],
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
        security: [{ bearerAuth: [] }],
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
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "The handles map", content: jsonBody(ref("HandlesResponse")) },
          "401": { description: "Missing or invalid token", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/auth/me/handles/{type}": {
      put: {
        tags: ["programmers"],
        summary: "Set (create or replace) the current user's handle for a platform",
        security: [{ bearerAuth: [] }],
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
          "409": {
            description: "Handle already taken by another user for this platform",
            content: jsonBody(ref("Error")),
          },
        },
      },
      delete: {
        tags: ["programmers"],
        summary: "Remove the current user's handle for a platform",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "type",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["codeforces", "vjudge", "atcoder"] },
          },
        ],
        responses: {
          "200": { description: "The updated handles map", content: jsonBody(ref("HandlesResponse")) },
          "401": { description: "Missing or invalid token", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/events": {
      get: {
        tags: ["events"],
        summary: "List published events",
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
        description:
          "Requires the correct event password and that the current time is within the " +
          "attendance window (15 minutes before start to 15 minutes after end).",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: jsonBody(ref("AttendanceRequest")) },
        responses: {
          "201": { description: "Attendance recorded", content: jsonBody(ref("AttendanceResult")) },
          "400": { description: "Validation failed", content: jsonBody(ref("Error")) },
          "401": {
            description: "Missing token or incorrect event password",
            content: jsonBody(ref("Error")),
          },
          "403": {
            description: "Attendance not open, or outside the attendance window",
            content: jsonBody(ref("Error")),
          },
          "404": { description: "Event not found", content: jsonBody(ref("Error")) },
          "409": { description: "Attendance already recorded", content: jsonBody(ref("Error")) },
        },
      },
      get: {
        tags: ["events"],
        summary: "List attendees of an event",
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
        description:
          "Ordered by max Codeforces rating (unrated users last), then name. " +
          "Searchable on name and username via `q`.",
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
        parameters: [
          { name: "username", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "The programmer", content: jsonBody(ref("ProgrammerDetail")) },
          "404": { description: "Not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/files/{key}": {
      get: {
        tags: ["files"],
        summary: "Stream a stored object (e.g. a profile image)",
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
        tags: ["admin"],
        summary: "List all users",
        security: [{ bearerAuth: [] }],
        parameters: [
          ...pageParams,
          {
            name: "q",
            in: "query",
            description: "Search on name, username, email, or student id.",
            schema: { type: "string" },
          },
          { name: "role", in: "query", schema: { type: "string", enum: ["user", "admin"] } },
        ],
        responses: {
          "200": { description: "A page of users", content: jsonBody(ref("UserList")) },
          ...adminAuthResponses,
        },
      },
      post: {
        tags: ["admin"],
        summary: "Create a user",
        security: [{ bearerAuth: [] }],
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
        tags: ["admin"],
        summary: "Get a user with their handles",
        security: [{ bearerAuth: [] }],
        parameters: [idParam("id")],
        responses: {
          "200": { description: "The user", content: jsonBody(ref("AdminUserDetail")) },
          ...adminAuthResponses,
          "404": { description: "User not found", content: jsonBody(ref("Error")) },
        },
      },
      patch: {
        tags: ["admin"],
        summary: "Update a user (including role and password)",
        security: [{ bearerAuth: [] }],
        parameters: [idParam("id")],
        requestBody: { required: true, content: jsonBody(ref("AdminUserUpdateRequest")) },
        responses: {
          "200": { description: "The updated user", content: jsonBody(ref("UserResponse")) },
          "400": {
            description: "Validation failed, empty body, or self-demotion",
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
        tags: ["admin"],
        summary: "Delete a user (cascades handles, attendance, performance, memberships)",
        security: [{ bearerAuth: [] }],
        parameters: [idParam("id")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          "400": { description: "You cannot delete yourself", content: jsonBody(ref("Error")) },
          ...adminAuthResponses,
          "404": { description: "User not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/events": {
      get: {
        tags: ["admin"],
        summary: "List all events (including drafts)",
        security: [{ bearerAuth: [] }],
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
        tags: ["admin"],
        summary: "Create an event",
        security: [{ bearerAuth: [] }],
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
    "/admin/events/{id}": {
      get: {
        tags: ["admin"],
        summary: "Get an event with its media (any status; includes eventPassword)",
        security: [{ bearerAuth: [] }],
        parameters: [idParam("id")],
        responses: {
          "200": { description: "The event", content: jsonBody(ref("AdminEventDetail")) },
          ...adminAuthResponses,
          "404": { description: "Event not found", content: jsonBody(ref("Error")) },
        },
      },
      patch: {
        tags: ["admin"],
        summary: "Update an event",
        security: [{ bearerAuth: [] }],
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
        tags: ["admin"],
        summary: "Delete an event (cascades media, attendance, performance, ranklist links)",
        security: [{ bearerAuth: [] }],
        parameters: [idParam("id")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Event not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/events/{id}/media": {
      post: {
        tags: ["admin"],
        summary: "Add an image to an event's media (appended last)",
        security: [{ bearerAuth: [] }],
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
        tags: ["admin"],
        summary: "Remove a media item from an event",
        security: [{ bearerAuth: [] }],
        parameters: [idParam("id"), idParam("mediaId")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Media not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/events/{id}/attendance": {
      post: {
        tags: ["admin"],
        summary: "Record attendance for any user (no password or window checks)",
        security: [{ bearerAuth: [] }],
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
        tags: ["admin"],
        summary: "Remove a user's attendance from an event",
        security: [{ bearerAuth: [] }],
        parameters: [idParam("id"), idParam("userId")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Attendance not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/events/{id}/performance/{userId}": {
      put: {
        tags: ["admin"],
        summary: "Create or replace a user's performance row for an event",
        description:
          "Full-replace semantics: omitted fields fall back to their defaults " +
          "(position null, counts 0). Ranklist scores and ranks recalculate automatically.",
        security: [{ bearerAuth: [] }],
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
        tags: ["admin"],
        summary: "Delete a user's performance row for an event",
        security: [{ bearerAuth: [] }],
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
        tags: ["admin"],
        summary: "List all trackers (including drafts)",
        security: [{ bearerAuth: [] }],
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
        tags: ["admin"],
        summary: "Create a tracker",
        security: [{ bearerAuth: [] }],
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
        tags: ["admin"],
        summary: "Get a tracker with all of its ranklists",
        security: [{ bearerAuth: [] }],
        parameters: [idParam("id")],
        responses: {
          "200": { description: "The tracker", content: jsonBody(ref("AdminTrackerDetail")) },
          ...adminAuthResponses,
          "404": { description: "Tracker not found", content: jsonBody(ref("Error")) },
        },
      },
      patch: {
        tags: ["admin"],
        summary: "Update a tracker",
        security: [{ bearerAuth: [] }],
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
        tags: ["admin"],
        summary: "Delete a tracker (cascades its ranklists)",
        security: [{ bearerAuth: [] }],
        parameters: [idParam("id")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Tracker not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/trackers/{id}/ranklists": {
      post: {
        tags: ["admin"],
        summary: "Create a ranklist under a tracker",
        security: [{ bearerAuth: [] }],
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
        tags: ["admin"],
        summary: "Get a ranklist with its events (weights) and users (scores, ranks)",
        security: [{ bearerAuth: [] }],
        parameters: [idParam("id")],
        responses: {
          "200": { description: "The ranklist", content: jsonBody(ref("AdminRanklistDetail")) },
          ...adminAuthResponses,
          "404": { description: "Ranklist not found", content: jsonBody(ref("Error")) },
        },
      },
      patch: {
        tags: ["admin"],
        summary: "Update a ranklist (weight changes recalculate scores)",
        security: [{ bearerAuth: [] }],
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
        tags: ["admin"],
        summary: "Delete a ranklist",
        security: [{ bearerAuth: [] }],
        parameters: [idParam("id")],
        responses: {
          "200": { description: "Deleted", content: jsonBody(ref("Ok")) },
          ...adminAuthResponses,
          "404": { description: "Ranklist not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/admin/ranklists/{id}/events/{eventId}": {
      put: {
        tags: ["admin"],
        summary: "Attach an event to a ranklist, or update its weight",
        security: [{ bearerAuth: [] }],
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
        tags: ["admin"],
        summary: "Detach an event from a ranklist",
        security: [{ bearerAuth: [] }],
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
    "/admin/ranklists/{id}/users/{userId}": {
      put: {
        tags: ["admin"],
        summary: "Add a user to a ranklist (idempotent)",
        security: [{ bearerAuth: [] }],
        parameters: [idParam("id"), idParam("userId")],
        responses: {
          "200": { description: "Membership ensured", content: jsonBody(ref("RanklistUserSetResult")) },
          ...adminAuthResponses,
          "404": { description: "Ranklist or user not found", content: jsonBody(ref("Error")) },
        },
      },
      delete: {
        tags: ["admin"],
        summary: "Remove a user from a ranklist",
        security: [{ bearerAuth: [] }],
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
  },
};
