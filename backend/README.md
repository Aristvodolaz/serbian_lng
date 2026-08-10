# REČ API

Backend for **РЕЧ · REČ** — a Serbian language learning app (Android/iOS clients). NestJS + TypeORM + PostgreSQL.

## Stack

- **NestJS** (TypeScript) — REST API, JWT auth
- **PostgreSQL** via TypeORM
- **Swagger/OpenAPI** — generated automatically from controller/DTO decorators (`@nestjs/swagger`), never hand-written, so it can't drift from the code

## Getting started

```bash
docker compose up -d        # starts Postgres on :5433 (host) → 5432 (container)
cp .env.example .env
npm install
npm run seed                # loads the 5 units/lessons/exercises/words/badges from the design mockup
npm run start:dev
```

The API listens on `http://localhost:3000`. Interactive docs: `http://localhost:3000/api/docs`.
A static `openapi.json` is written to the project root on every boot (and via `npm run swagger:generate`, which does it without starting the HTTP listener) — useful for generating a typed client SDK for the mobile app.

## Domain model

Mirrors the five screens in the design mockup:

| Screen | Endpoints |
|---|---|
| Script picker (onboarding) | `POST /auth/register` with `scriptPreference` |
| Home path | `GET /units` — units/lessons with per-lesson status (`done` / `current` / `locked`) |
| Exercise | `GET /lessons/:id`, `POST /lessons/:id/exercises/:exerciseId/answer`, `POST /lessons/:id/complete` |
| Flashcards | `GET /vocabulary/review`, `POST /vocabulary/:wordId/review` |
| Profile | `GET /users/me/stats`, `GET /users/me/week`, `GET /badges/me` |

## Notable design decisions

- **Correct answers never reach the client before an answer is submitted.** `GET /lessons/:id` returns choices without `isCorrect`; the answer is revealed only by `POST .../answer`, which returns `correctChoiceId`.
- **Streak/XP** update only on lesson completion (not on flashcard review) — a deliberate MVP simplification, documented in `ContentService.applyStreakAndXp`.
- **Badges** (`first_week`, `100_words`, `no_mistakes`) are evaluated after lesson completion and after vocabulary review via `BadgesService.evaluateForUser`.
- **Auth** is stateless JWT (short-lived access token + longer-lived refresh token, both HMAC-signed). No refresh-token rotation/blacklist yet — acceptable for MVP, called out here so it isn't mistaken for an oversight.
- `TYPEORM_SYNCHRONIZE=true` (see `.env.example`) auto-creates tables from entities for local dev. Switch to TypeORM migrations before running against a shared/production database.

## Scripts

- `npm run start:dev` — dev server with watch mode
- `npm run build` — type-check + compile to `dist/`
- `npm run seed` — idempotent: skips content/words that already exist, only inserts missing badges
- `npm run swagger:generate` — writes `openapi.json` without starting the server
