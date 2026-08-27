# Deploying REČ API to a server

Target: any Linux server (VPS) with Docker + the Compose plugin installed. No other assumptions about the host.

## 1. Get the code onto the server

```bash
git clone https://github.com/Aristvodolaz/serbian_lng.git
cd serbian_lng/backend
```

## 2. Configure environment

```bash
cp .env.production.example .env
```

Edit `.env`:
- Set a real `POSTGRES_PASSWORD` (and mirror it into `DATABASE_URL`).
- Generate real JWT secrets: `openssl rand -base64 48` — run it twice, once for `JWT_ACCESS_SECRET` and once for `JWT_REFRESH_SECRET`.

The app **refuses to start** in production if these are missing or left at the local-dev placeholder values (`src/main.ts`, `assertProductionEnv`) — this is deliberate, not a bug, so a misconfigured deploy fails loudly instead of serving with a guessable secret.

## 3. Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This starts `postgres` (with a named volume) and `app` (built from `Dockerfile`), waits for Postgres to be healthy before starting the app, and exposes the API on `${APP_PORT:-3000}`.

Check it's alive:

```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"..."}
```

## 4. Run the schema migration

Nothing is seeded anymore — content is authored through the admin panel (`admin/`) and CSV uploads, so a first deploy against an empty database needs no content step. `TYPEORM_SYNCHRONIZE=true` (from `.env`) creates the schema on first boot.

When updating an existing deployment whose schema has changed, run the migration **before** the new app starts, so the new build never boots with synchronize enabled against the old schema:

```bash
docker compose -f docker-compose.prod.yml up -d postgres

# Existing DBs were created by TYPEORM_SYNCHRONIZE and have no migration
# history — record the migrations already reflected in the schema as applied,
# so migration:run only applies what's actually missing.
docker compose -f docker-compose.prod.yml run --rm app \
  node dist/database/baseline.js

docker compose -f docker-compose.prod.yml run --rm app \
  node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js
```

(The `npm run migration:run`/`migration:baseline` scripts use `typeorm-ts-node-commonjs`/ts-node, which are not installed in the production image — use the compiled `dist/` scripts above.)

The current schema migration (`1790000000000-ContentPayloadSchema`) is intentionally destructive: it converts the old `translate_choice`/`fill_blank` exercise types to the payload model (existing exercise content becomes empty drafts) and drops the `exercise_choices` table. Users, lessons and units are preserved.

> **Admin access.** The admin user is only ever created by the old seed script, which has been removed. On the *existing* deployment the admin row is already in the database and survives the migration — **do not** wipe the `pgdata` volume, or the admin (and all registered users) are gone with no way to recreate them.

## 5. Put it behind HTTPS

The container listens on plain HTTP — put a reverse proxy in front for TLS. A minimal Caddy config (automatic Let's Encrypt) is at [`deploy/Caddyfile.example`](deploy/Caddyfile.example). Any reverse proxy works the same way; point it at `localhost:${APP_PORT}`.

## Updating after a code change

```bash
git pull
# if the schema changed, run step 4 (migration) first
docker compose -f docker-compose.prod.yml up -d --build
```

Or, using the prebuilt image from GHCR (published by [`.github/workflows/backend-docker.yml`](../.github/workflows/backend-docker.yml) on every push to `main`) instead of building on the server:

```bash
docker pull ghcr.io/aristvodolaz/serbian_lng-backend:latest
# then point docker-compose.prod.yml's `app.image` at that tag instead of `build:`
```

## Logs / troubleshooting

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml ps
```

## Before this handles real user data

- `TYPEORM_SYNCHRONIZE=true` auto-creates tables from entities — convenient for a first deploy, but it can silently alter/drop columns on a schema change. Switch to TypeORM migrations before this is load-bearing.
- Postgres data lives in the `pgdata` Docker volume with no automated backup — set one up (e.g. `pg_dump` on a cron) before relying on this for real users.
