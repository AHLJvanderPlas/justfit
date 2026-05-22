-- Migration 0061: unique index on invoice_number
-- Prevents duplicate invoice numbers under concurrent requests.

CREATE UNIQUE INDEX IF NOT EXISTS idx_tbi_invoice_number
  ON trainer_billing_invoices(invoice_number);
