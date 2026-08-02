# DIU ACM

pnpm monorepo for the DIU ACM platform, deployed on Cloudflare.

## Apps

- [`apps/api`](apps/api) — Hono + Drizzle (D1) API on Cloudflare Workers, R2 for uploads
- [`apps/web`](apps/web) — React (Vite) SPA, served via Cloudflare Workers static assets

## Getting started

```sh
pnpm install

pnpm dev       # both apps together (API on http://localhost:8787, Vite on 5173)

pnpm dev:api   # or one at a time — wrangler dev (API)
pnpm dev:web   # vite dev server (frontend)
```

For a full local setup (D1 migrations, `.dev.vars`, env overrides) see each app's README.

## Root scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Both dev servers in parallel, output prefixed per app |
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

## Production deployment

One-time setup (see [`apps/api/README.md`](apps/api/README.md) for details):

1. `wrangler d1 create diuacm-db-prod` and
   `wrangler r2 bucket create diuacm-files-prod`,
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

Production traffic uses Cloudflare-managed Custom Domains: `api.diuacm.com`
for the API, `diuacm.com` for the web app, and `r2.diuacm.com` for public R2
objects. Wrangler provisions the Worker domains' DNS
records and edge certificates from the committed app configurations; the
temporary `workers.dev` and version-preview URLs are disabled. The
`diuacm.com` zone must keep Cloudflare's **Always Use HTTPS** setting enabled;
this enforces HTTPS for all production hosts without spending Worker invocations on
redirects. The proxied `www` CNAME points to `diuacm.com`, and the active
`Canonicalize www to apex` Single Redirect permanently forwards both HTTP and
HTTPS requests to `https://diuacm.com` while preserving paths and query strings.
