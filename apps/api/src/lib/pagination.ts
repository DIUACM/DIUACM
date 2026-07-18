import { z } from "zod";

/**
 * Shared pagination query fields. Spread into a route's query schema:
 *   z.object({ ...pageFields, type: ... })
 * `page` is 1-based; `perPage` is clamped to [1, 100] (default 20).
 */
export const pageFields = {
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
};

/** Build the `meta` block returned alongside a paginated `data` array. */
export const buildMeta = (page: number, perPage: number, total: number) => ({
  page,
  perPage,
  total,
  totalPages: Math.max(1, Math.ceil(total / perPage)),
});
