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
| GET    | `/events/:id/performance` | —      | Event performance leaderboard (rank, solve/upsolve counts) |
| GET    | `/trackers`      | —      | List published trackers (title, description, slug) |
| GET    | `/trackers/:slug` | —      | Tracker details + its published ranklists (keyword, user/event counts) |
| GET    | `/trackers/:slug/:keyword` | —      | Ranklist standings: events (with weight) + users (score, position, per-event performance) |
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
- `ranklists.user_count` / `event_count` are maintained by SQLite triggers on the `ranklist_user` /
  `ranklist_event` pivots (see `drizzle/0007_ranklist_count_triggers.sql`) — never write them from app
  code.

### Admin API

Content management lives under `/admin/*` (users, events, trackers, ranklists, gallery,
blog). Admin routes require a Bearer token plus per-area permissions; the super admin
(`vars.SUPER_ADMIN_EMAIL`) implicitly holds every permission. The endpoint table above
covers the public surface — browse `/docs` (Scalar) for the complete, always-current list.

## Scheduled solve/upsolve sync

A Cron Trigger keeps `event_performance` current from the judges, so ranklist scores no
longer depend on an admin typing numbers in. `src/sync/index.ts` dispatches on the cron
expression, giving each platform its own cadence; only **Codeforces** is implemented so
far (`*/15 * * * *`, see `src/sync/codeforces.ts`).

Per tick it takes the next 100 Codeforces handles, least recently synced first and
skipping any read within the last **2 hours** (`user_handles.last_synced_at`, stamped even
on failure so a dead handle can't wedge the queue). It reads each user's submissions with
one `user.status` call — the only endpoint that exposes practice submissions, and hence
upsolves.

The queue therefore drains in ~45 min and then idles until the oldest handle ages past the
window, so each account is re-read roughly every 2 hours.

- **In scope**: published, finished events whose `event_link` is a public Codeforces
  contest and which belong to at least one ranklist with `is_locked = 0`. Locking a
  ranklist at the end of a semester is what stops its events being re-synced.
- **Solved** = accepted as `CONTESTANT`/`OUT_OF_COMPETITION`, or accepted inside the
  event's own `starting_at`…`ending_at` (which is how club-run replays are counted).
  **Upsolved** = accepted at any other time, on a problem not already solved in-contest.
- Admin-entered `position` values survive a sync, and an unchanged row is not rewritten,
  so the score/rank triggers stay quiet on a steady system.
- Gym and group contests are **not** synced — the Codeforces API keeps them private
  ("You have to be authenticated to use this method").

There is no HTTP trigger — the cron is the only entry point. Locally, `pnpm dev` passes
`--test-scheduled`, so a tick can be fired by hand:

```bash
curl "http://localhost:8787/__scheduled?cron=*/15+*+*+*+*"
```

### Platform budget

The job **requires Workers Paid** — Free gives cron triggers 10 ms of CPU and 50
subrequests, and parsing one page of submissions alone exceeds that. On Paid, a full
100-handle tick costs roughly 600 subrequests of 10,000, a couple of seconds of CPU of
30 s (only sub-hourly crons get 30 s; hourly and slower get 15 min), and ~3.5 min of wall
clock of 15 min. `TIME_BUDGET_MS` stops a run at 10 min regardless; whatever is left is
picked up next tick.

Writes are chunked (`WRITE_CHUNK_SIZE`) because the score triggers amplify one upsert into
a whole-ranklist re-rank, and an unbounded transaction can approach D1's 30 s query limit.
The one-time backfill costs roughly 800k rows written of the 50M/month included; steady
state is near zero, because an unchanged row is never rewritten.

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

## Deploying to Cloudflare

```bash
wrangler d1 create diuacm-db-stage  # paste the returned database_id into wrangler.jsonc
wrangler r2 bucket create diuacm-files-stage
# set committed vars in wrangler.jsonc:
#   GOOGLE_CLIENT_ID  — Google OAuth client id (public value)
#   SUPER_ADMIN_EMAIL — implicitly holds every admin permission
#   CORS_ORIGINS      — comma-separated browser origins allowed to call the API
#                       (localhost is always allowed; empty = allow all)
pnpm db:migrate:remote                # apply migrations to the remote D1
wrangler secret put JWT_SECRET        # set a strong production secret
pnpm run deploy
```
