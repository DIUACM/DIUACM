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
  | "isBanned"
  | "banReason"
  | "createdAt"
  | "updatedAt"
>;

/** Admin-panel access attached to a user shape: granted permissions + super-admin flag. */
export type UserAccess = {
  permissions: Permission[];
  isSuperAdmin: boolean;
};

const PRODUCTION_API_ORIGIN = "https://api.diuacm.com";
const PRODUCTION_R2_ORIGIN = "https://r2.diuacm.com";

/**
 * Build the public URL for a stored object key. Production reads go directly
 * through R2's custom domain, avoiding an API Worker invocation. Local and
 * non-production environments retain the Worker-backed `/files` route so R2
 * emulation and preview deployments continue to work without extra setup.
 */
export const fileUrlFor = (origin: string, key: string | null): string | null => {
  if (!key) return null;
  const base = origin === PRODUCTION_API_ORIGIN ? PRODUCTION_R2_ORIGIN : `${origin}/files`;
  return `${base}/${key}`;
};

/** Build the absolute public URL for a stored image key. */
export const imageUrlFor = (origin: string, imageKey: string | null): string | null =>
  fileUrlFor(origin, imageKey);

/**
 * The public-safe user shape returned by auth endpoints. Centralised so every
 * endpoint that exposes a user stays in sync. Never includes `passwordHash`.
 * `origin` is the request origin used to select the production R2 hostname or
 * the local/preview Worker-backed file route.
 */
export const toAuthUser = (row: UserRow, origin: string, access: UserAccess) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  username: row.username,
  studentId: row.studentId,
  image: imageUrlFor(origin, row.imageKey),
  maxCfRating: row.maxCfRating,
  isBanned: row.isBanned,
  banReason: row.banReason,
  // Effective permissions: the super admin reports all of them.
  permissions: effectivePermissions(access.permissions, access.isSuperAdmin),
  isSuperAdmin: access.isSuperAdmin,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export type AuthUser = ReturnType<typeof toAuthUser>;

/** Minimal public user reference embedded in lists (e.g. event attendance). */
export const toUserSummary = (
  row: Pick<User, "id" | "name" | "username" | "imageKey" | "isBanned" | "banReason">,
  origin: string,
) => ({
  id: row.id,
  name: row.name,
  username: row.username,
  image: imageUrlFor(origin, row.imageKey),
  isBanned: row.isBanned,
  banReason: row.banReason,
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
  row: Pick<
    User,
    "id" | "name" | "username" | "imageKey" | "maxCfRating" | "isBanned" | "banReason"
  >,
  handleRows: { id: number; type: HandleType; handle: string }[],
  origin: string,
) => ({
  id: row.id,
  name: row.name,
  username: row.username,
  image: imageUrlFor(origin, row.imageKey),
  maxCfRating: row.maxCfRating,
  isBanned: row.isBanned,
  banReason: row.banReason,
  handles: toHandlesMap(handleRows),
});

export type ProgrammerListItem = ReturnType<typeof toProgrammerListItem>;
