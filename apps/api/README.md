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

Cron Triggers keep `event_performance` current from the judges, so ranklist scores no
longer depend on an admin typing numbers in. `src/sync/index.ts` dispatches on the cron
expression, so every platform gets its own cadence:

| Platform | Cron | Unit of work | Source |
|---|---|---|---|
| Codeforces | `*/15 * * * *` | handle | `codeforces.com/api/user.status` |
| AtCoder | `5,20,35,50 * * * *` | handle | AtCoder Problems (kenkoooo) |
| VJudge | `10,25,40,55 * * * *` | contest | `vjudge.net/contest/rank/single/<id>` |
| Health digest | `12 1 * * *` | — | the database (see [Alerting](#alerting)) |

The three syncs are offset by 5 minutes so no two start in the same minute; the digest sits
on a minute none of them uses.

**Codeforces and AtCoder are handle-driven.** One API call covers a user across *every*
tracked contest, so the unit of work is a handle, not an (event, user) pair.
`src/sync/runner.ts` owns everything platform-neutral — batching, throttling, the cursor,
the writes — and each judge plugs in a `SyncPlatform` adapter (`src/sync/codeforces.ts`,
`src/sync/atcoder.ts`). Per tick a platform takes its next 100 handles, least recently
synced first and skipping any read within the last **2 hours**
(`user_handles.last_synced_at`, stamped even on failure so a dead handle can't wedge the
queue). A queue of ~275 handles drains in ~45 min and then idles until the oldest ages past
the window, so each account is re-read roughly every 2 hours.

**VJudge is contest-driven**, and so does not fit that shape: one call there returns every
participant of one contest at once. It runs its own loop in `src/sync/vjudge.ts` and
borrows from the runner only what is genuinely shared — `computePerformance`,
`toSyncEvent`, `throttle`, and the write SQL. Per tick it takes 40 contests, least recently
synced first, against the same 2-hour window, held in `event_sync_state` (a separate table
because `GET /events/:id` returns every `events` column bar `event_password`). ~120 events
drain in three ticks.

Both halves share the same scope and counting rules:

- **In scope**: published, finished events whose `event_link` the platform claims, and
  which belong to at least one ranklist with `is_locked = 0`. Locking a ranklist at the end
  of a semester is what stops its events being re-synced.
- **Solved** = accepted during the contest — either the judge says so, or it landed inside
  the event's own `starting_at`…`ending_at` (which is how club-run replays are counted).
  **Upsolved** = accepted at any other time, on a problem not already solved in-contest.
- Admin-entered `position` values survive a sync, and an unchanged row is not rewritten,
  so the score/rank triggers stay quiet on a steady system.

### Per-platform notes

**Codeforces.** `user.status` is the only endpoint that exposes practice submissions, and
hence upsolves — `contest.standings` rejects every extra parameter for non-admin callers
and returns official contestant rows alone. In-contest comes straight off the submission
(`CONTESTANT`/`OUT_OF_COMPETITION`). Gym and group contests are **not** synced: the API
keeps them private ("You have to be authenticated to use this method").

**AtCoder.** There is no official API, and `atcoder.jp/contests/<slug>/standings/json`
redirects to a login page, so the community AtCoder Problems service is the source. Its
submissions carry no equivalent of Codeforces' participant type, so the contest window
comes from one `contests.json` fetch per run (~80 KB for all ~6k contests) and a solve
counts as in-contest when it lands inside the contest's real start + duration. Paging runs
**forward** (oldest first, 500 per page), the opposite of Codeforces. Requests are spaced
1.5 s per the service's policy: *"Please sleep for more than 1 second between accesses."*

> **Known limitation.** A mistyped AtCoder handle returns HTTP 200 and an empty list —
> indistinguishable from a real account with no submissions. It will sync "successfully"
> forever and never set `last_sync_error`, and unlike Codeforces there is no validation
> when the handle is entered either.

**VJudge.** There is no documented API, but `/contest/rank/single/<id>` — the endpoint the
standings page itself calls — is public JSON and needs no session, even for the
password-protected contests the club runs. It returns every participant plus their whole
submission history for that contest, live rows and upsolves together (4–19 KB), which is
what makes one call per contest enough and why this half is contest-driven. In-contest is
`secondsSinceBegin <= length`; only status `1` counts as accepted. Participants are matched
to users by lowercased `user_handles.handle`, and unknown names — usually 5–20% of a
standings page — are ignored. VJudge is the one platform where a user may hold several
handles, so their submissions are merged before counting; otherwise the second handle's
upsert would overwrite the first on the `(event_id, user_id)` row.

> **Watch out.** VJudge sits behind Cloudflare bot protection: a request with an empty
> `User-Agent` is answered with `403` and `cf-mitigated: challenge`. Workers' `fetch` sends
> none by default, so the `User-Agent` in `src/lib/vjudge.ts` is load bearing. A `403` is
> treated as a rate limit and stops the whole batch, because the next contest would be
> answered the same way. Separately, a contest id that does not exist or is not public
> comes back as **HTTP 200 with an empty body**, not a 404.

There is no HTTP trigger — the crons are the only entry point. Locally, `pnpm dev` passes
`--test-scheduled`, so a tick can be fired by hand:

```bash
curl "http://localhost:8787/__scheduled?cron=*/15+*+*+*+*"
```

```bash
curl "http://localhost:8787/__scheduled?cron=5,20,35,50+*+*+*+*"
```

```bash
curl "http://localhost:8787/__scheduled?cron=10,25,40,55+*+*+*+*"
```

```bash
curl "http://localhost:8787/__scheduled?cron=12+1+*+*+*"   # health digest
```

## Alerting

The syncs are unattended, and a wrong count looks exactly like a healthy system from the
outside. `src/lib/notify.ts` mails `SUPER_ADMIN_EMAIL` when that is no longer true, and
`src/sync/digest.ts` mails once a day regardless — so **silence can be read as health
rather than as a dead job**.

`src/sync/faults.ts` decides what qualifies, and the bar is deliberately high: only the
numbers being silently wrong, or the sync having stopped working. Individual failures do
not qualify; they live in `last_sync_error` and are summarised in the digest.

| Notice key | Raised when | Why it matters |
| --- | --- | --- |
| `<platform>:paging-truncated` | A handle's history hit `MAX_PAGES` with more to read | Counts are **silently too low** and nothing else would ever show it |
| `<platform>:blocked` | A run stopped on a rate limit or VJudge's Cloudflare challenge | That platform stops updating entirely until it clears |
| `<platform>:error-rate` | More than ⅓ of a batch of ≥5 failed | A handful of dead handles is normal; this many means the API moved |
| `<platform>:run-failed` | The run threw before finishing | Nothing synced on that tick |

A time-budget stop is **not** a fault — leftovers are picked up next tick by design.

**Volume is the hard constraint**: four crons fire 289 times a day, so a persistent fault
would otherwise mail every 15 minutes. Every occurrence is recorded in `admin_notices`, but
a given key only sends once per **24 h**, and the mail says how many times it fired in
between. Sending never breaks a sync — an unset sender or a rejection is logged and the run
continues, so this ships fine before the domain is onboarded.

### Setup

Sending is **off until both are done**:

1. Onboard a domain that is a zone in this Cloudflare account:

   ```bash
   pnpm exec wrangler email sending enable <yourdomain>
   ```

2. Point `vars.ALERT_FROM_EMAIL` in `wrangler.jsonc` at an address on it (e.g.
   `alerts@<yourdomain>`) and run `pnpm cf-typegen`.

Until then the faults are still recorded in `admin_notices` and logged; only the mail is
skipped. `SUPER_ADMIN_EMAIL` is the recipient and must be a **verified destination address**
(`wrangler email routing addresses list`).

### Platform budget

The job **requires Workers Paid** — Free gives cron triggers 10 ms of CPU and 50
subrequests, and parsing one page of submissions alone exceeds that. On Paid, a full
100-handle tick costs roughly 600 subrequests of 10,000, a couple of seconds of CPU of
30 s (only sub-hourly crons get 30 s; hourly and slower get 15 min), and 2.5–4.5 min of
wall clock of 15 min. `TIME_BUDGET_MS` stops a run at 10 min regardless; whatever is left
is picked up next tick.

Measured per handle: Codeforces ~2.9 ms of parse CPU (1.5 calls, ~0.5 MB), AtCoder ~0.3 ms
(1 call, ~30 KB). Across both platforms that is roughly 1% of the included monthly CPU.

VJudge is far cheaper per user because it is contest-driven: a 40-contest tick is 40
subrequests and ~0.5 MB total, and one pass over ~120 events covers all ~350 handles —
against the ~480 calls the same work would cost handle-first.

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
