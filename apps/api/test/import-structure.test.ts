import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { afterEach, describe, expect, it } from "vitest";

const SCRIPT = resolve(import.meta.dirname, "../scripts/import-structure.mjs");
const tempDirectories: string[] = [];

const runDryImport = (payload: unknown) => {
  const directory = mkdtempSync(resolve(tmpdir(), "diuacm-import-test-"));
  tempDirectories.push(directory);
  const inputPath = resolve(directory, "export.json");
  const outputPath = resolve(directory, "import.sql");
  writeFileSync(inputPath, JSON.stringify(payload));

  const result = spawnSync(
    process.execPath,
    [SCRIPT, "--input", inputPath, "--dry-run", "--out", outputPath],
    { encoding: "utf8" },
  );
  expect(result.status, result.stderr).toBe(0);
  return readFileSync(outputPath, "utf8");
};

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("structure importer", () => {
  it("maps remote user images to deterministic R2 keys", () => {
    const image = "https://diuacm.com/storage/users/avatar.jpg";
    const sql = runDryImport({
      users: [
        {
          id: 1,
          name: "Example User",
          email: "user@example.com",
          username: "example",
          image,
        },
      ],
    });

    const digest = createHash("sha256").update(image).digest("hex").slice(0, 32);
    expect(sql).toContain(`users/imported/${digest}.jpeg`);
    expect(sql).not.toContain(image);
  });

  it("maps ranklist is_active to the inverse is_locked value", () => {
    const sql = runDryImport({
      ranklists: [
        { id: 1, tracker_id: 1, keyword: "active", status: "published", is_active: 1 },
        { id: 2, tracker_id: 1, keyword: "inactive", status: "published", is_active: 0 },
        { id: 3, tracker_id: 1, keyword: "legacy", status: "published", is_locked: 1 },
      ],
    });

    const ranklistInserts = sql
      .split("\n")
      .filter((line) => line.startsWith("INSERT INTO `ranklists`"));
    expect(ranklistInserts).toHaveLength(3);
    expect(ranklistInserts[0]).toMatch(/VALUES \(1, 1, 'active'.*, 0, 0,/);
    expect(ranklistInserts[1]).toMatch(/VALUES \(2, 1, 'inactive'.*, 0, 1,/);
    expect(ranklistInserts[2]).toMatch(/VALUES \(3, 1, 'legacy'.*, 0, 1,/);
  });
});
