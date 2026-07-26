import type { Permission, User } from "../db/schema";
import { effectivePermissions } from "./permissions";
import { HANDLE_TYPES, type HandleType } from "../schemas/handles";

type UserRow = Pick<
  User,
  | "id"
  | "name"
  | "email"
  | "username"
  | "studentId"
  | "imageKey"
  | "maxCfRating"
  | "createdAt"
  | "updatedAt"
>;

/** Admin-panel access attached to a user shape: granted permissions + super-admin flag. */
export type UserAccess = {
  permissions: Permission[];
  isSuperAdmin: boolean;
};

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
export const toAuthUser = (row: UserRow, origin: string, access: UserAccess) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  username: row.username,
  studentId: row.studentId,
  image: imageUrlFor(origin, row.imageKey),
  maxCfRating: row.maxCfRating,
  // Effective permissions: the super admin reports all of them.
  permissions: effectivePermissions(access.permissions, access.isSuperAdmin),
  isSuperAdmin: access.isSuperAdmin,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export type AuthUser = ReturnType<typeof toAuthUser>;

/** Minimal public user reference embedded in lists (e.g. event attendance). */
export const toUserSummary = (
  row: Pick<User, "id" | "name" | "username" | "imageKey">,
  origin: string,
) => ({
  id: row.id,
  name: row.name,
  username: row.username,
  image: imageUrlFor(origin, row.imageKey),
});

export type UserSummary = ReturnType<typeof toUserSummary>;

export type HandleEntry = {
  id: number;
  handle: string;
};

/** Group a user's handle rows by platform, retaining ids for individual deletion. */
export const toHandlesMap = (
  rows: { id: number; type: HandleType; handle: string }[],
): Record<HandleType, HandleEntry[]> => {
  const map: Record<HandleType, HandleEntry[]> = {
    codeforces: [],
    vjudge: [],
    atcoder: [],
  };
  for (const row of rows) map[row.type].push({ id: row.id, handle: row.handle });
  for (const type of HANDLE_TYPES) map[type].sort((a, b) => a.id - b.id);
  return map;
};

export type HandlesMap = ReturnType<typeof toHandlesMap>;

/** Public programmer-directory item: a user summary plus rating and handles. */
export const toProgrammerListItem = (
  row: Pick<User, "id" | "name" | "username" | "imageKey" | "maxCfRating">,
  handleRows: { id: number; type: HandleType; handle: string }[],
  origin: string,
) => ({
  id: row.id,
  name: row.name,
  username: row.username,
  image: imageUrlFor(origin, row.imageKey),
  maxCfRating: row.maxCfRating,
  handles: toHandlesMap(handleRows),
});

export type ProgrammerListItem = ReturnType<typeof toProgrammerListItem>;
