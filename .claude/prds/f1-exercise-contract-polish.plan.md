# Технический план F1 — Полировка ядра упражнений + контракт типов

## Context

Фича F1 из [Feature Roadmap](.claude/prds/serbian-learning-app.feature-roadmap.md) (PRD: `.claude/prds/serbian-learning-app.prd.md`): довести два существующих типа упражнений (`translation_choice`, `fill_word`) до качества эталона и зафиксировать контракт типа упражнения, чтобы новые типы (аудирование, word bank, matching — F10) подключались без переписывания. Первый шаг MVP перед запуском.

**Текущее состояние** (исследование сессии):
- Бэк: реестр типов уже есть — `backend/src/content/exercise-types.ts` (`EXERCISE_TYPES`, per-type `validate() → ValidationIssue[]`), но валидация запускается только при публикации; при сохранении проверяется лишь существование типа. Проверка ответа — чистое сравнение `answerId === correctAnswerId` (`content.service.ts:checkAnswer`); `completeLesson` доверяет клиентскому `correctCount`. Blank-at-serve-time для fill_word — `exercise-resolver.ts:toPublicPayload`/`blankWord`. Тестов нет вообще.
- iOS: `LessonScreen`/`LessonViewModel` — forward-only, ошибки не повторяются; фидбек — маленький InlineMessage; `shuffleOptions` из payload игнорируется; fill_word — тот же choice-список (предложение с `____` приходит с сервера, но пропуск не стилизован); звуков нет.
- Админка: config-driven редактор (`exercise-templates.ts`) — структурно неверный payload для известного типа создать нельзя; issues показываются, но сохранение не блокируется.

**Решения пользователя по scope** (подтверждены через AskUserQuestion):
1. Неверный ответ → повтор упражнения в конце урока (Duolingo-style, до верного ответа)
2. Серверная запись каждого ответа (userId, exerciseId, correct); completeLesson считает результат по серверу, клиентский отчёт — fallback
3. Нижняя фидбек-панель («Тачно/Није тачно» + правильный ответ + кнопка «Настави») вместо InlineMessage
4. Короткие звуковые эффекты верно/неверно; существующая хаптика остаётся

**Путь сохранения плана после апрува**: `.claude/prds/f1-exercise-contract-polish.plan.md` (рядом с PRD и Roadmap; они не изменяются). После сохранения — стоп и ожидание подтверждения реализации.

---

## Этапы (каждый завершается проверяемым результатом)

### Этап 1. Тестовая база для существующей логики (safety net)

Тестов нет — перед изменением контракта фиксируем текущее поведение.

- Jest + ts-jest в `backend/package.json` (стандарт NestJS), скрипт `test`.
- Новые spec-файлы (unit, без БД):
  - `backend/src/content/exercise-types.spec.ts` — валидаторы обоих типов: валидные payload проходят, известные ошибки ловятся (пустые answers, отсутствующий correctAnswerId, дубли id, битые settings).
  - `backend/src/content/exercise-resolver.spec.ts` — `blankWord`: подстановка `____` по словесным границам, регистронезависимость, отсутствие подстановки для словоформ, уважение авторского `____`.
- **Готово когда**: `npm test` зелёный.

### Этап 2. Формализация контракта типа (бэк)

- `exercise-types.ts`: документирующие комментарии контракта (тип + jsonb payload + settings; обязательства нового типа: `createPayload`, `validate`, уникальные `answer.id`, корректный `correctAnswerId`).
- Валидатор `fill_word`: warning-issue, если в sentence нет ни авторского `____`, ни точного вхождения правильного ответа (иначе пропуск не подставится и упражнение вырождается).
- Валидация при сохранении: `admin.service.ts` `createExercise`/`updateExercise` — прогонять `validateExercisePayload`, при issues отклонять (400 со списком). `bulkCreateExercises` — валидировать батч, отклонять целиком с номерами строк. Publish-gate остаётся.
- `checkAnswer` (`content.service.ts`): перед сравнением валидировать payload через реестр; битый payload → 400/404 с внятным сообщением (сейчас только `'Exercise has no answers'`).
- Новый документ `docs/exercise-types.md`: справочник контракта (обе схемы payload, примеры, чек-лист добавления нового типа: реестр → админ-конфиг → клиентский рендер). Главный артефакт масштабируемости для F10.

### Этап 3. Серверный учёт ответов

- Новая entity `UserExerciseAnswer`: `userId, exerciseId, lessonId, correct, attemptNumber, answeredAt`; хранение последней попытки по `(userId, exerciseId)`. Миграция TypeORM.
- `checkAnswer`: после вычисления корректности сохранять запись (с инкрементом attemptNumber).
- `completeLesson`: если серверные записи для урока есть — считать `correctCount/totalCount` из них (по первой попытке каждого упражнения), клиентский отчёт — fallback (совместимость). XP-логика (0.6 full / ×0.5) не меняется.
- Ответы эндпоинтов не меняются — клиенты совместимы.

