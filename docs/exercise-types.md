# Контракт типа упражнения

Упражнение хранится как `type: varchar` + `payload: jsonb` (+ колонки `order`, `status`). Схема БД одна на все типы — новые типы добавляются без миграций. Реестр типов: `backend/src/content/exercise-types.ts` (`EXERCISE_TYPE_REGISTRY`).

## Общие правила

- Payload — обычный JSON, всё содержимое внутри payload.
- Все тексты дублируются: языки `ru`/`en` (выбор — язык интерфейса пользователя), сербский в двух письменностях `srCyr`/`srLat` (выбор — настройка письменности).
- Ответы (`answers[]`) ссылаются на словарное слово через `wordId` — тогда `sr/ru/en/audio/image` подтягиваются с бэка; инлайн-поля (`srCyr`, `srLat`, `ru`, `en`) — fallback, когда слова в словаре нет. Достаточно либо `wordId`, либо хотя бы одного инлайн-текста.
- `correctAnswerId` обязан совпадать с `id` одного из `answers[]`; все `answers[].id` — уникальные непустые строки.
- `settings` — необязательный объект с флагами рендера (`shuffleOptions`, `showImage`/`showSentenceTranslation`, `playAudio`).

## Валидация (когда и где)

`validateExercisePayload(type, payload) → ValidationIssue[]` — единственный источник истины, определён в валидаторе типа в реестре. Запускается:

1. **При сохранении** (админка): `createExercise` / `updateExercise` / `bulkCreateExercises` → HTTP 400 со списком issues (bulk — целиком, с номерами строк).
2. **При публикации**: publish-gate в `admin.service.ts` (не даёт опубликовать битое).
3. **При ответе**: `content.service.checkAnswer` → 400, если payload битый (клиент получает внятную ошибку, а не undefined-поведение).

Формат issue: `{ field: 'answers[2].id', message: '…' }` — JSON-path-подобный указатель на поле.

## Тип `translation_choice`

Выбор перевода: вопрос на сербском, варианты — переводы (или сербские синонимы).

```json
{
  "question": { "srCyr": "шума", "srLat": "šuma", "ru": "лес", "en": "forest", "wordId": null },
  "answers": [
    { "id": "a1", "wordId": "uuid-лес" },
    { "id": "a2", "srCyr": "вода", "srLat": "voda", "ru": "вода", "en": "water" },
    { "id": "a3", "ru": "город" }
  ],
  "correctAnswerId": "a1",
  "settings": { "shuffleOptions": true, "showImage": false, "playAudio": true }
}
```

Обязательные поля: `question` (нужен хотя бы один текст: srCyr/srLat/ru/en), `answers` (минимум 3), `correctAnswerId`.

## Тип `fill_word`

Предложение на сербском с пропуском, варианты — сербские слова.

```json
{
  "sentence": {
    "srCyr": "Ћутање не поседује ____.",
    "srLat": "Ćutanje ne poseduje ____.",
    "ru": "Молчание не обременяет ____.",
    "en": "Silence does not burden the ____."
  },
  "answers": [
    { "id": "w1", "srCyr": "путнике", "srLat": "putnike", "ru": "путников" },
    { "id": "w2", "srCyr": "шуме", "srLat": "šume" },
    { "id": "w3", "srCyr": "воде", "srLat": "vode" }
  ],
  "correctAnswerId": "w1",
  "settings": { "shuffleOptions": true, "showSentenceTranslation": true, "playAudio": false }
}
```

Обязательные поля: `sentence.srCyr` и `sentence.srLat` (оба, непустые), `answers` (минимум 3), `correctAnswerId`.

### Пропуск (blank)

Если автор не вписал `____` в предложение вручную, бэк при отдаче урока сам вырезает правильный ответ из предложения (`exercise-resolver.blankWord`: целое слово, без учёта регистра). Правила:

- авторский `____` в любом из скриптов — приоритет, автоподстановка не применяется;
- иначе автоподстановка сработает только при **точном целом** вхождении текста правильного ответа в предложение хотя бы в одном скрипте (`лес` в «Видим лес.» — да; `шума` в «Видим шуму.» — нет, это словоформа);
- ни того, ни другого нет → валидатор отклоняет payload: пропуск не подставится и упражнение вырождается (sentence показался бы целиком).

Для ответов только с `wordId` (без инлайн sr-текста) блокирующая проверка пропуска не применяется — валидатор не может загрузить слово; автоподстановка считается по контенту слова при отдаче, поэтому sentence должен содержать слово дословно или авторский `____`.

## Чек-лист: добавить новый тип

1. **Реестр** (`backend/src/content/exercise-types.ts`): добавить тип в `EXERCISE_TYPES`, описать TS-интерфейс payload, добавить запись в `EXERCISE_TYPE_REGISTRY` с `label`/`description` (для списка шаблонов админки), `createPayload()` (пустой, но структурно корректный шаблон) и `validate()` (единственный источник истины; обязан проверять уникальность `answers[].id` и совпадение `correctAnswerId`).
2. **Админ-конфиг** (`admin/…/exercise-templates.ts`): редактор конфиг-driven — поля нового типа подхватятся из payload-шаблона; убедиться, что формы ввода покрывают все редактируемые поля.
3. **Клиентский рендер** (`ios/…/LessonScreen.swift`): новая body-вью + case в `switch exercise.type` (пер-типные subviews — точка расширения для F10).

Бэкенд-эндпоинты, `checkAnswer`, миграции — не трогаются: всё уже обобщено через реестр.
