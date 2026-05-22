CREATE TABLE trainer_switch_requests (
  id                       TEXT PRIMARY KEY,
  gym_id                   TEXT NOT NULL,
  client_user_id           TEXT NOT NULL,
  from_trainer_user_id     TEXT,
  to_trainer_user_id       TEXT NOT NULL,
  initiated_by             TEXT NOT NULL DEFAULT 'client',
  client_message           TEXT,
  status                   TEXT NOT NULL DEFAULT 'pending',
  decided_by_user_id       TEXT,
  decline_reason           TEXT,
  created_at_ms            INTEGER NOT NULL,
  decided_at_ms            INTEGER
);

CREATE INDEX idx_switch_requests_gym ON trainer_switch_requests(gym_id, status);
CREATE INDEX idx_switch_requests_client ON trainer_switch_requests(client_user_id, status);

ALTER TABLE gym_memberships ADD COLUMN support_trainer_user_id TEXT;
