#!/usr/bin/env bash
# Deploy the REČ website on the server. Run from anywhere:
#
#   bash website/deploy/deploy.sh
#
# First time: copy .env.production.example to .env.production and fill it in
# (see DEPLOY.md). Then this script pulls the code, builds the image, restarts
# the container and checks that the site answers.
set -euo pipefail

cd "$(dirname "$0")/.."   # website/
ENV_FILE=".env.production"
COMPOSE="docker compose -f docker-compose.prod.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "нет файла $ENV_FILE: скопируйте .env.production.example и заполните" >&2
  exit 1
fi

# Export the variables: compose needs SITE_URL at build time.
set -a
# shellcheck disable=SC1090
. "./$ENV_FILE"
set +a

for var in SITE_URL TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID; do
  if [ -z "${!var:-}" ]; then
    echo "в $ENV_FILE не задано $var" >&2
    exit 1
  fi
done

PORT="${WEB_PORT:-3002}"
HEALTH_URL="http://localhost:${PORT}/ru"

git -C .. pull --ff-only
$COMPOSE build web
$COMPOSE up -d web

for _ in $(seq 1 20); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "опубликовано: $HEALTH_URL отвечает"
    exit 0
  fi
  sleep 3
done
echo "проверка не прошла: $HEALTH_URL" >&2
$COMPOSE logs --tail=100 web >&2
exit 1
