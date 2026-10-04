-- 0121 — widen entitlements.source so the writers that exist can actually write.
--
-- The CHECK was written for Stripe: ('stripe','apple','google','voucher','manual',
-- 'referral','other','trial'). The product moved to Mollie and nobody widened it.
-- Four live writers use values it rejects:
--   webhooks/mollie-consumer.js   source = 'mollie_sub'    (first payment, 5 sites)
--   connect.js                    source = 'trainer_grant' (B2B2C Pro on gym connect)
--   justfit-trainer b2b2c.js      source = 'trainer_grant'
--   admin portal grant_pro        source = 'manual_grant'
-- The table is STRICT, so a rejected INSERT throws: a paying customer is charged
-- and receives no entitlement, and the webhook returns an error to Mollie. The live
-- table holds only trial rows (8 manual, 13 trial), which is consistent with that.
--
-- Rebuild per the 0100 pattern: create, copy, assert count, drop, rename, re-index.
-- D1 runs a --file atomically (verified on local D1 2026-10-04): a failed assertion
-- rolls the whole file back. Expected copy: 21 rows at authoring time; the assertion
-- compares live counts, not this number.

CREATE TABLE entitlements_new (
  id           TEXT    PRIMARY KEY,
  user_id      TEXT    NOT NULL,
  product_code TEXT    NOT NULL,
  source       TEXT    NOT NULL DEFAULT 'manual'
                 CHECK (source IN ('stripe','apple','google','voucher','manual','referral','other','trial',
                                   'mollie_sub','trainer_grant','manual_grant')),
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

INSERT INTO entitlements_new SELECT * FROM entitlements;

CREATE TABLE _0121_assert (ok INTEGER NOT NULL CHECK (ok = 1)) STRICT;
INSERT INTO _0121_assert (ok)
  SELECT CASE WHEN (SELECT COUNT(*) FROM entitlements_new) = (SELECT COUNT(*) FROM entitlements) THEN 1 ELSE 0 END;
DROP TABLE _0121_assert;

DROP TABLE entitlements;
ALTER TABLE entitlements_new RENAME TO entitlements;
CREATE UNIQUE INDEX idx_entitlements_user_source_product
  ON entitlements (user_id, source, product_code);
