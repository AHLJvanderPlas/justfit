-- 0033: Add 5 running distance milestone awards
-- Evaluated client-side in AwardsView via run_coach.unlocked_targets

INSERT OR IGNORE INTO awards (id, slug, name, description, category, icon, criteria_json, is_active, created_at_ms, updated_at_ms) VALUES
  (lower(hex(randomblob(16))), 'run-5k',    'First 5K',       'You ran your first 5 kilometres. A real milestone — most people never start.',         'running', '🏃', '{"type":"run_distance","threshold":5}',  1, unixepoch()*1000, unixepoch()*1000),
  (lower(hex(randomblob(16))), 'run-10k',   '10K Runner',     'Double digits. Ten kilometres under your belt and a whole new aerobic level.',         'running', '🏃', '{"type":"run_distance","threshold":10}', 1, unixepoch()*1000, unixepoch()*1000),
  (lower(hex(randomblob(16))), 'run-15k',   'Beyond 10K',     'Fifteen kilometres. You''ve left the beginner category behind for good.',               'running', '🏃', '{"type":"run_distance","threshold":15}', 1, unixepoch()*1000, unixepoch()*1000),
  (lower(hex(randomblob(16))), 'run-hm',    'Half the Way',   'Twenty kilometres. Half-marathon territory — you can call yourself a distance runner.', 'running', '🏃', '{"type":"run_distance","threshold":20}', 1, unixepoch()*1000, unixepoch()*1000),
  (lower(hex(randomblob(16))), 'run-30k',   'Distance Runner','Thirty kilometres. You''ve entered the long-distance category. Respect.',               'running', '🏃', '{"type":"run_distance","threshold":30}', 1, unixepoch()*1000, unixepoch()*1000);
