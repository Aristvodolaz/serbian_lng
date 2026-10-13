# Implementation Report: F1 — Exercise Contract Polish

## Summary
Implemented feature F1 per the approved plan (`.claude/prds/f1-exercise-contract-polish.plan.md`, agreed 2026-10-09): a documented exercise-payload contract enforced at save time, server-side answer accounting (first-attempt scoring), and an iOS lesson UX pass (queue repeats, bottom feedback panel, sounds, shuffle, fill-word gap styling, a11y, per-type body views).

## Tasks Completed

| # | Stage | Status | Notes |
|---|---|---|---|
| 1 | Этап 1: Jest + ts-jest, specs for exercise-types / exercise-resolver | Complete | 29 tests green |
| 2 | Этап 2: контракт типа упражнения | Complete | Deviation — see below (blank check is blocking, not warning) |
| 3 | Этап 3: серверный учёт ответов | Complete | UserExerciseAnswer entity + migration; completeLesson scores first attempts |
| 4 | Этап 4: iOS очередь повторов | Complete | Wrong answers re-queue; XP counts first attempt only |
| 5 | Этап 5: фидбек-панель, звуки, shuffle, fill_word, a11y | Complete | FeedbackPanel component; .caf sounds via SoundService |
| 6 | Этап 6: per-type subviews | Complete | TranslationChoiceBody / FillWordBody; same switch, no registries |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis | Not run | `npm run lint` fails: eslint is NOT in backend devDependencies (`sh: eslint: command not found`). Not silently fixed. |
| Unit Tests | Pass | 29/29 (exercise-types.spec.ts, exercise-resolver.spec.ts) |
| Backend Build | Pass | `npm run build` (nest build) clean |
| iOS Build | Pass | `xcodebuild -project ios/Serbian.xcodeproj -scheme Serbian -destination 'generic/platform=iOS Simulator' build` → BUILD SUCCEEDED |
| Integration | Not run | Manual Swagger/curl checks (per plan Verification) left for the user — DB not runnable in sandbox |
| Edge Cases | Manual | «Заврши» only after a CORRECT answer on the last exercise; wrong on last repeats; network error keeps selection |

## Files Changed

| File | Action |
|---|---|
| `backend/package.json` / `package-lock.json` | UPDATED — jest + ts-jest devDependencies |
| `backend/jest.config.js` | CREATED |
| `backend/src/content/exercise-types.ts` | UPDATED — contract doc comments, `validateExercisePayload`, fill_word blank check |
| `backend/src/content/exercise-types.spec.ts` | CREATED |
| `backend/src/content/exercise-resolver.spec.ts` | CREATED |
| `backend/src/content/entities/user-exercise-answer.entity.ts` | CREATED |
| `backend/src/database/migrations/1793000000000-CreateUserExerciseAnswers.ts` | CREATED |
| `backend/src/content/content.service.ts` | UPDATED — checkAnswer validates payload + saves attempt; completeLesson first-attempt scoring |
| `backend/src/content/lessons.controller.ts` | UPDATED — answer passes user.id; 400 error shape `{ message, issues }` |
| `backend/src/content/content.module.ts` | UPDATED — UserExerciseAnswer in forFeature |
| `backend/src/admin/admin.service.ts` | UPDATED — validation on create/update (400) and bulkCreateExercises (per-row `{ row, issues }`) |
| `backend/docs/exercise-types.md` | CREATED — contract reference |
| `ios/Serbian/Features/Lesson/LessonViewModel.swift` | UPDATED — queue repeats, first-attempt XP, shuffle at load, sound calls |
| `ios/Serbian/Features/Lesson/LessonScreen.swift` | UPDATED — FeedbackPanel integration, fill_word gap styling, ChoiceRow a11y, TranslationChoiceBody/FillWordBody |
| `ios/Serbian/DesignSystem/Components.swift` | UPDATED — FeedbackPanel component added |
| `ios/Serbian/Services/SoundService.swift` | CREATED — AVAudioPlayer, .ambient category |
| `ios/Serbian/Resources/Sounds/correct.caf`, `wrong.caf` | CREATED — generated chime / double-buzz |
| `ios/Serbian/Resources/Localizable.xcstrings` | UPDATED — 5 new keys with en/ru translations |

## Deviations from Plan
- **Этап 2**: fill_word blank check implemented as a **blocking ValidationIssue** (create/update/publish gate), not a soft warning-issue — matching how other payload rules behave, and simpler than a warning channel that nothing consumes.
- **Этап 2**: `updateExercise` payload validation runs only when `type`/`payload` are actually changed in the update (partial DTOs otherwise).
- **Отчёт по «урок без упражнений»**: LessonSummary carries no exercise count, so Path cannot pre-filter; the guard remains LessonScreen's «Лекција је празна» empty state. iOS project has **no test target**, so the plan's logic-test item is not automatable within this feature's scope.

## Issues Encountered
- eslint missing from backend devDependencies — lint level skipped (script exists but cannot run).
- No Postgres in the sandbox — integration/curl checks deferred to the user.
- Build error during Stage 5 (`LocalizedStringKey` vs `String` for FeedbackPanel.actionTitle) — fixed by typing `actionTitle: String` (value is already localized in the VM).

## Next Steps
- [ ] Manual verification (plan's Verification section): Swagger/curl pass on answer validation shapes; manual lesson flow in simulator; smoke test all 30 lessons; silent-switch check for sounds.
- [ ] Native review of content before publish (separate open item from ТЗ work).
- [ ] Consider adding eslint to backend devDependencies in a separate change.
- [ ] Plan file intentionally left in `.claude/prds/` next to the PRD and Roadmap (the plan itself states those files are not to be moved/changed); not archived to `.claude/PRPs/plans/completed/`.
