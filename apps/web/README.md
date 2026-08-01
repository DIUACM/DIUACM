# DIU ACM Web

Frontend for **DIU ACM** — the competitive programming community of Daffodil
International University. A React SPA served as Cloudflare Workers static
assets, backed by the [diuacm API](https://api.diuacm.com/openapi.json).

**Live:** https://diuacm.com

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
pnpm install
pnpm dev             # dev server
pnpm build           # typecheck + production build to dist/
pnpm api:types       # regenerate src/api/schema.d.ts from the live OpenAPI spec
```

The API base URL is selected automatically: the Vite development server uses
the local `wrangler dev` API at http://localhost:8787, while production builds
use https://api.diuacm.com. To point either mode elsewhere, copy `.env.example`
to `.env.local` and set `VITE_API_BASE_URL`.

The admin area and the blog post reader are code-split (`lazy` routes in
`src/App.tsx`), so the heavy editor/markdown stacks aren't in the initial bundle.
Static assets are served with the security/caching headers in `public/_headers`.

## Deploy

```sh
pnpm run deploy      # build + wrangler deploy (needs `wrangler login`)
```

The production static assets deployment is attached to `diuacm.com` as a
Cloudflare Custom Domain. Its public `workers.dev` and version-preview URLs are
disabled. Cloudflare's zone-level **Always Use HTTPS** setting redirects HTTP at
the edge, so asset requests do not invoke a Worker. HTTPS responses serve HSTS
from `public/_headers`.
