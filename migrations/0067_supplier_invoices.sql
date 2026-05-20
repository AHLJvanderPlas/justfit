-- Migration 0067: supplier_invoices table (P1H)

CREATE TABLE supplier_invoices (
  id                TEXT PRIMARY KEY,
  gym_id            TEXT NOT NULL REFERENCES gyms(id),
  supplier_name     TEXT NOT NULL,
  supplier_kvk      TEXT,
  supplier_vat      TEXT,
  invoice_date      TEXT NOT NULL,   -- YYYY-MM-DD
  invoice_number    TEXT,
  amount_ex_btw     REAL NOT NULL,
  btw_rate          REAL NOT NULL DEFAULT 0,  -- 0, 0.09, 0.21
  btw_amount        REAL NOT NULL DEFAULT 0,
  category          TEXT,             -- e.g. 'equipment', 'rent', 'marketing'
  attachment_r2_key TEXT,
  notes             TEXT,
  created_at_ms     INTEGER NOT NULL,
  updated_at_ms     INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_si_gym  ON supplier_invoices(gym_id, invoice_date);
