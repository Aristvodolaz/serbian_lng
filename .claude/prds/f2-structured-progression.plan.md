# Технический план F2 — Структурированная прогрессия (главы, CEFR, чекпоинты)

## Context

Фича F2 из [Feature Roadmap](.claude/prds/serbian-learning-app.feature-roadmap.md): CEFR-разметка, разделы/чекпоинты, понятная карта пути. F1 (контракт типов + полировка) уже одобрена к реализации.

**Подтверждённые продуктовые решения** (AskUserQuestion, 2026-10-12):
1. **Глава (Section) над юнитами** — новая сущность; CEFR-уровень задаётся на главе (сейчас весь контент A1).
2. **Чекпоинт — смешанный урок**: упражнения, автоматически собранные из опубликованных упражнений уроков главы + словарные вопросы (translation_choice) по словам главы. Новый контент для чекпоинтов не авторится.
3. **Гейт только на чекпоинте**: бэк отдаёт 403 при попытке начать урок следующей главы, если чекпоинт текущей не пройден; внутри главы — свободный доступ. Первая глава открыта.

**Текущее состояние** (исследование):
- Бэк: `unit.entity.ts` (уникальный `titleCyrillic`, поле `order`), `lesson.entity.ts` (`unitId` NOT NULL, `order` — **глобальный** по пути, уникальность `[unitId,title]`), прогресс только `UserLessonProgress` (unique `[userId,lessonId]`). Миграции есть (`src/database/migrations/`, стиль `179X0000000000-`), `synchronize` только при `TYPEORM_SYNCHRONIZE=true`. `getPathForUser` (content.service.ts:45-89) вычисляет `currentLessonId` по глобальному порядку; «locked» — чисто вычисляемое поле, БД ничего не гейтит. Админ: units/lessons CRUD + bulk + cascade publish; CSV строит `backend/scripts/build-content-csvs.js`. Jest уже подключён (F1), спеки на exercise-types/resolver есть.
- iOS: `LearningPath.swift` — `PathUnit`→`LessonSummary` (status done/current/locked); `PathScreen.swift` — вертикальная тропа, зигзаг по **глобальному** индексу урока, `UnitTrailSection` — лёгкий заголовок юнита. CEFR нигде нет.

**Путь сохранения после апрува**: `.claude/prds/f2-structured-progression.plan.md`.

---

## Этап 1. Модель: Section

- Новый `backend/src/content/entities/section.entity.ts`: `id` (uuid), `titleCyrillic` (unique), `titleLatin`, `titleTranslationRu`, `titleTranslationEn` (default ''), `level` varchar default `'A1'`, `status` (ContentStatus, DRAFT), `order` int, `@OneToMany → Unit`.
- `unit.entity.ts`: nullable `sectionId` (`ManyToOne`, `onDelete: 'SET NULL'`).
- Миграция `1794000000000-CreateSectionsAndLinkUnits.ts`: создать `sections`; добавить `units.sectionId` + индекс; **backfill** — одна дефолтная глава (`'Основе'`, A1, order 0), все существующие юниты в неё. Обратима.
- Регистрация `Section` в `forFeature` content- и admin-модулей.
- **Готово когда**: `migration:run` проходит, `GET /units` не изменился, админка работает.

## Этап 2. Модель: чекпоинт-урок

