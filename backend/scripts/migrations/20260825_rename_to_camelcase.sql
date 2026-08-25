-- Rename translation columns from snake_case to camelCase to match TypeORM defaults

ALTER TABLE units RENAME COLUMN "title_translation_ru" TO "titleTranslationRu";
ALTER TABLE units RENAME COLUMN "title_translation_en" TO "titleTranslationEn";

ALTER TABLE lessons RENAME COLUMN "title_translation_ru" TO "titleTranslationRu";
ALTER TABLE lessons RENAME COLUMN "title_translation_en" TO "titleTranslationEn";

ALTER TABLE exercises RENAME COLUMN "prompt_translation_ru" TO "promptTranslationRu";
ALTER TABLE exercises RENAME COLUMN "prompt_translation_en" TO "promptTranslationEn";

ALTER TABLE exercise_choices RENAME COLUMN "text_ru" TO "textRu";
