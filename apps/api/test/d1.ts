import type Database from "better-sqlite3";

type ShimStatement = { sql: string; params: unknown[] };

const meta = (changes: number) => ({ changes, duration: 0, success: true });

/**
 * The slice of the D1 API the sync jobs use, backed by the in-memory test
 * database. Enough to run the real SQL — real triggers included — without a
 * workerd pool.
 */
export function d1Shim(db: Database.Database): D1Database {
  const run = (statement: ShimStatement) => {
    const prepared = db.prepare(statement.sql);
    // better-sqlite3 refuses run() on anything that yields rows, which the
    // performance upsert does via RETURNING.
    if (prepared.reader) {
      const results = prepared.all(...(statement.params as never[]));
      return { results, success: true, meta: meta(results.length) };
    }
    const info = prepared.run(...(statement.params as never[]));
    return { results: [], success: true, meta: meta(info.changes) };
  };

  const prepare = (sql: string, params: unknown[] = []) => {
    const statement: ShimStatement = { sql, params };
    return {
      ...statement,
      // D1's bind returns a new statement rather than mutating, and the sync
      // code relies on that to reuse one prepared upsert across many rows.
      bind: (...values: unknown[]) => prepare(sql, values),
      all: async () => ({
        results: db.prepare(sql).all(...(params as never[])),
        success: true,
        meta: meta(0),
      }),
      first: async () => db.prepare(sql).get(...(params as never[])) ?? null,
      run: async () => run(statement),
    } as unknown as D1PreparedStatement;
  };

  return {
    prepare: (sql: string) => prepare(sql),
    // D1 runs a batch in an implicit transaction; match that, so a failure
    // mid-batch cannot leave half a user's counts written.
    batch: async (statements: D1PreparedStatement[]) =>
      db.transaction(() =>
        statements.map((s) => run(s as unknown as ShimStatement)),
      )(),
  } as unknown as D1Database;
}
