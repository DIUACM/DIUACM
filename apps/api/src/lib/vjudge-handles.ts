export const SELF_VJUDGE_INSERT_SQL = `
  INSERT INTO user_handles (user_id, type, handle, created_at, updated_at)
  SELECT ?, 'vjudge', ?, ?, ?
  WHERE NOT EXISTS (
    SELECT 1 FROM user_handles WHERE user_id = ? AND type = 'vjudge'
  )
`;

export const SELF_VJUDGE_UPDATE_SQL = `
  UPDATE user_handles
  SET handle = ?, updated_at = ?
  WHERE user_id = ? AND type = 'vjudge'
    AND (
      SELECT COUNT(*) FROM user_handles
      WHERE user_id = ? AND type = 'vjudge'
    ) = 1
`;

/**
 * Create a user's first VJudge handle, or edit it only while it is their sole
 * VJudge handle. The count checks live inside the write statements so
 * concurrent requests cannot create or edit an admin-managed multi-handle set.
 */
export const setSelfVjudgeHandle = async (
  d1: D1Database,
  userId: number,
  handle: string,
  updatedAt: number,
): Promise<"inserted" | "updated" | "multiple"> => {
  const inserted = await d1
    .prepare(SELF_VJUDGE_INSERT_SQL)
    .bind(userId, handle, updatedAt, updatedAt, userId)
    .run();
  if (inserted.meta.changes > 0) return "inserted";

  const updated = await d1
    .prepare(SELF_VJUDGE_UPDATE_SQL)
    .bind(handle, updatedAt, userId, userId)
    .run();
  return updated.meta.changes > 0 ? "updated" : "multiple";
};
