import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../src/index";
import { signAuthToken } from "../src/lib/jwt";
import { d1Shim } from "./d1";
import { insertUser, openTestDb } from "./db";

const JWT_SECRET = "test-secret";

const course = (overrides: Record<string, string> = {}) => ({
  courseName: "Algorithms",
  courseCode: "CSE221",
  teacherName: "Jane Doe",
  teacherInitial: "JD",
  section: "A",
  teacherEmail: "jd@diu.edu.bd",
  teacherPhone: "01700000000",
  ...overrides,
});

const application = (overrides: Record<string, unknown> = {}) => ({
  fullName: "Student One",
  studentId: "201-15-1000",
  batch: "CSE 65",
  currentSemester: "Fall 2025",
  phoneNumber: "01800000000",
  courses: [course()],
  ...overrides,
});

type ApplicationBody = {
  application: {
    id: number;
    userId: number;
    fullName: string;
    studentId: string;
    batch: string;
    email: string;
    currentSemester: string;
    phoneNumber: string;
    courses: { courseName: string; teacherName: string }[];
    createdAt: number;
    updatedAt: number;
  } | null;
};

describe("incentive applications", () => {
  let db: Database.Database;
  let env: Record<string, unknown>;

  const tokenFor = (userId: number, username: string) =>
    signAuthToken({ id: userId, username }, JWT_SECRET);

  const call = async (path: string, token: string, init: RequestInit = {}) =>
    app.request(
      path,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init.body ? { "Content-Type": "application/json" } : {}),
        },
      },
      env,
    );

  const submit = (token: string, body: unknown) =>
    call("/incentive-applications/me", token, {
      method: "PUT",
      body: JSON.stringify(body),
    });

  beforeEach(() => {
    db = openTestDb();
    env = {
      DB: d1Shim(db),
      JWT_SECRET,
      SUPER_ADMIN_EMAIL: "super@example.com",
      CORS_ORIGINS: "",
    };

    // 1 and 2 are ordinary applicants. 3 reviews applications; 4 holds a
    // different admin permission, to prove it does not carry over.
    insertUser(db, 1);
    insertUser(db, 2);
    insertUser(db, 3);
    db.prepare(
      "INSERT INTO user_permissions (user_id, permission) VALUES (3, 'manage_incentives')",
    ).run();
    insertUser(db, 4);
    db.prepare(
      "INSERT INTO user_permissions (user_id, permission) VALUES (4, 'manage_blog')",
    ).run();
  });

  describe("GET /incentive-applications/me", () => {
    it("returns null rather than 404 before the user has applied", async () => {
      const res = await call("/incentive-applications/me", await tokenFor(1, "user1"));
      expect(res.status).toBe(200);
      expect(((await res.json()) as ApplicationBody).application).toBeNull();
    });

    it("refuses an anonymous caller", async () => {
      const res = await app.request("/incentive-applications/me", {}, env);
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /incentive-applications/me", () => {
    it("stores the application and reads it back", async () => {
      const token = await tokenFor(1, "user1");
      const res = await submit(token, application());
      expect(res.status).toBe(200);

      const saved = ((await res.json()) as ApplicationBody).application;
      expect(saved).toMatchObject({
        userId: 1,
        fullName: "Student One",
        batch: "CSE 65",
        currentSemester: "Fall 2025",
      });
      // The courses array survives the JSON round-trip through the text column.
      expect(saved?.courses).toHaveLength(1);
      expect(saved?.courses[0]).toMatchObject({ courseName: "Algorithms" });

      const readBack = await call("/incentive-applications/me", token);
      expect(((await readBack.json()) as ApplicationBody).application?.id).toBe(saved?.id);
    });

    it("records the account's email, ignoring any email in the body", async () => {
      const res = await submit(
        await tokenFor(1, "user1"),
        { ...application(), email: "spoofed@example.com" },
      );

      expect(((await res.json()) as ApplicationBody).application?.email).toBe(
        "user1@example.com",
      );
    });

    it("overwrites the existing application instead of creating a second one", async () => {
      const token = await tokenFor(1, "user1");
      const first = await submit(token, application());
      const firstId = ((await first.json()) as ApplicationBody).application?.id;

      const second = await submit(
        token,
        application({ fullName: "Renamed Student", courses: [course(), course()] }),
      );
      expect(second.status).toBe(200);

      const updated = ((await second.json()) as ApplicationBody).application;
      expect(updated?.id).toBe(firstId);
      expect(updated?.fullName).toBe("Renamed Student");
      expect(updated?.courses).toHaveLength(2);

      const rows = db
        .prepare("SELECT COUNT(*) AS value FROM incentive_applications")
        .get() as { value: number };
      expect(rows.value).toBe(1);
    });

    it("keeps each user's application separate", async () => {
      await submit(await tokenFor(1, "user1"), application());
      await submit(await tokenFor(2, "user2"), application({ fullName: "Student Two" }));

      const res = await call("/incentive-applications/me", await tokenFor(2, "user2"));
      const body = (await res.json()) as ApplicationBody;
      expect(body.application?.userId).toBe(2);
      expect(body.application?.fullName).toBe("Student Two");
    });

    it("rejects an application with no courses", async () => {
      const res = await submit(await tokenFor(1, "user1"), application({ courses: [] }));
      expect(res.status).toBe(400);
    });

    it("rejects a course with a malformed teacher email", async () => {
      const res = await submit(
        await tokenFor(1, "user1"),
        application({ courses: [course({ teacherEmail: "not-an-email" })] }),
      );
      expect(res.status).toBe(400);

      const body = (await res.json()) as { issues: { field: string }[] };
      expect(body.issues.some((issue) => issue.field === "courses.0.teacherEmail")).toBe(true);
    });

    it("rejects a blank required field", async () => {
      const res = await submit(await tokenFor(1, "user1"), application({ fullName: "   " }));
      expect(res.status).toBe(400);
    });

    it("refuses an anonymous caller", async () => {
      const res = await app.request(
        "/incentive-applications/me",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(application()),
        },
        env,
      );
      expect(res.status).toBe(401);
    });

    it("goes away with the account", async () => {
      await submit(await tokenFor(1, "user1"), application());
      db.prepare("DELETE FROM users WHERE id = 1").run();

      const rows = db
        .prepare("SELECT COUNT(*) AS value FROM incentive_applications")
        .get() as { value: number };
      expect(rows.value).toBe(0);
    });
  });

  describe("admin endpoints", () => {
    type ListBody = {
      data: {
        id: number;
        fullName: string;
        batch: string;
        applicant: { id: number; username: string } | null;
        handles: {
          codeforces: { id: number; handle: string }[];
          vjudge: { id: number; handle: string }[];
          atcoder: { id: number; handle: string }[];
        };
      }[];
      meta: { total: number; page: number; totalPages: number };
    };

    const seedTwo = async () => {
      await submit(await tokenFor(1, "user1"), application());
      await submit(
        await tokenFor(2, "user2"),
        application({
          fullName: "Student Two",
          batch: "CSE 66",
          currentSemester: "Spring 2026",
          phoneNumber: "01911111111",
        }),
      );
    };

    it("refuses a caller without manage_incentives", async () => {
      const res = await call("/admin/incentive-applications", await tokenFor(4, "user4"));
      expect(res.status).toBe(403);
    });

    it("refuses an anonymous caller", async () => {
      const res = await app.request("/admin/incentive-applications", {}, env);
      expect(res.status).toBe(401);
    });

    it("lists applications with their applicant", async () => {
      await seedTwo();
      db.prepare(
        "INSERT INTO user_handles (user_id, type, handle) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)",
      ).run(
        2,
        "codeforces",
        "student_two_cf",
        2,
        "vjudge",
        "student_two_vj_1",
        2,
        "vjudge",
        "student_two_vj_2",
      );

      const res = await call("/admin/incentive-applications", await tokenFor(3, "user3"));
      expect(res.status).toBe(200);

      const body = (await res.json()) as ListBody;
      expect(body.meta.total).toBe(2);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].applicant?.username).toBe("user2");
      expect(body.data[0].handles).toMatchObject({
        codeforces: [{ handle: "student_two_cf" }],
        vjudge: [{ handle: "student_two_vj_1" }, { handle: "student_two_vj_2" }],
        atcoder: [],
      });
    });

    it("searches across the typed-in details", async () => {
      await seedTwo();

      const res = await call(
        "/admin/incentive-applications?q=Student%20Two",
        await tokenFor(3, "user3"),
      );
      const body = (await res.json()) as ListBody;
      expect(body.data.map((row) => row.fullName)).toEqual(["Student Two"]);
    });

    it("filters by batch and semester", async () => {
      await seedTwo();
      const token = await tokenFor(3, "user3");

      const byBatch = await call("/admin/incentive-applications?batch=CSE%2065", token);
      expect(((await byBatch.json()) as ListBody).data.map((r) => r.fullName)).toEqual([
        "Student One",
      ]);

      const bySemester = await call(
        "/admin/incentive-applications?semester=Spring%202026",
        token,
      );
      expect(((await bySemester.json()) as ListBody).data.map((r) => r.fullName)).toEqual([
        "Student Two",
      ]);
    });

    it("reports the distinct filter values", async () => {
      await seedTwo();

      const res = await call("/admin/incentive-applications/filters", await tokenFor(3, "user3"));
      const body = (await res.json()) as { batches: string[]; semesters: string[] };
      expect(body.batches).toEqual(["CSE 65", "CSE 66"]);
      expect(body.semesters).toEqual(["Fall 2025", "Spring 2026"]);
    });

    it("gets one application by id, and 404s on an unknown id", async () => {
      await seedTwo();
      db.prepare(
        "INSERT INTO user_handles (user_id, type, handle) VALUES (?, ?, ?)",
      ).run(2, "atcoder", "student_two_ac");
      const token = await tokenFor(3, "user3");

      const list = (await (
        await call("/admin/incentive-applications", token)
      ).json()) as ListBody;
      const id = list.data[0].id;

      const res = await call(`/admin/incentive-applications/${id}`, token);
      expect(res.status).toBe(200);
      const detail = (await res.json()) as {
        application: NonNullable<ApplicationBody["application"]> & {
          handles: ListBody["data"][number]["handles"];
        };
      };
      expect(detail.application.id).toBe(id);
      expect(detail.application.handles.atcoder).toMatchObject([
        { handle: "student_two_ac" },
      ]);

      expect((await call("/admin/incentive-applications/9999", token)).status).toBe(404);
      expect((await call("/admin/incentive-applications/abc", token)).status).toBe(404);
    });

    it("deletes an application, freeing the applicant to file a new one", async () => {
      const userToken = await tokenFor(1, "user1");
      await submit(userToken, application());
      const adminToken = await tokenFor(3, "user3");

      const list = (await (
        await call("/admin/incentive-applications", adminToken)
      ).json()) as ListBody;

      const res = await call(`/admin/incentive-applications/${list.data[0].id}`, adminToken, {
        method: "DELETE",
      });
      expect(res.status).toBe(200);

      const after = await call("/incentive-applications/me", userToken);
      expect(((await after.json()) as ApplicationBody).application).toBeNull();

      expect((await submit(userToken, application())).status).toBe(200);
    });

    it("bulk-deletes applications", async () => {
      await seedTwo();
      const adminToken = await tokenFor(3, "user3");

      const list = (await (
        await call("/admin/incentive-applications", adminToken)
      ).json()) as ListBody;

      const res = await call("/admin/incentive-applications/bulk-delete", adminToken, {
        method: "POST",
        body: JSON.stringify({ ids: list.data.map((row) => row.id) }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ ok: true, affected: 2 });

      const after = (await (
        await call("/admin/incentive-applications", adminToken)
      ).json()) as ListBody;
      expect(after.meta.total).toBe(0);
    });
  });
});
