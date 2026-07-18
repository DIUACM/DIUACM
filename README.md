# DIU ACM

pnpm monorepo for the DIU ACM platform, deployed on Cloudflare.

## Apps

- [`apps/api`](apps/api) — Hono + Drizzle (D1) API on Cloudflare Workers
- [`apps/web`](apps/web) — React (Vite) frontend, served via Cloudflare Workers static assets

## Getting started

```sh
pnpm install

pnpm dev:api   # wrangler dev (API)
pnpm dev:web   # vite dev server (frontend)
```

Other root scripts: `typecheck`, `build:web`, `deploy:api`, `deploy:web`. See each app's README for details.
