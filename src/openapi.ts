import { z } from "zod";

import { attendanceGiveSchema } from "./schemas/events";
import { googleSignInSchema, loginSchema, profileUpdateSchema, registerSchema } from "./schemas/auth";

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
  properties: { data: { type: "array", items: ref("Attendance") }, meta: ref("PaginationMeta") },
  required: ["data", "meta"],
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
    rank: { type: ["integer", "null"], description: "Null when unranked; unranked rows sort last." },
    solveCount: { type: "integer" },
    upsolveCount: { type: "integer" },
    participation: { type: "boolean" },
    user: ref("UserSummary"),
  },
  required: ["rank", "solveCount", "upsolveCount", "participation", "user"],
};

const performanceListSchema = {
  type: "object",
  properties: { data: { type: "array", items: ref("Performance") }, meta: ref("PaginationMeta") },
  required: ["data", "meta"],
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
    rank: { type: ["integer", "null"] },
    solveCount: { type: "integer" },
    upsolveCount: { type: "integer" },
    participation: { type: "boolean" },
  },
  required: ["eventId", "rank", "solveCount", "upsolveCount", "participation"],
};

const ranklistStandingSchema = {
  type: "object",
  properties: {
    user: ref("UserSummary"),
    score: { type: "number" },
    position: { type: "integer" },
    performance: { type: "array", items: ref("RanklistUserPerformance") },
  },
  required: ["user", "score", "position", "performance"],
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

const pageParams = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  {
    name: "perPage",
    in: "query",
    schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
  },
];

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
    { name: "files", description: "Stored object serving" },
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
      RegisterRequest: toSchema(registerSchema),
      LoginRequest: toSchema(loginSchema),
      GoogleSignInRequest: toSchema(googleSignInSchema),
      ProfileUpdateRequest: toSchema(profileUpdateSchema),
      AttendanceRequest: toSchema(attendanceGiveSchema),
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
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
          ...pageParams,
        ],
        responses: {
          "200": { description: "A page of attendees", content: jsonBody(ref("AttendanceList")) },
          "404": { description: "Event not found", content: jsonBody(ref("Error")) },
        },
      },
    },
    "/events/{id}/performance": {
      get: {
        tags: ["events"],
        summary: "Event performance leaderboard (ordered by rank)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
          ...pageParams,
        ],
        responses: {
          "200": {
            description: "A page of performance rows",
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
  },
};
