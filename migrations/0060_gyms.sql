-- Migration 0060: gyms + gym_memberships tables (P1A)
-- Every trainer becomes a 1:1 gym with role='owner'.
-- owner_user_id references users(id); backfill finds the user whose auth email matches the trainer email.

CREATE TABLE gyms (
  id                  TEXT PRIMARY KEY,
  slug                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  type                TEXT NOT NULL DEFAULT 'solo' CHECK (type IN ('solo','studio','gym')),
  owner_user_id       TEXT NOT NULL REFERENCES users(id),
  subscription_tier   TEXT NOT NULL DEFAULT 'starter' CHECK (subscription_tier IN ('starter','pro','studio')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active','trialing','suspended','cancelled')),
  kvk_number          TEXT,
  vat_number          TEXT,
  iban                TEXT,
  address_json        TEXT,   -- {street, city, postal, country}
  branding_json       TEXT,   -- {logo_r2_key, primary_color} — Phase 3
  encryption_key_enc  TEXT NOT NULL,  -- AES-GCM wrapped key (envelope encryption)
  kor_active          INTEGER NOT NULL DEFAULT 0,
  dpa_acknowledged_at_ms INTEGER,
  dpa_version         TEXT,
  created_at_ms       INTEGER NOT NULL,
  updated_at_ms       INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_gyms_owner ON gyms(owner_user_id);
CREATE INDEX idx_gyms_slug  ON gyms(slug);

CREATE TABLE gym_memberships (
  id                TEXT PRIMARY KEY,
  gym_id            TEXT NOT NULL REFERENCES gyms(id),
  user_id           TEXT NOT NULL REFERENCES users(id),
  role              TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('owner','trainer','client')),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','suspended','removed')),
  invited_by_user_id TEXT,
  invited_at_ms     INTEGER,
  joined_at_ms      INTEGER,
  permissions_json  TEXT,
  created_at_ms     INTEGER NOT NULL,
  updated_at_ms     INTEGER NOT NULL,
  UNIQUE(gym_id, user_id)
) STRICT;

CREATE INDEX idx_gm_gym    ON gym_memberships(gym_id, status);
CREATE INDEX idx_gm_user   ON gym_memberships(user_id, status);

-- ── BACKFILL ─────────────────────────────────────────────────────────────────
-- For every trainer whose email matches a users row, create a gym + owner membership.
-- Trainers without a matching users row are skipped (they must link on first trainer-app login).

INSERT INTO gyms (id, slug, name, type, owner_user_id, subscription_tier, subscription_status,
                  kvk_number, vat_number, iban, address_json, encryption_key_enc,
                  created_at_ms, updated_at_ms)
SELECT
  'gym-' || t.id                         AS id,
  lower(replace(replace(replace(replace(
    COALESCE(t.studio_name, split_part(t.email, '@', 1)),
    ' ', '-'), '.', ''), '@', ''), '/', '')) || '-' || substr(t.id, 1, 6)  AS slug,
  COALESCE(t.studio_name, t.name || '''s Practice')  AS name,
  'solo'                                 AS type,
  u.id                                   AS owner_user_id,
  CASE WHEN t.plan = 'starter' THEN 'starter' WHEN t.plan = 'pro' THEN 'pro' ELSE 'starter' END AS subscription_tier,
  CASE WHEN t.status = 'active' THEN 'active' ELSE 'suspended' END AS subscription_status,
  t.invoice_vat_number                   AS kvk_number,
  t.invoice_vat_number                   AS vat_number,
  t.invoice_iban                         AS iban,
  json_object('street', t.invoice_address, 'country', t.country) AS address_json,
  -- Placeholder encryption key (real key generation happens in application layer on first access)
  'PENDING_KEY_GENERATION'               AS encryption_key_enc,
  t.created_at_ms                        AS created_at_ms,
  t.updated_at_ms                        AS updated_at_ms
FROM trainers t
INNER JOIN auth_users au ON lower(au.email) = lower(t.email)
INNER JOIN users u ON u.id = au.user_id
WHERE NOT EXISTS (SELECT 1 FROM gyms g WHERE g.id = 'gym-' || t.id);

INSERT INTO gym_memberships (id, gym_id, user_id, role, status, joined_at_ms, created_at_ms, updated_at_ms)
SELECT
  'gm-' || t.id                          AS id,
  'gym-' || t.id                         AS gym_id,
  u.id                                   AS user_id,
  'owner'                                AS role,
  'active'                               AS status,
  t.created_at_ms                        AS joined_at_ms,
  t.created_at_ms                        AS created_at_ms,
  t.updated_at_ms                        AS updated_at_ms
FROM trainers t
INNER JOIN auth_users au ON lower(au.email) = lower(t.email)
INNER JOIN users u ON u.id = au.user_id
WHERE EXISTS (SELECT 1 FROM gyms g WHERE g.id = 'gym-' || t.id)
  AND NOT EXISTS (SELECT 1 FROM gym_memberships gm WHERE gm.id = 'gm-' || t.id);

-- DOWN (hygiene only — not run in production):
-- DROP TABLE IF EXISTS gym_memberships;
-- DROP TABLE IF EXISTS gyms;
