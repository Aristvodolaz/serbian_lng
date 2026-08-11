# РЕЧ · REČ — iOS client

SwiftUI app for learning Serbian, built against the [serbian_lng](https://github.com/Aristvodolaz/serbian_lng) REST API (NestJS + PostgreSQL) and the РЕЧ · REČ design concept.

The premise of both the design and the API is that Serbian is written in two alphabets, so the app shows ćirilica and latinica side by side instead of hiding one. The learner picks a script during onboarding (`cyrillic` / `latin` / `both`) and every prompt, word and lesson title respects that choice.

## Requirements

- Xcode 26 or newer (iOS 26 deployment target, Swift 5 language mode)
- The backend running locally — see its README: `docker compose up -d`, `npm run seed`, `npm run start:dev`

No third-party packages: URLSession, Observation, Keychain and AVFoundation only.

## Running

1. Start the API. By default it listens on `http://localhost:3000`.
2. Open `Serbian.xcodeproj` and run on a simulator.
3. Register a new account on the onboarding screen, or sign in with a seeded one.

The API host is not compiled in. Resolution order:

1. the address typed into **Профил → Подешавања → Сервер** (kept in `UserDefaults`),
2. the `RecAPIBaseURL` key in `Info.plist`,
3. `http://localhost:3000`.

Running the app on a physical device means pointing it at your machine's LAN address. `Info.plist` allows plain HTTP for loopback and `*.local` only (`NSAllowsLocalNetworking`), so a bare IP over HTTP needs an explicit `NSExceptionDomains` entry — or just use HTTPS.

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

- **The client never knows the right answer in advance.** `GET /lessons/:id` omits `isCorrect`, so tapping "Провери" awaits `POST .../answer` before it can colour the choices. That server round trip is the reason the button shows a spinner.
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
