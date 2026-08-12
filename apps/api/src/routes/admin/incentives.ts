import { and, count, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getDb } from "../../db/client";
import { incentiveApplications } from "../../db/schema";
import { likeContains } from "../../lib/like";
import { buildMeta } from "../../lib/pagination";
import { parseId } from "../../lib/parse-id";
import { toUserSummary } from "../../lib/user-shape";
import { validate } from "../../lib/validator";
import { requirePermission } from "../../middleware/auth";
import { adminBulkIdsSchema } from "../../schemas/admin";
import { adminIncentiveApplicationsListQuery } from "../../schemas/incentives";
import type { AppEnv } from "../../types";

// Every application column. The applicant's own details are typed into the
// form, so the joined account is carried alongside them: it is the only way to
// tell which DIUACM user filed an application whose details don't match their
// profile.
const applicationQuery = {
  columns: {
    id: true,
    userId: true,
    fullName: true,
    studentId: true,
    batch: true,
    email: true,
    currentSemester: true,
    phoneNumber: true,
    courses: true,
    createdAt: true,
    updatedAt: true,
  },
  with: {
    user: {
      columns: {
        id: true,
        name: true,
        username: true,
        imageKey: true,
        isBanned: true,
        banReason: true,
      },
    },
  },
} as const;

type ApplicantRow = Parameters<typeof toUserSummary>[0];

// Rename the joined row to `applicant` — "user" alone reads ambiguously next to
// the application's own typed-in identity fields. Generic so the application
// columns keep their inferred types.
const shapeApplication = <T extends { user: ApplicantRow | null }>(
  { user, ...application }: T,
  origin: string,
) => ({
  ...application,
  applicant: user ? toUserSummary(user, origin) : null,
});

const manageIncentives = requirePermission("manage_incentives");

const adminIncentiveRoutes = new Hono<AppEnv>();

// All applications, newest first. Searchable across the typed-in details;
// filterable by batch and semester.
adminIncentiveRoutes.get(
  "/",
  manageIncentives,
  validate("query", adminIncentiveApplicationsListQuery),
  async (c) => {
    const { page, perPage, q, batch, semester } = c.req.valid("query");
    const db = getDb(c.env.DB);
    const origin = new URL(c.req.url).origin;

    const filters: SQL[] = [];
    if (batch) filters.push(eq(incentiveApplications.batch, batch));
    if (semester) filters.push(eq(incentiveApplications.currentSemester, semester));
    if (q) {
      const expr = or(
        likeContains(incentiveApplications.fullName, q),
        likeContains(incentiveApplications.studentId, q),
        likeContains(incentiveApplications.email, q),
        likeContains(incentiveApplications.phoneNumber, q),
        likeContains(incentiveApplications.batch, q),
      );
      if (expr) filters.push(expr);
    }
    const where = filters.length > 0 ? and(...filters) : undefined;

    const [rows, [{ value: total }]] = await Promise.all([
      db.query.incentiveApplications.findMany({
        ...applicationQuery,
        where,
        orderBy: [desc(incentiveApplications.createdAt), desc(incentiveApplications.id)],
        limit: perPage,
        offset: (page - 1) * perPage,
      }),
      db.select({ value: count() }).from(incentiveApplications).where(where),
    ]);

    return c.json({
      data: rows.map((row) => shapeApplication(row, origin)),
      meta: buildMeta(page, perPage, total),
    });
  },
);

// Values present in the data, for the list page's filter dropdowns. Deliberately
// unfiltered: an option must not disappear once it is selected, or the user
// could never switch away from it.
adminIncentiveRoutes.get("/filters", manageIncentives, async (c) => {
  const db = getDb(c.env.DB);

  const [batches, semesters] = await Promise.all([
    db
      .selectDistinct({ value: incentiveApplications.batch })
      .from(incentiveApplications)
      .orderBy(sql`${incentiveApplications.batch} COLLATE NOCASE`),
    db
      .selectDistinct({ value: incentiveApplications.currentSemester })
      .from(incentiveApplications)
      .orderBy(sql`${incentiveApplications.currentSemester} COLLATE NOCASE`),
  ]);

  return c.json({
    batches: batches.map((row) => row.value),
    semesters: semesters.map((row) => row.value),
  });
});

adminIncentiveRoutes.get("/:id", manageIncentives, async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "Application not found" });

  const db = getDb(c.env.DB);
  const row = await db.query.incentiveApplications.findFirst({
    ...applicationQuery,
    where: eq(incentiveApplications.id, id),
  });
  if (!row) throw new HTTPException(404, { message: "Application not found" });

  return c.json({ application: shapeApplication(row, new URL(c.req.url).origin) });
});

adminIncentiveRoutes.delete("/:id", manageIncentives, async (c) => {
  const id = parseId(c.req.param("id"));
  if (id === null) throw new HTTPException(404, { message: "Application not found" });

  const db = getDb(c.env.DB);
  const [deleted] = await db
    .delete(incentiveApplications)
    .where(eq(incentiveApplications.id, id))
    .returning({ id: incentiveApplications.id });
  if (!deleted) throw new HTTPException(404, { message: "Application not found" });

  return c.json({ ok: true });
});

adminIncentiveRoutes.post(
  "/bulk-delete",
  manageIncentives,
  validate("json", adminBulkIdsSchema),
  async (c) => {
    const { ids } = c.req.valid("json");
    const db = getDb(c.env.DB);

    const deleted = await db
      .delete(incentiveApplications)
      .where(inArray(incentiveApplications.id, ids))
      .returning({ id: incentiveApplications.id });

    return c.json({ ok: true, affected: deleted.length });
  },
);

export default adminIncentiveRoutes;
