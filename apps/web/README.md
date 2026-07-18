# DIU ACM Web

Frontend for **DIU ACM** — the competitive programming community of Daffodil
International University. A React SPA served as Cloudflare Workers static
assets, backed by the [diuacm API](https://diuacm.sourovcodes.workers.dev/openapi.json).

**Live:** https://diuacm-web.sourovcodes.workers.dev

## Stack

- **Vite + React 19 + TypeScript**
- **React Router v7** (SPA routing) · **TanStack Query v5** (server state)
- **Tailwind CSS v4 + shadcn/ui** (dark mode included)
- **openapi-typescript + openapi-fetch** — the API client is fully typed from
  the backend's OpenAPI spec
- **Cloudflare Workers static assets** for hosting (`wrangler.jsonc`)

## Features

- Events: filterable/searchable list, detail with media, attendance list,
  performance leaderboards, mark-attendance with event password
- Trackers → ranklists → standings matrix (sticky columns, per-event
  solves/upsolves/positions, event weights)
- Programmers directory with Codeforces/VJudge/AtCoder handles and
  CF-rating-colored badges
- Auth: email/username + password, Google Sign-In (`@diu.edu.bd`), JWT stored
  client-side; profile editing, avatar upload, handle management

## Development

```sh
npm install
npm run dev          # dev server
npm run build        # typecheck + production build to dist/
npm run api:types    # regenerate src/api/schema.d.ts from the live OpenAPI spec
```

The API base URL defaults to the production backend; override with
`VITE_API_BASE_URL` in a `.env` file if needed.

## Deploy

```sh
npm run deploy       # build + wrangler deploy (needs `wrangler login`)
```
