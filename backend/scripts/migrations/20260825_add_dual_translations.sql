-- Migration: Add dual translation fields (Russian + English)
-- Date: 2026-08-25
-- Affected tables: units, lessons, exercises, exercise_choices

-- Unit translations
ALTER TABLE units ADD COLUMN IF NOT EXISTS title_translation_ru VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE units ADD COLUMN IF NOT EXISTS title_translation_en VARCHAR(255) NOT NULL DEFAULT '';

-- Lesson translations
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS title_translation_ru VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS title_translation_en VARCHAR(255) NOT NULL DEFAULT '';

-- Exercise prompt translations
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS prompt_translation_ru TEXT NOT NULL DEFAULT '';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS prompt_translation_en TEXT NOT NULL DEFAULT '';

-- Exercise choice translations
ALTER TABLE exercise_choices ADD COLUMN IF NOT EXISTS text_ru TEXT NOT NULL DEFAULT '';
