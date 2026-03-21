INSERT INTO awards (id, slug, name, description, category, icon, criteria_json, is_active, created_at_ms, updated_at_ms) VALUES
  ('awd_genesis',       'genesis',       'Genesis',          'Complete your very first training session.',           'milestone', 'zap',    '{"type":"session_count","threshold":1}',          1, 1767830400000, 1767830400000),
  ('awd_habit',         'habit',         'The Habit',        'Three workouts logged. The rhythm is forming.',        'milestone', 'flame',  '{"type":"session_count","threshold":3}',          1, 1767830400000, 1767830400000),
  ('awd_iron_will',     'iron-will',     'Iron Will',        'Maintain a Consistency Score of 80 or higher.',        'performance','bolt',  '{"type":"consistency_score","threshold":80}',     1, 1767830400000, 1767830400000),
  ('awd_full_rotation', 'full-rotation', 'Full Rotation',    'Seven sessions completed across your history.',        'milestone', 'medal',  '{"type":"session_count","threshold":7}',          1, 1767830400000, 1767830400000),
  ('awd_resilient',     'resilient',     'Resilient',        'Trained on a day you reported low energy or stress.',  'habit',     'heart',  '{"type":"resilience_count","threshold":1}',       1, 1767830400000, 1767830400000),
  ('awd_streak_14',     'streak-14',     'Two Week Warrior', 'Stay active for 14 days straight.',                    'streak',    'fire',   '{"type":"streak_days","threshold":14}',           1, 1767830400000, 1767830400000),
  ('awd_no_excuses',    'no-excuses',    'No Excuses',       'Completed a session with no gear or clothing.',        'habit',     'shield', '{"type":"no_excuse_session","threshold":1}',      1, 1767830400000, 1767830400000),
  ('awd_traveler',      'road-warrior',  'Road Warrior',     'Completed a workout while traveling.',                 'habit',     'plane',  '{"type":"travel_session","threshold":1}',         1, 1767830400000, 1767830400000),
  ('awd_micro_master',  'micro-master',  'Micro Master',     'Completed 5 micro sessions.',                          'habit',     'clock',  '{"type":"micro_session_count","threshold":5}',    1, 1767830400000, 1767830400000),
  ('awd_pro_status',    'pro-status',    'Pro Status',       'Unlock the full JustFit adaptive engine.',             'special',   'star',   '{"type":"pro_subscription","threshold":1}',       1, 1767830400000, 1767830400000),
  ('awd_perfect_week',  'perfect-week',  'Perfect Week',     'Hit 7 active days in a single week.',                  'streak',    'trophy', '{"type":"perfect_week","threshold":1}',           1, 1767830400000, 1767830400000),
  ('awd_king',          'king',          'Consistency King', 'Hit the perfect Consistency Score of 100.',            'performance','crown', '{"type":"consistency_score","threshold":100}',    1, 1767830400000, 1767830400000);

CREATE TABLE IF NOT EXISTS referral_codes (
  user_id TEXT PRIMARY KEY REFERENCES users(user_id),
  code    TEXT UNIQUE NOT NULL
);