- `lesson.entity.ts`: поле `kind` varchar default `'regular'` (`'checkpoint'`); `unitId` становится nullable (чекпоинт принадлежит главе, не юниту); добавляется nullable `sectionId` на уроке.
- Уникальность `[unitId,title]` → частичные уникальные индексы в миграции `1795000000000-CheckpointLessons.ts`: `(unit_id,title) WHERE unit_id IS NOT NULL` и `(section_id,title) WHERE kind='checkpoint'`.
- **Сборка чекпоинта — serve-time материализация**: при первом `GET /lessons/:id` чекпоинта бэк собирает упражнения и записывает их как настоящие `exercise`-строки (PUBLISHED), чтобы `checkAnswer`/`completeLesson`/`UserExerciseAnswer` работали без изменений:
  1. Упражнения: опубликованные упражнения уроков главы, детерминированный round-robin-семплинг до ~8 штук.
  2. Слова главы = distinct `wordIds` из payload'ов опубликованных упражнений главы (`collectWordIds` уже есть в `exercise-resolver.ts`); для каждого слова — `translation_choice` (правильный ответ = слово + 3 дистрактора из слов главы, fallback — глобальные слова).
  3. Материализация идемпотентна (delete+recreate), **заморозка**: после появления любых `UserExerciseAnswer` этого урока перегенерация запрещена.
- Прохождение = обычный `completeLesson` (attemptNumber=1, порог 0.6, `UserLessonProgress`, xpReward по умолчанию 30). «Чекпоинт пройден» = есть строка прогресса.
- **Готово когда**: спеки на сборку (сэмплинг, дистракторы, идемпотентность, заморозка) зелёные.

## Этап 3. Path API

- Новый ответ (breaking; iOS и бэк выкатываются вместе, Android заморожён — без compat-шим):
  `PathResponseDto { sections: SectionPathDto[] }`; `SectionPathDto { id, titles×4, level, order, units: UnitPathDto[], checkpoint: LessonSummaryDto | null }`; `UnitPathDto`/`LessonSummaryDto` без изменений.
- `getPathForUser` refactor: секции (PUBLISHED, order ASC) → юниты → уроки как сегодня. Чекпоинт-уроки исключаются из `UnitPathDto.lessons` и отдаются в `checkpoint` секции; участвуют в глобальном порядке при вычислении `currentLessonId`.
- Юниты без главы → хвостовой псевдо-секцией (`level: null`) — legacy-совместимость для CSV-загрузок без `sectionTitle`.
- **Готово когда**: `GET /units` возвращает секции; существующий контент виден в дефолтной главе; спеки `path-assembly.spec.ts` (порядок, размещение чекпоинта, псевдо-секция) зелёные.

## Этап 4. Гейтинг (403)

- `ContentService.assertLessonAccessible(userId, lessonId)`, вызывается в начале `getLessonDetail` (+ `@CurrentUser()`), `checkAnswer`, `completeLesson`:
  - чекпоинт → гейт: все опубликованные обычные уроки его главы завершены (один `IN`-запрос по прогрессу, без N+1);
  - обычный урок → его юнит → глава; глава без чекпоинта или первая глава → открыта; иначе требуется прогресс-строка чекпоинта этой главы;
  - урок без главы → открыт.
- `ForbiddenException({ message: 'SECTION_LOCKED', sectionId })` — в стиле существующих исключений.
- Спеки `gating.spec.ts`: матрица (первая глава открыта; вторая 403 до чекпоинта / 200 после; чекпоинт гейтится уроками своей главы; answer/complete тоже гейтятся).

## Этап 5. Админка + CSV

- `admin.service.ts`/`admin.controller.ts`: CRUD секций + `POST admin/sections/:id/publish`, `sections/publish-all`, `sections/bulk` (зеркально юнитам; publish секции — каскад через существующий `publishUnitLessons`). Чекпоинт публикуется, если в главе ≥1 опубликованного урока и ≥1 слова/упражнения для сборки; иначе — skip с причиной.
- Admin UI (Next.js): страница «Разделы» (форма `admin/src/components/forms/section-form.tsx` + список), в редакторе юнита — выбор секции; в списке уроков колонка `kind`, у чекпоинта упражнения read-only (собираются автоматически), редактируются title/xpReward.
- CSV (`backend/scripts/build-content-csvs.js`): новый `sections.csv` (`titleCyrillic,titleLatin,titleTranslationRu,titleTranslationEn,level`); в `units.csv` колонка `sectionTitle`; в `lessons.csv` колонка `kind` (пустой `unitTitle` допустим для чекпоинт-строк — чекпоинт резолвится на секцию).
- **Готово когда**: создать секцию → привязать юниты → publish → секция видна в path API; CSV-цикл проходит.

