import type { User } from "../db/schema";

type UserRow = Pick<
  User,
  "id" | "name" | "email" | "username" | "studentId" | "imageKey" | "createdAt" | "updatedAt"
>;

/** Build the absolute, worker-served URL for a stored object key (served by `GET /files/:key`). */
export const fileUrlFor = (origin: string, key: string | null): string | null =>
  key ? `${origin}/files/${key}` : null;

/** Build the absolute, worker-served URL for a stored image key. */
export const imageUrlFor = (origin: string, imageKey: string | null): string | null =>
  fileUrlFor(origin, imageKey);

/**
 * The public-safe user shape returned by auth endpoints. Centralised so every
 * endpoint that exposes a user stays in sync. Never includes `passwordHash`.
 * `origin` is the request origin (e.g. `https://api.example.com`) used to build
 * absolute image URLs.
 */
export const toAuthUser = (row: UserRow, origin: string) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  username: row.username,
  studentId: row.studentId,
  image: imageUrlFor(origin, row.imageKey),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export type AuthUser = ReturnType<typeof toAuthUser>;
