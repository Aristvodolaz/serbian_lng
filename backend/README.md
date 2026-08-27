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
npm run start:dev
```

The API listens on `http://localhost:3000`. Interactive docs: `http://localhost:3000/api/docs`.

Course content is authored through the **admin panel** (see `../admin/`): units/lessons and dictionary words via the admin UI, and exercises either one by one via the exercise APIs or in bulk by uploading a CSV (`UploadExercisesCsv`, sample in `../admin/test-fill-word-exercises.csv`).
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
- **Schema migrations.** Local dev relies on `synchronize`; the CLI migrations exist for the day the schema stops being auto-created. `1790000000000-ContentPayloadSchema` brings an old-schema database to the payload model (exercises `type` enum→varchar, `payload jsonb`, `status` on content, Word without `unitId`). It is **destructive by design** — legacy `exercise_choices` and `prompt_*` columns are dropped and existing exercises come back as empty drafts, because content is re-authored through the admin panel / CSV upload. On a fresh database it's a no-op guarded by `IF EXISTS`; there you don't need it at all.

## Scripts

- `npm run start:dev` — dev server with watch mode
- `npm run build` — type-check + compile to `dist/`
- `npm run swagger:generate` — writes `openapi.json` without starting the server
- `npm run migration:run` / `migration:revert` / `migration:show` — run TypeORM migrations against `DATABASE_URL` via the CLI datasource (`src/database/data-source.ts`)
