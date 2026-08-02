import path from "node:path";

import {
  cloudflareTest,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      const migrations = await readD1Migrations(path.resolve(import.meta.dirname, "drizzle"));

      return {
        main: "./src/index.ts",
        miniflare: {
          compatibilityDate: "2026-06-20",
          compatibilityFlags: ["nodejs_compat"],
          bindings: {
            CORS_ORIGINS: "https://diuacm.com",
            GOOGLE_CLIENT_ID: "worker-test-client-id",
            SUPER_ADMIN_EMAIL: "admin@example.test",
            ALERT_FROM_EMAIL: "alerts@example.test",
            JWT_SECRET: "worker-test-secret",
            MIGRATION_EXPORT_KEY: "worker-test-export-key",
            TEST_MIGRATIONS: migrations,
          },
          d1Databases: ["DB"],
          r2Buckets: ["BUCKET"],
          // Do not load the production Wrangler config here: its intentionally
          // remote email binding would make CI require Cloudflare credentials.
          email: { send_email: [{ name: "EMAIL" }] },
        },
      };
    }),
  ],
  test: {
    include: ["test/worker/**/*.test.ts"],
  },
});
