CREATE TABLE trainer_profiles (
  user_id            TEXT PRIMARY KEY,
  display_name       TEXT,
  bio                TEXT,
  photo_r2_key       TEXT,
  specialties_json   TEXT DEFAULT '[]',
  instagram_handle   TEXT,
  updated_at_ms      INTEGER NOT NULL DEFAULT 0
);
