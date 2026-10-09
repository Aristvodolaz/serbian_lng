-- Fix typos in the words table.
-- Run INSIDE the rec_db database BEFORE re-uploading words_with_fields.csv:
--   docker compose -f docker-compose.prod.yml exec -T postgres psql -U rec -d rec_db -f fix_word_spelling.sql
-- (The unique `cyrillic` key can't be fixed via CSV upload alone — the corrected
--  key would be treated as a new word and create a duplicate of the old one.)

-- Mixed Cyrillic/Latin characters in the unique `cyrillic` key:
UPDATE words SET cyrillic = 'година'  WHERE cyrillic = 'годинa';
UPDATE words SET cyrillic = 'пролеће' WHERE cyrillic = 'проleће';

-- Duplicate of 'један' (same word, typo in the key).
-- Will fail with a foreign-key error if any user_word_progress rows reference it;
-- in that case delete those rows first or run without the strict check.
DELETE FROM words WHERE cyrillic = 'једan';
