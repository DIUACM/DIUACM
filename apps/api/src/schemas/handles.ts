import { z } from "zod";

// The competitive-programming platforms a user can register a handle for.
// VJudge may have multiple rows per user; the other platforms have at most one.
// A handle value is unique within its type.
export const HANDLE_TYPES = ["codeforces", "vjudge", "atcoder"] as const;
export type HandleType = (typeof HANDLE_TYPES)[number];

// Validates the `:type` path segment on the handle-management routes.
export const handleTypeParam = z.object({
  type: z.enum(HANDLE_TYPES),
});

export const handleIdParam = z.object({
  handleId: z.coerce.number().int().positive(),
});

export const handleDeleteParam = handleTypeParam.extend(handleIdParam.shape);

export const handleSetSchema = z.object({
  handle: z.string().trim().min(1).max(100),
});

export type HandleSetInput = z.infer<typeof handleSetSchema>;
