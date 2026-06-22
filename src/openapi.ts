import { z } from "zod";

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
    createdAt: { type: "integer", description: "Unix epoch seconds (UTC)." },
    updatedAt: { type: "integer", description: "Unix epoch seconds (UTC)." },
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
    timestamp: { type: "integer", description: "Unix epoch seconds (UTC)." },
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
    { name: "files", description: "Stored object serving" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      User: userSchema,
      AuthResponse: authResponseSchema,
      UserResponse: userResponseSchema,
      AuthConfig: authConfigSchema,
      Error: errorSchema,
      Health: healthSchema,
      RegisterRequest: toSchema(registerSchema),
      LoginRequest: toSchema(loginSchema),
      GoogleSignInRequest: toSchema(googleSignInSchema),
      ProfileUpdateRequest: toSchema(profileUpdateSchema),
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
