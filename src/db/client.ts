import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

/** Build a Drizzle client bound to the request's D1 database. */
export const getDb = (d1: D1Database) => drizzle(d1, { schema });

export type Db = ReturnType<typeof getDb>;
