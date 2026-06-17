-- Migration 0092: add 'trial' to entitlements.source CHECK constraint.
-- handleSignup (functions/api/auth.js) inserts source='trial' for the 14-day
-- pro_trial entitlement granted on signup, but the source CHECK never allowed
-- 'trial' — every signup has been failing with SQLITE_CONSTRAINT.
-- SQLite CHECK constraints require a table rebuild to change.

CREATE TABLE entitlements_new (
  id           TEXT    PRIMARY KEY,
  user_id      TEXT    NOT NULL,
  product_code TEXT    NOT NULL,
  source       TEXT    NOT NULL DEFAULT 'manual'
                 CHECK (source IN ('stripe','apple','google','voucher','manual','referral','other','trial')),
  status       TEXT    NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','trialing','grace','canceled','expired')),
  starts_at_ms INTEGER NOT NULL,
  ends_at_ms   INTEGER,
  renews_at_ms INTEGER,
  external_ref TEXT,
  meta_json    TEXT,
  mollie_customer_id TEXT,
  mollie_sub_id      TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (length(product_code) <= 128),
  CHECK (external_ref IS NULL OR length(external_ref) <= 256),
  CHECK (meta_json IS NULL OR json_valid(meta_json))
) STRICT;

INSERT INTO entitlements_new
  (id, user_id, product_code, source, status, starts_at_ms, ends_at_ms, renews_at_ms, external_ref, meta_json, mollie_customer_id, mollie_sub_id, created_at_ms, updated_at_ms)
SELECT
  id, user_id, product_code, source, status, starts_at_ms, ends_at_ms, renews_at_ms, external_ref, meta_json, mollie_customer_id, mollie_sub_id, created_at_ms, updated_at_ms
FROM entitlements;

DROP TABLE entitlements;
ALTER TABLE entitlements_new RENAME TO entitlements;

CREATE UNIQUE INDEX IF NOT EXISTS idx_entitlements_user_source_product
  ON entitlements (user_id, source, product_code);
