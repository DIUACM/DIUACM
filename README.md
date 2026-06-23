# diuacm API

A [Hono](https://hono.dev) API for diuacm, running on **Cloudflare Workers** with a
**D1** database via **Drizzle ORM** and **R2** object storage. Request validation uses
**Zod 4**, and the **OpenAPI 3.1** spec is previewable with **Scalar**.

## Stack

- Hono on Cloudflare Workers
- Drizzle ORM + Cloudflare D1 (SQLite)
- Cloudflare R2 for uploaded files (profile images)
- Zod 4 + `@hono/zod-validator` for input validation
- JWT auth (`hono/jwt`, HS256, 7-day) with PBKDF2 (Web Crypto) password hashing
- Google sign-in (ID token verified via Google's tokeninfo endpoint)
- Hand-written OpenAPI spec at `/openapi.json`, Scalar docs at `/docs`

## Endpoints

| Method | Path             | Auth   | Description |
|--------|------------------|--------|-------------|
| GET    | `/health`        | —      | Health check |
| GET    | `/docs`          | —      | Scalar API reference |
| GET    | `/openapi.json`  | —      | OpenAPI 3.1 spec |
| GET    | `/auth/config`   | —      | Public auth config (`googleClientId`) |
| POST   | `/auth/register` | —      | Register `{ name, email, username, password, studentId? }` |
| POST   | `/auth/login`    | —      | Log in `{ identifier, password }` — `identifier` is the email **or** username |
| POST   | `/auth/google`   | —      | Sign in with a Google ID token `{ idToken }` (**@diu.edu.bd** only) |
| GET    | `/auth/me`       | Bearer | Current user |
| PATCH  | `/auth/me`       | Bearer | Update profile `{ name?, username?, studentId? }` |
| PUT    | `/auth/me/image` | Bearer | Upload profile image (multipart field `image`; PNG/JPEG/GIF/WebP ≤ 5 MB) |
| GET    | `/events`        | —      | List published events; filter by `type`/`scope`, search `q` (title/description/link) |
| GET    | `/events/:id`    | —      | Event details + media |
| POST   | `/events/:id/attendance` | Bearer | Mark attendance (body `{ password }`; within the attendance window) |
| GET    | `/events/:id/attendance` | —      | List attendees (paginated) |
| GET    | `/files/:key`    | —      | Stream a stored object (e.g. a profile image) from R2 |

Authenticated requests send the JWT from register/login/google as `Authorization: Bearer <token>`.
The user object includes an absolute `image` URL (or `null`) served by `/files/:key`.

### Auth model

- **Password** register/login is open to any email. Login accepts the email **or** the username.
- **Google** sign-in is restricted to **@diu.edu.bd** addresses and creates an account with an
  opaque username (changeable later via `PATCH /auth/me`). Google accounts have no password.
- Set your Google OAuth client id in `wrangler.jsonc` → `vars.GOOGLE_CLIENT_ID`.

### Events

- `event_password` is **never returned** by the index or details endpoints — it only gates
  `POST /events/:id/attendance`.
- Marking attendance requires a logged-in user (Bearer) **and** the correct event password, and is
  only accepted within the window **15 min before `starting_at` → 15 min after `ending_at`**. One
  record per user per event; the timestamp is stored.
- `participation_scope` and `strict_attendance` are stored/filterable metadata and are **not
  enforced** yet (enforcing scope needs user gender/rank/selected-person data).
- There is no create/update or media-upload API yet — events and their media are seeded directly in
  D1 (`wrangler d1 execute`) until an admin API exists.

## Local development

```bash
pnpm install
pnpm cf-typegen          # generate worker-configuration.d.ts (DB, BUCKET, GOOGLE_CLIENT_ID)
pnpm db:generate         # generate SQL migrations from src/db/schema.ts
pnpm db:migrate:local    # apply migrations to the local D1 database
pnpm dev                 # http://localhost:8787
```

Then open http://localhost:8787/docs to browse the API in Scalar. R2 is emulated locally by
`wrangler dev`, so image upload and `/files/:key` work without a real bucket.

Local secrets live in `.dev.vars` (gitignored). Copy `.dev.vars.example` to `.dev.vars`
and set a `JWT_SECRET`.

## Database changes

1. Edit `src/db/schema.ts`.
2. `pnpm db:generate` to create a new migration in `drizzle/`.
3. `pnpm db:migrate:local` (and later `pnpm db:migrate:remote`) to apply it.

Migrations are applied with `wrangler d1 migrations apply`, **not** the Drizzle client.

## Deploying to Cloudflare (later)

```bash
wrangler d1 create diuacm-db          # paste the returned database_id into wrangler.jsonc
wrangler r2 bucket create diuacm-files
# set vars.GOOGLE_CLIENT_ID in wrangler.jsonc (public value, committed)
pnpm db:migrate:remote                # apply migrations to the remote D1
wrangler secret put JWT_SECRET        # set a strong production secret
pnpm run deploy
```
