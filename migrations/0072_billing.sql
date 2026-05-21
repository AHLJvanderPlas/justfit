-- Migration 0072: consumer billing — extend entitlements + billing_events

ALTER TABLE entitlements ADD COLUMN mollie_customer_id TEXT;
ALTER TABLE entitlements ADD COLUMN mollie_sub_id      TEXT;

CREATE TABLE billing_events (
  id           TEXT    PRIMARY KEY,
  user_id      TEXT    NOT NULL,
  event_type   TEXT    NOT NULL,  -- 'sub_created'|'payment_paid'|'payment_failed'|'sub_canceled'|'trial_started'
  product_code TEXT,
  mollie_id    TEXT,
  payload_json TEXT,
  created_at_ms INTEGER NOT NULL
) STRICT;
