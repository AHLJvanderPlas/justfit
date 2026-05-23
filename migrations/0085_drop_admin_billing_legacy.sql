-- Migration 0085: drop legacy admin billing tables
-- trainer_billing_invoices, trainer_plan_pricing, trainer_pricing_overrides were
-- a manual billing layer predating Mollie. Live billing state lives on gyms.sub_tier/
-- sub_status/sub_ends_at_ms. Admin billing.js is rewritten to query gyms directly.

DROP TABLE IF EXISTS trainer_billing_invoices;
DROP TABLE IF EXISTS trainer_plan_pricing;
DROP TABLE IF EXISTS trainer_pricing_overrides;
