# РЕЧ · REČ — Serbian language learning app

Mobile app (Android/iOS) for learning Serbian, built around the language's dual-script nature — every lesson and word shows both ćirilica and latinica side by side instead of picking one.

## Structure

- [`backend/`](backend/) — REST API (NestJS + PostgreSQL). See [backend/README.md](backend/README.md) for setup, endpoints and design decisions. Swagger/OpenAPI is generated from the code, not hand-written.
- [`android/`](android/) — Kotlin + Jetpack Compose client.
- [`ios/`](ios/) — SwiftUI client. See [ios/README.md](ios/README.md).
- [`srpski-app/`](srpski-app/) — a separate Python pipeline that authors and validates a Russian→Serbian course from CSV into JSON. **Nothing consumes its output yet.** It describes richer exercise formats (`word_bank`, `match_pairs`, `listen_word_bank`) that exist only in that schema, not in the backend and not in either client.

Both clients are thin: they bundle no course content and read everything from the API. Content lives in the database and is authored through the admin panel ([`admin/`](admin/)) — units/lessons and dictionary words in the UI, exercises via the exercise APIs or bulk CSV upload.

## What the clients share

Android and iOS implement the same API surface and the same two learning modes, because those are the two the backend supports:

- **Lessons** — multiple choice only (`translate_choice`, the sole member of the backend's `ExerciseType` enum). Exercises of any other type are filtered out on both clients rather than rendered through the wrong UI, and are excluded from the score posted to `/complete`.
- **Vocabulary** — spaced-repetition flashcards, answered "still learning" or "I know it".

Other shared behaviour worth keeping in step when either client changes: JWT access/refresh with a single retry on 401, unknown enum values decoding to a safe default instead of failing the whole response, and UI copy in Serbian (source), English and Russian.

## Status

- Design concept: 5 core screens (script picker, lesson path, exercise, flashcards, profile) plus a design system.
- Backend: auth, lesson path/exercises, flashcard review, badges — implemented and verified end-to-end against PostgreSQL.
- Android and iOS: onboarding, lesson path, lessons, flashcards and profile, all against the live API.

### Known gaps

- No word-pair matching, word bank or listening exercises anywhere in the shipping stack. Adding one means a new entry in the backend's exercise type registry, content for it (authored through the admin panel), and a screen on both clients before it is worth wiring up.
- `PATCH /users/me` is implemented on the backend and called by iOS (profile settings), but Android has no screen for it yet.
- Lesson content is authored with **English** translations, while both clients localise their own chrome into Russian and English — so a Russian-speaking learner currently gets a Russian interface around English answers.
