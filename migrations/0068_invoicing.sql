-- Migration 0068: invoicing enhancements (P1G)
-- Invoice counters, subscription plans, client subscriptions.
-- Also extends trainer_invoices with NL compliance + Mollie fields.

CREATE TABLE invoice_counters (
  gym_id      TEXT NOT NULL,
  year        INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (gym_id, year)
) STRICT;

CREATE TABLE subscription_plans (
  id                  TEXT PRIMARY KEY,
  gym_id              TEXT NOT NULL REFERENCES gyms(id),
  name                TEXT NOT NULL,
  amount              REAL NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'EUR',
  interval            TEXT NOT NULL CHECK (interval IN ('monthly','quarterly','yearly')),
  default_lines_json  TEXT,    -- [{description, unit_price, btw_rate}]
  is_active           INTEGER NOT NULL DEFAULT 1,
  created_at_ms       INTEGER NOT NULL,
  updated_at_ms       INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_sp_gym ON subscription_plans(gym_id, is_active);

CREATE TABLE client_subscriptions (
  id                     TEXT PRIMARY KEY,
  gym_id                 TEXT NOT NULL REFERENCES gyms(id),
  plan_id                TEXT NOT NULL REFERENCES subscription_plans(id),
  client_user_id         TEXT NOT NULL REFERENCES users(id),
  mollie_subscription_id TEXT,
  mollie_customer_id     TEXT,
  status                 TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','paused','cancelled')),
  started_at_ms          INTEGER NOT NULL,
  next_invoice_at_ms     INTEGER,
  created_at_ms          INTEGER NOT NULL,
  updated_at_ms          INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_cs_gym    ON client_subscriptions(gym_id, status);
CREATE INDEX idx_cs_client ON client_subscriptions(client_user_id);
CREATE INDEX idx_cs_next   ON client_subscriptions(next_invoice_at_ms) WHERE status = 'active';

-- Extend trainer_invoices for NL compliance
ALTER TABLE trainer_invoices ADD COLUMN invoice_number_assigned TEXT;
ALTER TABLE trainer_invoices ADD COLUMN btw_lines_json           TEXT;   -- [{btw_rate, btw_amount}] per BTW rate
ALTER TABLE trainer_invoices ADD COLUMN gym_id_ref               TEXT;   -- denormalized from trainer gym
ALTER TABLE trainer_invoices ADD COLUMN mollie_payment_id        TEXT;
ALTER TABLE trainer_invoices ADD COLUMN mollie_payment_url       TEXT;
ALTER TABLE trainer_invoices ADD COLUMN payment_terms_days       INTEGER DEFAULT 14;
ALTER TABLE trainer_invoices ADD COLUMN subscription_id          TEXT;   -- FK client_subscriptions