## Этап 6. iOS

- `Models/LearningPath.swift`: `SectionPath` (id, titles×4, `level: String?`, order, `checkpoint: LessonSummary?`, units); `LearningPath.sections` вместо `units`; computed `lessons` — флэт секция→юнит→уроки с чекпоинтом в конце секции (для счётчиков и `currentLesson`).
- `PathScreen.swift`: внешний `ForEach` по секциям — заголовок главы (`SectionHeader` + `Pill` с CEFR-уровнем), внутри существующая тропа юнитов; чекпоинт — нода `PathNode` с отличимым стилем (индиго-ободок, иконка флага/ромба вместо звезды). **Зигзаг**: `xOffset(for:)` перевести на локальный индекс внутри юнита — структурные изменения не должны сдвигать позиции нод.
- Гейтинг UX: 403 `SECTION_LOCKED` в detail/answer/complete → `LessonViewModel` показывает сообщение «Завршите проверу главе» и закрывает урок; карта уже показывает locked-ноды. Локализация — `Localizable.xcstrings` (sr-ключи + en/ru).
- Поток загрузки/обновления не меняется (полный reload пути + `refreshUser`).
- **Готово когда**: сборка проходит; legacy одна глава рендерится; тап по чекпоинту открывает урок; locked-ноды недоступны.

## Этап 7. Сквозная проверка

- `cd backend && npm run lint && npm test` — все спеки (включая F1) зелёные.
- Ручной цикл через Swagger/curl: секции → чекпоинт → прохождение → гейт открывается; попытка открыть урок второй главы до чекпоинта → 403.
- iOS: симулятор — карта с главами и уровнями, чекпоинт, гейт-сообщение; повторное прохождение урока не ломает порядок.

## Вне scope

Теория (F3), SRS-изменения (F4), аналитика (F7), Android (F11). Словарная часть чекпоинта — на существующих типах (translation_choice), новые типы упражнений не вводятся (F10).

## Файлы

**Бэк — новые**: `entities/section.entity.ts`; миграции `1794...` и `1795...`; спеки `path-assembly`, `gating`, `checkpoint-assembly`.
**Бэк — изменяемые**: `entities/unit.entity.ts`, `entities/lesson.entity.ts`; `content.service.ts` (path, gating, сборка чекпоинта); `content/dto/path-response.dto.ts`; `lessons.controller.ts`; `admin.controller.ts`, `admin.service.ts`, `content-dtos.ts`; `content.module.ts`, admin-модуль (регистрация Section); `backend/scripts/build-content-csvs.js`.
**iOS**: `Models/LearningPath.swift`; `Features/Path/PathScreen.swift`; `Features/Lesson/LessonViewModel.swift` (403-обработка); `Resources/Localizable.xcstrings`.
**Админка**: новая страница/форма секций; правка формы юнита; список уроков (kind).

## Риски и обработки

- **Breaking DTO** — выкатывать этапы 3 и 6 одной поставкой; Android не трогаем (заморожен).
- **Зигзаг по глобальному индексу** — переходим на локальный индекс юнита в этапе 6, иначе главы сдвигают тропу.
- **Материализация чекпоинта** — идемпотентно, с заморозкой после появления ответов; гонку закрывать транзакцией/проверкой существующих ответов перед delete.
- **`unitId` становится nullable** — проверить все запросы, джойнящие уроки через юниты (getPathForUser, bulk-логика админки).
- **Глобальный `lesson.order`** — чекпоинт должен стоять после последнего урока своей главы в CSV/админке; валидация при публикации секции.

## Статус

План согласован 2026-10-12 (апрув через ExitPlanMode). Реализация не начата — старт по подтверждению.
