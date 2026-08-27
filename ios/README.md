# РЕЧ · REČ — iOS client

SwiftUI app for learning Serbian, built against the [serbian_lng](https://github.com/Aristvodolaz/serbian_lng) REST API (NestJS + PostgreSQL) and the РЕЧ · REČ design concept.

The premise of both the design and the API is that Serbian is written in two alphabets, so the app shows ćirilica and latinica side by side instead of hiding one. The learner picks a script during onboarding (`cyrillic` / `latin` / `both`) and every prompt, word and lesson title respects that choice.

## Requirements

- Xcode 26 or newer (iOS 26 deployment target, Swift 5 language mode)
- The backend running locally — see its README: `docker compose up -d`, `npm run start:dev`. Course content is authored through the admin panel (`admin/`), not seeded.

No third-party packages: URLSession, Observation, Keychain and AVFoundation only.

## Running

1. Open `Serbian.xcodeproj` and run on a simulator or device.
2. Register a new account on the onboarding screen, or sign in with an existing one.

Debug builds point at the shared dev server (`http://159.194.226.2:3000`) and Release at production, set by the `REC_API_BASE_URL` build setting per configuration — the counterpart of Android's `BASE_URL` `buildConfigField`. To work against a backend on your own machine instead, change that setting to `http://localhost:3000` (see the backend README: `docker compose up -d`, `npm run start:dev`), or override it at runtime without a rebuild.

Resolution order for the API host:

1. the address typed into **Профил → Подешавања → Сервер** (kept in `UserDefaults`),
2. the `RecAPIBaseURL` key in the Info.plist, fed by `REC_API_BASE_URL`,
3. `http://localhost:3000`.

App Transport Security is split the same way Android splits its manifest: `Info-Debug.plist` (Debug) carries `NSAllowsLocalNetworking` plus an `NSExceptionDomains` entry for the dev server's IP, because it has no TLS yet; `Info.plist` (Release) carries no exceptions at all. Pointing a build at another plain-HTTP host needs its own exception entry — or HTTPS.

## Languages

The interface ships in Serbian (source), English and Russian, from `Serbian/Resources/Localizable.xcstrings`, with the same wording as Android's `values/`, `values-en/` and `values-ru/`. The wordmark, the tagline and the script specimens (`Здраво, како си?`) stay fixed in every locale — the first two are brand, the third is the thing being demonstrated. Lesson content itself is whatever the backend serves, which today means English translations.

## Screens

| Screen | Backend endpoints |
|---|---|
| Onboarding, script picker | `POST /auth/register`, `POST /auth/login` |
| Кораци — lesson path | `GET /units` |
| Exercise session | `GET /lessons/:id`, `POST /lessons/:id/exercises/:exerciseId/answer`, `POST /lessons/:id/complete` |
| Речник — flashcards | `GET /vocabulary/review`, `POST /vocabulary/:wordId/review` |
| Профил — progress | `GET /users/me/stats`, `GET /users/me/week`, `GET /badges`, `GET /badges/me` |
| Settings | `PATCH /users/me` |

## Structure

```
Serbian/
  DesignSystem/   Palette, type scale, kilim pattern, buttons, pills, cards
  Core/           APIClient, RecAPI endpoints, keychain token store, LoadState
  Models/         Codable mirrors of the backend DTOs
  Features/
    Root/         Phase switch + tab bar
    Onboarding/   Hero, script picker, register, sign in
    Path/         Winding lesson trail
    Lesson/       Exercise flow and completion summary
    Vocabulary/   Flashcard deck
    Profile/      Stats, weekly activity, badges, settings
    Session/      SessionStore — authentication state
  Services/       Pronunciation (audio URL or speech synthesis)
```

Each feature is a `@Observable` view model plus a view; screens hold a `LoadState` so loading, empty, error and loaded states are all handled explicitly. Views reach the API only through `session.api`.

## Notes on the implementation

- **One exercise type rendered.** The backend's exercise type registry defines `translation_choice` and `fill_word`; iOS renders only `translation_choice`. Exercises of any other type are filtered out of `playableExercises` and excluded from the `totalCount` sent to `/complete`, rather than being pushed through the multiple-choice layout by a build that doesn't understand them. Android does the same.
- **The client never knows the right answer in advance.** `GET /lessons/:id` omits `isCorrect`, so tapping "Провери" awaits `POST .../answer` before it can colour the choices. That server round trip is the reason the button shows a spinner.
- **Unknown enum values don't fail the response.** Lesson status, word status and script preference all decode unrecognised strings to a safe default (`locked`, `learning`, `both`) instead of throwing, which is how the Android client already behaves with its stringly-typed DTOs.
- **Tokens.** The access/refresh pair lives in the keychain (`kSecAttrAccessibleAfterFirstUnlock`). A 401 triggers a single refresh attempt; concurrent 401s are coalesced into one `POST /auth/refresh` call, and a failed refresh drops the session back to onboarding.
- **XP and streak** are only moved by lesson completion, matching the backend. The response from `POST /lessons/:id/complete` updates the header pills without another request.
- **Dates.** The API serialises timestamps with fractional seconds, which `JSONDecoder.dateDecodingStrategy = .iso8601` rejects, so the decoder tries the fractional formatter first and the plain one second. `lastActivityDate` is a calendar day, not a timestamp, and stays a string.
- **Pronunciation** uses `audioUrl` when the word has one, otherwise `AVSpeechSynthesizer` with a Serbian voice — falling back to Croatian or Bosnian, in which case the Latin spelling is read rather than the Cyrillic.
- **Colours** are declared once in `Palette` with explicit light and dark values, taken from the design's CSS custom properties.

## Not implemented

- Refresh-token rotation (the backend has no blacklist yet)
- Password reset, account deletion
- Offline caching — every screen fetches on appear and on pull to refresh
- Tests
