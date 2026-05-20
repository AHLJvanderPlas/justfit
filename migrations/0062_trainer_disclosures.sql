-- Migration 0062: trainer_disclosures table (P1A)
-- Per-connection privacy disclosure profile. Encrypted PII fields use gym envelope key.

CREATE TABLE trainer_disclosures (
  id                      TEXT PRIMARY KEY,
  user_id                 TEXT NOT NULL REFERENCES users(id),
  gym_id                  TEXT NOT NULL REFERENCES gyms(id),
  trainer_user_id         TEXT,               -- NULL = whole-gym disclosure
  level                   TEXT NOT NULL DEFAULT 'L1' CHECK (level IN ('L0','L1','L2','L3','L4')),
  display_name            TEXT NOT NULL,      -- user-chosen alias
  photo_r2_key            TEXT,
  real_name_first_enc     TEXT,               -- AES-GCM encrypted
  real_name_last_enc      TEXT,
  billing_name_enc        TEXT,
  billing_address_enc     TEXT,
  billing_postal_enc      TEXT,
  billing_city_enc        TEXT,
  billing_country         TEXT,               -- low sensitivity, unencrypted
  billing_vat_enc         TEXT,
  contact_email_enc       TEXT,
  contact_phone_enc       TEXT,
  share_training_history  INTEGER NOT NULL DEFAULT 0,
  share_checkins          INTEGER NOT NULL DEFAULT 0,
  share_pain_rpe          INTEGER NOT NULL DEFAULT 1,
  share_body_metrics      INTEGER NOT NULL DEFAULT 0,
  share_detailed_adherence INTEGER NOT NULL DEFAULT 1,
  email_verified          INTEGER NOT NULL DEFAULT 0,
  phone_verified          INTEGER NOT NULL DEFAULT 0,
  consented_at_ms         INTEGER,
  consent_purpose         TEXT,
  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL,
  UNIQUE(user_id, gym_id, trainer_user_id)
) STRICT;

CREATE INDEX idx_td_user ON trainer_disclosures(user_id);
CREATE INDEX idx_td_gym  ON trainer_disclosures(gym_id);

-- Backfill: one L1 disclosure per existing trainer_connection
INSERT OR IGNORE INTO trainer_disclosures (
  id, user_id, gym_id, trainer_user_id, level, display_name,
  share_training_history, share_checkins, share_pain_rpe, share_body_metrics, share_detailed_adherence,
  consented_at_ms, consent_purpose, created_at_ms, updated_at_ms
)
SELECT
  'td-' || tc.id                          AS id,
  tc.user_id                              AS user_id,
  tc.gym_id                               AS gym_id,
  NULL                                    AS trainer_user_id,
  'L1'                                    AS level,
  'User-' || upper(substr(tc.user_id, 1, 6)) AS display_name,
  0, 0, 1, 0, 1,
  tc.connected_at_ms                      AS consented_at_ms,
  'legacy-connection-grandfathered'       AS consent_purpose,
  tc.connected_at_ms                      AS created_at_ms,
  tc.connected_at_ms                      AS updated_at_ms
FROM trainer_connections tc
WHERE tc.gym_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM trainer_disclosures td
    WHERE td.user_id = tc.user_id AND td.gym_id = tc.gym_id AND td.trainer_user_id IS NULL
  );
