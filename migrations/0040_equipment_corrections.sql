-- 0040_equipment_corrections.sql
-- Fix High Pull: instructions say "holding a dumbbell or barbell" but equipment was ["none"].
-- Users without weights were incorrectly receiving this exercise in their military sessions.
UPDATE exercises
SET   equipment_required_json = '["dumbbell"]',
      updated_at_ms           = UNIXEPOCH() * 1000
WHERE slug = 'high-pull';