### Этап 4. iOS: повтор ошибок в конце урока

- `LessonViewModel.swift`: очередь вместо индекса — на неверный ответ упражнение переносится в конец и повторяется до первого верного; `correctCount` — только по первой попытке (основа XP). Прогресс-бар — по первоначальному числу упражнений (повторы не двигают прогресс).
- `completeLesson` отправляет first-attempt счётчики (сервер с этапа 3 сверит по своим записям).
- Граничные случаи: выход mid-lesson — поведение не меняется; ошибка сети при `answer` — выбор сохраняется, «Провери» доступна повторно (сейчас состояние сбрасывается некорректно — починить); урок без упражнений — экран не открывается из Path (уже так, зафиксировать тестом логики).

### Этап 5. iOS: фидбек-панель, звуки, полировка деталей

- **Нижняя фидбек-панель** (новый компонент в `DesignSystem/Components.swift`): во всю ширину над кнопкой продолжения, зелёный/красный фон, иконка, «Тачно!» / «Није тачно — тачан одговор: …» (правильный ответ сербом + перевод), кнопка «Настави» внутри панели. InlineMessage из урока уходит.
- **Звуки**: два коротких .caf (correct/wrong), маленький `Services/SoundService.swift` (AVAudioPlayer, категория `.ambient` — уважает silent switch), вызовы из ViewModel. Хаптика (`sensoryFeedback`) остаётся.
- **`shuffleOptions`**: применять при загрузке упражнения (стабильный в рамках сессии shuffle).
- **fill_word**: стилизовать пропуск в предложении — подсветка/подчёркивание сегмента `____` (разбор строки на части во view, без изменения моделей).
- **A11y**: `ChoiceRow` — button trait, явные accessibility labels для состояний.

### Этап 6. Структура рендеринга по типам (без новых слоёв)

- В `LessonScreen.swift` текущий `switch exercise.type` (eyebrow/prompt/choiceText/body) разнести на per-type приватные subviews (`TranslationChoiceBody`, `FillWordBody`), общие компоненты сохраняются. Это не новая абстракция — тот же switch, но точка расширения для F10 становится явной: новый тип = новая body-вью + case. Протоколы-реестры на клиенте не вводить (решение F10, после его PRD).

---

## Файлы

**Бэк**: `backend/package.json`; `backend/src/content/exercise-types.ts`; `backend/src/content/exercise-resolver.ts`; `backend/src/content/content.service.ts`; `backend/src/admin/admin.service.ts`; новая entity + миграция `UserExerciseAnswer`; новые `*.spec.ts`; новый `docs/exercise-types.md`.

**iOS**: `Features/Lesson/LessonViewModel.swift`; `Features/Lesson/LessonScreen.swift`; `DesignSystem/Components.swift`; новый `Services/SoundService.swift`; ассеты звуков; `Resources/Localizable.xcstrings` (строки фидбек-панели).

**Админка**: без изменений кода (валидация уже отображается; блокировка появляется на бэке).

## Вне scope

Аудио/TTS в уроках (F6), новые типы упражнений (F10), аналитические дашборды (F7 — таблица ответов этапа 3 даст ей данные), офлайн, Android.

## Verification

1. `cd backend && npm run lint && npm test` — все юнит-тесты зелёные.
2. Вручную через Swagger/curl: создать/обновить упражнение с битым payload → 400 со списком issues; bulk-CSV с плохой строкой → отказ с номерами; `answer` на битом payload → 400/404; записи `user_exercise_answers` растут по ответам; `complete` после прохождения возвращает XP по серверным данным (проверить подменой correctCount от клиента).
3. iOS: сборка (`xcodebuild build` или симулятор) — урок: верный/неверный ответ → панель + звук + хаптика; неверный возвращается в конце; повтор до верного; прогресс и XP по первой попытке; shuffle работает; fill_word показывает стилизованный пропуск; silent switch глушит звуки.
4. Смоук-прогон целых уроков на существующем контенте (30 уроков) — ни один не ломается.

## Риски и обработки

- Repeat-wrong меняет семантику `totalCount` — согласовано с бэком: first-attempt подсчёт фиксируется и в серверном учёте (attemptNumber=1), и в клиентском отчёте.
- Серверный upsert `(userId, exerciseId)` затирается при повторном прохождении урока — приемлемо: актуальная попытка важнее; полная история попыток не нужна F7 (проверить при планировании F7).
- Появление тест-раннера — единственная новая тулза; без неё менять контракт вслепую опаснее.

## Статус

План согласован 2026-10-09. Реализация не начата — старт по подтверждению.
