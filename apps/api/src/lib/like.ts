import { sql, type AnyColumn, type SQL } from "drizzle-orm";

/**
 * Case-insensitive substring match with LIKE wildcards escaped, so a search
 * for "user_a" matches the literal underscore instead of any character.
 * Equivalent to `column LIKE '%q%' ESCAPE '\'`.
 */
export const likeContains = (column: AnyColumn, q: string): SQL => {
  const escaped = q.replace(/[\\%_]/g, (ch) => `\\${ch}`);
  return sql`${column} LIKE ${`%${escaped}%`} ESCAPE '\\'`;
};
