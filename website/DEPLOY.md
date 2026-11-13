# Деплой сайта REČ на сервер

Как у бэкенда и админки: Linux-сервер с Docker и плагином Compose. Сайт работает в одном контейнере на порту `3002`, рядом с API (`3000`) и админкой (`3001`).

## 1. Первый раз

```bash
git clone https://github.com/Aristvodolaz/serbian_lng.git
cd serbian_lng/website
cp .env.production.example .env.production
nano .env.production   # заполнить SITE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
```

Что заполнить:
- `SITE_URL` — публичный адрес сайта, например `https://rec-site.example.com`, без `/` в конце.
- `TELEGRAM_BOT_TOKEN` — токен бота после `/revoke` (старый токен из переписки не используем).
- `TELEGRAM_CHAT_ID` — `1395841723`.

Файл `.env.production` не попадает в git. Если его нет, скрипт остановится и скажет, что делать.

## 2. Запуск

```bash
bash deploy/deploy.sh
```

Скрипт:
1. проверяет `.env.production` и обязательные переменные;
2. делает `git pull` в корне репозитория;
3. собирает образ и перезапускает контейнер `web`;
4. проверяет, что `http://localhost:3002/ru` отвечает, и выводит результат.

Обновление после изменений в коде — тот же самый запуск `bash deploy/deploy.sh`.

## 3. Домен и HTTPS

Контейнер слушает обычный HTTP. Перед ним нужен обратный прокси с TLS, как для API. Пример для Caddy, добавить в `/etc/caddy/Caddyfile` и перезагрузить:

```
rec-site.example.com {
	reverse_proxy localhost:3002
}
```

После появления домена поставьте его в `SITE_URL` и запустите `bash deploy/deploy.sh` ещё раз: sitemap и canonical-ссылки пересоберутся с правильным адресом.

## Проверка

```bash
curl -I http://localhost:3002/ru           # 200
curl -s http://localhost:3002/robots.txt   # ссылка на sitemap
```

Форма раннего доступа отправляет заявки в Telegram. Если сообщения не приходят, посмотрите журнал: `docker compose -f docker-compose.prod.yml logs --tail=100 web`. В журнале пишется только код ответа Telegram, без токена и без e-mail.

## Что не входит в скрипт

- Установка Docker и Caddy на сервер.
- Выбор и покупка домена.
- Резервные копии: у сайта нет своей базы, заявки уходят в Telegram.
