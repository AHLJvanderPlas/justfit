-- Migration 0094: Recreate trainer_invoices with clean DDL
-- Problem: original DDL has REFERENCES trainers(id) — trainers table was dropped in schema
-- consolidation (migration 0086). D1 doesn't enforce FKs so no crash, but schema is wrong.
-- Table has 0 rows, so DROP + CREATE is safe.
-- Changes:
--   - trainer_id FK fixed: now REFERENCES users(id) (it stores the gym owner's user ID)
--   - gym_id_ref FK wired to gyms(id) (was untyped TEXT in ALTER TABLE form)
--   - Dropped stale gym_id column (duplicate of gym_id_ref, never queried)
--   - Dropped pdf_key and subscription_id (never queried anywhere in codebase)
--   - All ALTER TABLE additions inlined into clean single CREATE TABLE

DROP TABLE IF EXISTS trainer_invoices;

CREATE TABLE trainer_invoices (
  id                      TEXT    PRIMARY KEY,
  trainer_id              TEXT    NOT NULL REFERENCES users(id),          -- gym owner user ID
  user_id                 TEXT    NOT NULL REFERENCES users(id),          -- client user ID
  gym_id_ref              TEXT    NOT NULL REFERENCES gyms(id),           -- the gym
  invoice_number          TEXT    NOT NULL,
  invoice_number_assigned TEXT,                                           -- final number after send
  status                  TEXT    NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','sent','paid','overdue','void')),
  invoice_date            TEXT    NOT NULL,                               -- YYYY-MM-DD
  due_date                TEXT,                                           -- YYYY-MM-DD
  currency                TEXT    NOT NULL DEFAULT 'EUR',
  lines_json              TEXT    NOT NULL,                               -- [{description,quantity,unit_price,vat_rate,line_total}]
  btw_lines_json          TEXT,                                           -- computed VAT breakdown
  subtotal                REAL    NOT NULL,
  vat_amount              REAL    NOT NULL,
  total                   REAL    NOT NULL,
  notes                   TEXT,
  payment_terms_days      INTEGER NOT NULL DEFAULT 14,
  mollie_payment_id       TEXT,
  mollie_payment_url      TEXT,
  sent_at_ms              INTEGER,
  paid_at_ms              INTEGER,
  voided_at_ms            INTEGER,
  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_trainer_invoices_gym ON trainer_invoices(gym_id_ref, created_at_ms DESC);
CREATE INDEX idx_trainer_invoices_user ON trainer_invoices(user_id);
CREATE INDEX idx_trainer_invoices_mollie ON trainer_invoices(mollie_payment_id) WHERE mollie_payment_id IS NOT NULL;
