-- 0072: trainer portal billing — subscription columns on gyms + entitlements unique index
-- Apply each statement separately if --file fails with CF auth error (use --command)

ALTER TABLE gyms ADD COLUMN sub_status TEXT NOT NULL DEFAULT 'trialing'
  CHECK (sub_status IN ('trialing','active','grace','canceled','expired'));

ALTER TABLE gyms ADD COLUMN sub_tier TEXT NOT NULL DEFAULT 'starter'
  CHECK (sub_tier IN ('starter','pro','gym'));

ALTER TABLE gyms ADD COLUMN sub_source TEXT;

ALTER TABLE gyms ADD COLUMN sub_starts_at_ms INTEGER;

ALTER TABLE gyms ADD COLUMN sub_ends_at_ms INTEGER;

ALTER TABLE gyms ADD COLUMN mollie_customer_id TEXT;

ALTER TABLE gyms ADD COLUMN mollie_sub_id TEXT;

-- Back-fill existing gyms: 30-day trial starting from their creation date
UPDATE gyms
SET sub_starts_at_ms = created_at_ms,
    sub_ends_at_ms   = created_at_ms + (30 * 86400000)
WHERE sub_starts_at_ms IS NULL;

-- Unique index for ON CONFLICT in grantClientEntitlements
CREATE UNIQUE INDEX IF NOT EXISTS idx_entitlements_user_source_product
  ON entitlements (user_id, source, product_code);
