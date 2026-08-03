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
| POST   | `/auth/login`    | —      | Log in `{ identifier, password }` — `identifier` is the email **or** username |
| POST   | `/auth/google`   | —      | Sign in with a Google ID token `{ idToken }` (**@diu.edu.bd** only) |
| GET    | `/auth/me`       | Bearer | Current user |
| PATCH  | `/auth/me`       | Bearer | Update profile `{ name?, username?, studentId? }` |
| PUT    | `/auth/me/image` | Bearer | Upload profile image (multipart field `image`; PNG/JPEG/GIF/WebP ≤ 10 MiB) |
| GET    | `/events`        | —      | List published events; filter by `type`/`scope`, search `q` (title/description/link) |
| GET    | `/events/:id`    | —      | Event details + media |
| POST   | `/events/:id/attendance` | Bearer | Mark attendance (body `{ password }`; within the attendance window) |
| GET    | `/events/:id/attendance` | —      | List attendees (paginated) |
| GET    | `/events/:id/performance` | —      | Event performance leaderboard (rank, solve/upsolve counts) |
| GET    | `/trackers`      | —      | List published trackers (title, description, slug) |
| GET    | `/trackers/:slug` | —      | Tracker details + its published ranklists (keyword, user/event counts) |
| GET    | `/trackers/:slug/:keyword` | —      | Ranklist standings: events (with weight) + users (score, position, per-event performance) |
| GET    | `/files/:key`    | —      | Local/legacy proxy for a stored R2 object |

Authenticated requests send the JWT from login/google as `Authorization: Bearer <token>`.
The user object includes an absolute `image` URL (or `null`). Production URLs
use `https://r2.diuacm.com`; local and preview environments use `/files/:key`.

### Auth model

- **There is no self-service registration.** Accounts come from Google sign-in or from the
  admin API — password login serves accounts that already exist, including imported ones.
