-- Migration 0070: trainer_invites table for email invite flow
CREATE TABLE trainer_invites (
  id           TEXT PRIMARY KEY,
  gym_id       TEXT NOT NULL REFERENCES gyms(id),
  email        TEXT NOT NULL,
  invite_token TEXT NOT NULL UNIQUE,
  user_id      TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL
) STRICT;
CREATE INDEX idx_trainer_invites_token ON trainer_invites(invite_token);
CREATE INDEX idx_trainer_invites_email ON trainer_invites(email);
