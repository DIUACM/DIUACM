# diuacm API

A [Hono](https://hono.dev) API for diuacm, running on **Cloudflare Workers** with a
**D1** database via **Drizzle ORM**. Request validation uses **Zod 4**, and the
**OpenAPI 3.1** spec is previewable with **Scalar**.

## Stack

- Hono on Cloudflare Workers
- Drizzle ORM + Cloudflare D1 (SQLite)
- Zod 4 + `@hono/zod-validator` for input validation
- JWT auth (`hono/jwt`, HS256, 7-day) with PBKDF2 (Web Crypto) password hashing
- Hand-written OpenAPI spec at `/openapi.json`, Scalar docs at `/docs`

## Endpoints

| Method | Path             | Auth   | Description |
|--------|------------------|--------|-------------|
| GET    | `/health`        | —      | Health check |
| GET    | `/docs`          | —      | Scalar API reference |
| GET    | `/openapi.json`  | —      | OpenAPI 3.1 spec |
| POST   | `/auth/register` | —      | Register `{ name, email, username, password, studentId? }` |
| POST   | `/auth/login`    | —      | Log in `{ email, password }` |
| GET    | `/auth/me`       | Bearer | Current user |
| PATCH  | `/auth/me`       | Bearer | Update profile `{ name?, username?, studentId? }` |

Authenticated requests send the JWT from register/login as `Authorization: Bearer <token>`.

## Local development

```bash
pnpm install
pnpm cf-typegen          # generate worker-configuration.d.ts (binding types)
pnpm db:generate         # generate the SQL migration from src/db/schema.ts
pnpm db:migrate:local    # apply migrations to the local D1 database
pnpm dev                 # http://localhost:8787
```

Then open http://localhost:8787/docs to browse the API in Scalar.

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
pnpm db:migrate:remote                # apply migrations to the remote D1
wrangler secret put JWT_SECRET        # set a strong production secret
pnpm run deploy
```