- **Password** login accepts the email **or** the username.
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
| CF rating/handles | `42 0 * * *` | batch of 100 handles | `codeforces.com/api/user.info` |
| Health digest | `12 1 * * *` | — | the database (see [Alerting](#alerting)) |

The three solve syncs are offset by 5 minutes so no two start in the same minute; the two
daily jobs sit on minutes none of them uses. The expressions live in `src/sync/schedule.ts`
— the dispatcher keys off them, and the liveness check measures against them, so a cadence
change touches `wrangler.jsonc` and that file and nothing else.

**The rating refresh is the odd one out.** `src/sync/cf-rating.ts` keeps
`users.max_cf_rating` current, which is otherwise only written when a person saves a handle
and so is stale from the moment it lands. It runs daily rather than every 15 minutes because
`user.info` takes every handle in a single call — a few hundred handles is three requests,
not three hundred — which is also why it has no cursor and no outage breaker: there is not
enough work in one run for either to pay for itself.

It earns its keep twice over, because it also rewrites renamed handles.
`checkHistoricHandles=true` resolves an old handle to its current one, and `user.info` is the
only endpoint that does — `user.status`, which the solve sync uses, does not. So when a member
renames on Codeforces their stored handle starts returning `invalid-handle` and **their solve
counts freeze silently and permanently**. Writing the canonical handle back is what un-wedges
that, and a real rename also nulls `last_synced_at` so the repaired handle goes to the front of
the solve sync's queue rather than waiting out the 2-hour window. A case-only correction does
not, because Codeforces is case-insensitive and nothing was ever broken.

> **Watch out.** Codeforces fails the **whole** `user.info` call if a single handle in the
> list is unknown — `status: "FAILED"`, `result: null`, no partial answer. So a clean response
> proves every handle in it is good, and a failure says nothing about which one is not. Dead
> handles are isolated by **halving** the chunk and recursing into the halves that still fail:
> about 2k·log₂(n) calls for k bad handles, against n for asking one at a time. Only
> `invalid-handle` splits; anything else is the judge's fault and applies to the whole chunk.

A handle Codeforces does not recognise is **reported and nothing else** — the handle, the
rating, and the sync cursor are all left exactly as they were. A Codeforces outage misread as
a bad handle must never be able to unlink a real account, so detection never mutates.

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
curl "http://localhost:8787/__scheduled?cron=42+0+*+*+*"   # CF rating + handle refresh
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
| ---------- | ----------- | -------------- |
| `<platform>:paging-truncated` | A handle's history hit `MAX_PAGES` with more to read | Counts are **silently too low** and nothing else would ever show it |
| `<platform>:blocked` | A run stopped on a rate limit or VJudge's Cloudflare challenge | That platform stops updating entirely until it clears |
| `<platform>:error-rate` | More than ⅓ of a batch of ≥5 failed | A handful of dead handles is normal; this many means the API moved |
| `<platform>:run-failed` | The run threw before finishing | Nothing synced on that tick |
| `codeforces-rating:invalid-handles` | Codeforces does not recognise a stored handle | That member's rating **and** solve counts are frozen; only a human can fix it |
| `codeforces-rating:rename-conflict` | A rename collided with another row's handle | Two rows point at one account, so the rename cannot land |
| `codeforces-rating:unreachable` | A batch went unanswered, or the run stopped early | Some handles were never checked, so the dead-handle list above is partial |
| `<job>:not-firing` | Fewer than 80% of a day's expected ticks were recorded | The job **is not running at all** — see [Run history](#run-history-and-the-system-page) |

A time-budget stop is **not** a fault for the solve syncs — leftovers are picked up next tick
by design. It *is* one for the daily rating refresh, whose next tick is 24 hours away.

The rating refresh keys are prefixed `codeforces-rating:` rather than `codeforces:` so its
cooldowns and the solve sync's never suppress each other. It gets its own fault rules
(`collectCfRatingFaults`) because its unit of work is a batch of a hundred handles — a whole
run is three units, far under the `MIN_SAMPLE` of 5 that makes an error *rate* mean anything —
and because it has a fault the syncs do not: a handle that no longer exists is a data problem,
not an outage. Since it runs daily, that alert repeats every morning until someone fixes the
handle, which is the intent.

**The outage breaker.** Every unit stamps its cursor even when it failed, so a poison handle
can never wedge the queue — but that also means a batch spent on a judge that is down pushes
100 handles out of the freshness window and leaves them stale for two hours. So a run of
`OUTAGE_STREAK` (5) *consecutive judge-side* failures ends the run instead: five units are
given up, the rest keep their cursor and are retried on the next tick. Judge-side is decided
by `SyncPlatform.isOutage` — `unavailable` for all three clients. A handle's own failure
(Codeforces `invalid-handle`) or a contest's (VJudge `not-found`) resets the streak and can
never trip it, because those cluster by age exactly as the cursor order walks them and would
otherwise stop every batch at the same place.

An `error-rate` mail carries the **aggregated failure reasons** — `17× Could not reach
Codeforces.` — not just a count. The per-row copies in `last_sync_error` are overwritten by
the next successful sync, roughly two hours later, so on a transient outage the mail is
usually the only surviving evidence of what went wrong.

**Volume is the hard constraint**: five crons fire 290 times a day, so a persistent fault
would otherwise mail every 15 minutes. Every occurrence is recorded in `admin_notices`, but
a given key only sends once per **hour**, and the mail says how many times it fired in
between. Sending never breaks a sync — an unset sender or a rejection is logged and the run
continues, so this ships fine before the domain is onboarded.

### Run history and the System page

Every fault above is derived from a run that *happened*. The one failure none of them can
see is a cron that **stops firing**: no summary to inspect, no error to log, no mail — and a
digest that cheerfully reports "0 failing", because nothing failed, nothing ran.

`src/sync/runs.ts` closes that hole. Every invocation appends a row to `cron_runs`
(job, start, duration, status, fault keys, rows written, the full summary), and the digest
compares the ticks it found against the ticks `src/sync/schedule.ts` says the expression
should have produced. Absence becomes a row that isn't there.

- **`status` is the useful column.** `degraded` means the invocation succeeded — so
  Cloudflare paints it green — but the run raised faults. Without it, a run where every
  single unit failed is indistinguishable from a perfect one in the dashboard.
- **Expectations come from the cron expression itself** (`firesPerDay`), so changing a
  cadence in `wrangler.jsonc` and `schedule.ts` cannot leave the monitoring measuring the
  old one. An expression restricted by day-of-month/month/day-of-week returns `null` and is
  skipped rather than measured against an invented number.
- **The window is 25 hours against a day of ticks.** The slack is for the daily jobs, whose
  previous run sits almost exactly one day back; an exact window would have the digest
  accusing itself of a missed tick on scheduler jitter alone.
- **The check stays quiet until the ledger is a full window old**, or deploying it would
  alert on all five jobs at once.
- Runs are kept 14 days and pruned on the digest tick.

`GET /admin/system/health` serves that to the admin panel's **System** page
(`manage_system`), alongside the open `admin_notices` — which until then were written and
never read by anything. The page is the pull-based counterpart to the mail: per-job ticks
against expected, a status strip of recent runs, 24h totals, the paginated run history, and
a **Mark resolved** button that drops a fault's cooldown row so a recurrence alerts
immediately rather than waiting out an hour started by the fix.

`manage_system` is read-only apart from that acknowledgement, so it can be granted to
whoever is on call without handing over users, events, or content.

### Finding a bad run in the dashboard

The System page above is the first place to look. In Workers Logs, note that a run where
every unit failed is **not** a Workers exception — the scheduled handler returns normally,
so Observability records the invocation as a success and its error charts stay flat. Two
things to search for instead:

- `<platform> sync` — the per-run summary line, including `errorReasons`, on every tick.
- **level = `error`** — every fault is `console.error`d as well as mailed, so anything that
  sent a mail is findable there.

### Setup

Already done — mail goes **from `alerts@diuqbank.com` to `SUPER_ADMIN_EMAIL`**. `diuqbank.com`
is onboarded onto Email Sending in this account (`wrangler email sending list`), which
published its DKIM key and left the zone's existing MX and SPF records — Email Routing, so
inbound mail — untouched. The `alerts@` mailbox does not need to exist; only the domain is
verified.

To move it to another domain:

1. Onboard a domain that is a zone in this Cloudflare account:

   ```bash
   pnpm exec wrangler email sending enable <yourdomain>
   ```

2. Point `vars.ALERT_FROM_EMAIL` in `wrangler.jsonc` at an address on it and run
   `pnpm cf-typegen`.

Setting `ALERT_FROM_EMAIL` to an empty string switches sending off without disabling
detection: faults are still recorded in `admin_notices` and logged. The recipient
(`SUPER_ADMIN_EMAIL`) must be a **verified destination address** —
`wrangler email routing addresses list`.

> **Deliverability.** `diuqbank.com` publishes SPF and DKIM but **no DMARC record**. Mail
> should still authenticate, but adding `_dmarc.diuqbank.com` (`v=DMARC1; p=none;`) is worth
> doing before relying on these alerts reaching Gmail.

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

From the repo root, `pnpm dev` runs this Worker and the web app together.

Then open http://localhost:8787/docs to browse the API in Scalar. R2 is emulated locally by
`wrangler dev`, so image upload and `/files/:key` work without a real bucket.

Local secrets live in `.dev.vars` (gitignored). Copy `.dev.vars.example` to `.dev.vars`
and set a `JWT_SECRET`.

`dev.host` in `wrangler.jsonc` is load bearing. Without it `wrangler dev` takes the request
URL's host from the first configured route, so `new URL(c.req.url).origin` reads
`http://api.diuacm.com` on localhost — and since every stored-file URL is built from that
origin (`src/lib/user-shape.ts`), locally uploaded images would be served as production URLs
for keys that only exist in the local bucket, and silently never render. Change the dev port
and `dev.host` must change with it; `test/file-url.test.ts` checks the two agree.

**There is no registration endpoint**, so a fresh local database has no one to log in as. The
first account has to be inserted directly — a `password_hash` in the `pbkdf2:100000:<saltHex>:<hashHex>`
format that `src/lib/password.ts` reads:

```bash
node -e 'const c=require("crypto"),s=c.randomBytes(16);console.log("pbkdf2:100000:"+s.toString("hex")+":"+c.pbkdf2Sync(process.argv[1],s,100000,32,"sha256").toString("hex"))' "your-password"
```

```bash
pnpm exec wrangler d1 execute DB --local --command "insert into users (name, email, username, password_hash) values ('Local Test', 'local@diu.edu.bd', 'localtest', '<hash>')"
```

## Database changes

1. Edit `src/db/schema.ts`.
2. `pnpm db:generate` to create a new migration in `drizzle/`.
3. `pnpm db:migrate:local` (and later `pnpm db:migrate:remote`) to apply it.

Migrations are applied with `wrangler d1 migrations apply`, **not** the Drizzle client.

### Importing the legacy structure

`pnpm import:structure --remote` reads the protected migration export, copies each
unique user image into `diuacm-files-prod`, and then imports the mapped rows into remote
D1. Set `MIGRATION_EXPORT_KEY` in `.dev.vars` before running it. Use `--dry-run` to
generate and validate the SQL without changing D1 or R2; `--bucket <name>` overrides the
destination bucket. Legacy bcrypt password hashes are retained and upgraded to the API's
current PBKDF2 format after each user's first successful password login. If passwords were
previously imported as `NULL`, rerun this command after deploying the compatibility fix.
Use `pnpm import:structure --passwords-only` (plus `--remote` for remote D1) to
repair credentials without changing any other imported data.

The source ranklist `is_active` flag has inverse semantics to this API's `is_locked`
column: active ranklists import unlocked, and inactive ranklists import locked.

## Deploying to Cloudflare

The production Worker is attached to `api.diuacm.com` as a Cloudflare Custom
Domain. Its public `workers.dev` and version-preview URLs are disabled. The web
origin allowed by CORS is `https://diuacm.com`. Cloudflare's zone-level
**Always Use HTTPS** setting redirects production HTTP requests at the edge.
Public R2 objects are served directly from `https://r2.diuacm.com`; the bucket
CORS policy is versioned in `r2-cors.json` and can be applied with
`wrangler r2 bucket cors set diuacm-files-prod --file r2-cors.json`. Keep the
bucket's `r2.dev` URL disabled. The custom domain requires TLS 1.2 and has
host-scoped Cache and Response Header Transform Rules: successful immutable
objects get a one-year edge TTL with strong ETags, 4xx/5xx responses are not
stored, and browsers respect origin TTLs. Stored files also receive
`Content-Security-Policy: sandbox` and `X-Content-Type-Options: nosniff`.

```bash
wrangler d1 create diuacm-db-prod  # paste the returned database_id into wrangler.jsonc
wrangler r2 bucket create diuacm-files-prod
# set committed vars in wrangler.jsonc:
#   GOOGLE_CLIENT_ID  — Google OAuth client id (public value)
#   SUPER_ADMIN_EMAIL — implicitly holds every admin permission
#   CORS_ORIGINS      — comma-separated browser origins allowed to call the API
#                       (localhost is always allowed; empty = allow all)
pnpm db:migrate:remote                # apply migrations to the remote D1
wrangler secret put JWT_SECRET        # set a strong production secret
pnpm run deploy
```
