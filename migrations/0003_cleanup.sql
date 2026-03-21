-- Fix referral_codes FK (wrong reference in 0001)
DROP TABLE IF EXISTS referral_codes;
CREATE TABLE IF NOT EXISTS referral_codes (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  code    TEXT UNIQUE NOT NULL
);

-- Fix support_tokens FK
DROP TABLE IF EXISTS support_tokens;
CREATE TABLE IF NOT EXISTS support_tokens (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
