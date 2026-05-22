-- Migration 0071: Dutch translation columns for exercise names and instructions
-- Option 1: parallel NL columns alongside English originals.
-- Frontend picks based on locale (nl → name_nl ?? name).

-- Custom exercises (trainer-created): full NL support
ALTER TABLE custom_exercises ADD COLUMN name_nl                  TEXT;
ALTER TABLE custom_exercises ADD COLUMN instructions_markdown_nl TEXT;

-- Global exercise library: Dutch name only (instructions are structured JSON)
ALTER TABLE exercises ADD COLUMN name_nl TEXT;
