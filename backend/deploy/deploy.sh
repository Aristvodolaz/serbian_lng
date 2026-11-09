#!/usr/bin/env bash
# Deploy the REČ backend (and admin) on the server. Run from backend/ after the
# first-time setup in DEPLOY.md (.env exists, baseline already done).
#
#   ./deploy/deploy.sh
#
# Order matters: back up, build, run migrations, then start the new app — so the
# new build never boots against an unmigrated schema (DEPLOY.md, step 4).
set -euo pipefail

cd "$(dirname "$0")/.."
COMPOSE="docker compose -f docker-compose.prod.yml"
HEALTH_URL="http://localhost:${APP_PORT:-3000}/health"

git pull --ff-only

# Backup first: the volume is the only copy of user data (see DEPLOY.md).
mkdir -p backups
BACKUP="backups/rec-$(date +%Y%m%d-%H%M%S).sql"
$COMPOSE up -d postgres
$COMPOSE exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$BACKUP"
echo "backup: $BACKUP"

$COMPOSE build app admin

$COMPOSE run --rm app node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js

$COMPOSE up -d --build app admin

# Give the app a moment, then fail loudly if it does not answer.
for _ in $(seq 1 20); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "deployed: $HEALTH_URL is up"
    exit 0
  fi
  sleep 3
done
echo "health check failed: $HEALTH_URL" >&2
$COMPOSE logs --tail=100 app >&2
exit 1
