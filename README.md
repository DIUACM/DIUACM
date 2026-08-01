# DIU ACM

pnpm monorepo for the DIU ACM platform, deployed on Cloudflare.

## Apps

- [`apps/api`](apps/api) — Hono + Drizzle (D1) API on Cloudflare Workers, R2 for uploads
- [`apps/web`](apps/web) — React (Vite) SPA, served via Cloudflare Workers static assets

## Getting started

```sh
pnpm install

pnpm dev:api   # wrangler dev (API) — http://localhost:8787
pnpm dev:web   # vite dev server (frontend)
```

For a full local setup (D1 migrations, `.dev.vars`, env overrides) see each app's README.

## Root scripts

| Script | What it does |
|---|---|
| `pnpm typecheck` | TypeScript checks for both apps |
| `pnpm lint` | oxlint over the web app |
| `pnpm test` | API Node and Workers-runtime suites, plus web unit tests |
| `pnpm build:web` | Production frontend build with JavaScript bundle budgets |
| `pnpm test:e2e` | Chromium smoke tests against the built site and a local Worker/D1 |
| `pnpm test:smoke` | Build the site, then run the browser smoke tests |
| `pnpm deploy:api` / `pnpm deploy:web` | Deploy each worker with wrangler |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, both API runtimes, the web
build and bundle budget, and browser smoke tests on every push to `main` and
every pull request.

## Stage deployment

One-time setup (see [`apps/api/README.md`](apps/api/README.md) for details):

1. `wrangler d1 create diuacm-db-stage` and
   `wrangler r2 bucket create diuacm-files-stage`,
   then put the ids in `apps/api/wrangler.jsonc`.
2. Set the committed vars in `apps/api/wrangler.jsonc`: `GOOGLE_CLIENT_ID`,
   `SUPER_ADMIN_EMAIL`, and `CORS_ORIGINS` (the web app's origin).
3. `wrangler secret put JWT_SECRET` (from `apps/api`) — a long random string.

Each release:

```sh
pnpm --filter @diuacm/api db:migrate:remote   # apply pending D1 migrations
pnpm deploy:api
pnpm deploy:web
```
