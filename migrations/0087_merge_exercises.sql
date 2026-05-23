-- Migration 0087: merge custom_exercises into exercises
-- custom_exercises was a separate table for gym-specific exercises.
-- After merge: exercises rows with gym_id IS NULL are system/global;
-- rows with gym_id = <id> are gym-owned custom exercises.
-- No live custom exercise data to migrate (no active gyms).

ALTER TABLE exercises ADD COLUMN gym_id TEXT REFERENCES gyms(id);
ALTER TABLE exercises ADD COLUMN visibility TEXT NOT NULL DEFAULT 'global';
ALTER TABLE exercises ADD COLUMN created_by_user_id TEXT REFERENCES users(id);
ALTER TABLE exercises ADD COLUMN instructions_markdown TEXT;
ALTER TABLE exercises ADD COLUMN instructions_markdown_nl TEXT;
-- primary_muscles_json and secondary_muscles_json already exist on this table
ALTER TABLE exercises ADD COLUMN contraindications_json TEXT;
ALTER TABLE exercises ADD COLUMN difficulty TEXT;
ALTER TABLE exercises ADD COLUMN image_r2_key TEXT;
ALTER TABLE exercises ADD COLUMN video_r2_key TEXT;
ALTER TABLE exercises ADD COLUMN source TEXT;
ALTER TABLE exercises ADD COLUMN parent_exercise_id TEXT REFERENCES exercises(id);

DROP TABLE IF EXISTS custom_exercises;
