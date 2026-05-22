-- Migration 0074: trainer message per client (B1 — trainer-to-user messaging)
-- The trainer can write a short visible message per client (max 280 chars).
-- Shown prominently in the user app above today's session card; dismissable.

ALTER TABLE gym_memberships ADD COLUMN trainer_message TEXT;
ALTER TABLE gym_memberships ADD COLUMN trainer_message_sent_at_ms INTEGER;
