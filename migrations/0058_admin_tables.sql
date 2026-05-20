-- Migration 0058: Admin portal tables
-- Depends on 0057_trainer_tables.sql (trainers table must exist)

-- Admin users (JustFit owner team — separate namespace from end users and trainers)
CREATE TABLE admin_justfit_users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          TEXT DEFAULT 'admin',   -- admin | viewer
  password_hash TEXT,                   -- salt:hash (SHA-256 with JWT_SECRET pepper)
  is_active     INTEGER DEFAULT 1,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
) STRICT;

-- Admin sessions
CREATE TABLE admin_justfit_sessions (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES admin_justfit_users(id),
  created_at_ms       INTEGER NOT NULL,
  last_accessed_at_ms INTEGER NOT NULL,
  expires_at_ms       INTEGER NOT NULL,
  ip                  TEXT,
  user_agent          TEXT
) STRICT;

CREATE INDEX idx_ajs_user ON admin_justfit_sessions(user_id);
CREATE INDEX idx_ajs_expires ON admin_justfit_sessions(expires_at_ms);

-- Trainer billing invoices (JustFit → trainer, for licence fees)
CREATE TABLE trainer_billing_invoices (
  id             TEXT PRIMARY KEY,
  trainer_id     TEXT NOT NULL REFERENCES trainers(id),
  invoice_number TEXT NOT NULL,
  status         TEXT DEFAULT 'draft',   -- draft | sent | paid | overdue | void
  period         TEXT NOT NULL,          -- e.g. 2026-M05
  period_start   TEXT NOT NULL,          -- YYYY-MM-DD
  period_end     TEXT NOT NULL,          -- YYYY-MM-DD
  plan           TEXT NOT NULL,          -- starter | pro | studio
  amount         REAL NOT NULL,
  currency       TEXT DEFAULT 'EUR',
  invoice_date   TEXT NOT NULL,          -- YYYY-MM-DD
  due_date       TEXT,                   -- YYYY-MM-DD
  pdf_key        TEXT,
  notes          TEXT,
  sent_at_ms     INTEGER,
  paid_at_ms     INTEGER,
  voided_at_ms   INTEGER,
  created_at_ms  INTEGER NOT NULL,
  updated_at_ms  INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_tbi_trainer ON trainer_billing_invoices(trainer_id, status);
CREATE INDEX idx_tbi_status  ON trainer_billing_invoices(status, due_date);

-- Standard plan pricing (effective_from allows price changes over time)
CREATE TABLE trainer_plan_pricing (
  id              TEXT PRIMARY KEY,
  plan            TEXT NOT NULL,          -- starter | pro | studio
  price_monthly   REAL NOT NULL,
  currency        TEXT DEFAULT 'EUR',
  effective_from  TEXT NOT NULL,          -- YYYY-MM-DD
  is_active       INTEGER DEFAULT 1,
  notes           TEXT,
  created_at_ms   INTEGER NOT NULL
) STRICT;

-- Per-trainer pricing overrides (agreed custom pricing)
CREATE TABLE trainer_pricing_overrides (
  id              TEXT PRIMARY KEY,
  trainer_id      TEXT NOT NULL REFERENCES trainers(id),
  price_monthly   REAL NOT NULL,
  currency        TEXT DEFAULT 'EUR',
  effective_from  TEXT NOT NULL,
  is_active       INTEGER DEFAULT 1,
  notes           TEXT,
  created_at_ms   INTEGER NOT NULL
) STRICT;

-- Admin audit log
CREATE TABLE admin_justfit_audit (
  id          TEXT PRIMARY KEY,
  actor_id    TEXT REFERENCES admin_justfit_users(id),
  action      TEXT NOT NULL,   -- trainer.approve, trainer.suspend, plan.change, user.delete …
  target_type TEXT,            -- trainer | user | invoice | exercise
  target_id   TEXT,
  payload     TEXT,            -- JSON
  created_at_ms INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_aja_actor  ON admin_justfit_audit(actor_id, created_at_ms);
CREATE INDEX idx_aja_target ON admin_justfit_audit(target_type, target_id);

-- Seed default plan pricing
INSERT INTO trainer_plan_pricing (id, plan, price_monthly, currency, effective_from, is_active, notes, created_at_ms)
VALUES
  (lower(hex(randomblob(16))), 'starter', 29.00, 'EUR', '2026-01-01', 1, 'Up to 5 active clients', unixepoch('now') * 1000),
  (lower(hex(randomblob(16))), 'pro',     59.00, 'EUR', '2026-01-01', 1, 'Up to 25 active clients', unixepoch('now') * 1000),
  (lower(hex(randomblob(16))), 'studio',  99.00, 'EUR', '2026-01-01', 1, 'Unlimited clients', unixepoch('now') * 1000);
