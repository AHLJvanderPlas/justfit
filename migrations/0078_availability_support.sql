ALTER TABLE gym_memberships ADD COLUMN availability_status TEXT NOT NULL DEFAULT 'offline';
ALTER TABLE gym_memberships ADD COLUMN availability_updated_at_ms INTEGER;

CREATE TABLE support_requests (
  id                     TEXT PRIMARY KEY,
  gym_id                 TEXT NOT NULL,
  client_user_id         TEXT NOT NULL,
  message                TEXT NOT NULL,
  broadcast              INTEGER NOT NULL DEFAULT 0,
  status                 TEXT NOT NULL DEFAULT 'open',
  accepted_by_user_id    TEXT,
  reply_message          TEXT,
  created_at_ms          INTEGER NOT NULL,
  accepted_at_ms         INTEGER,
  resolved_at_ms         INTEGER
);

CREATE INDEX idx_support_requests_gym_status ON support_requests(gym_id, status);
CREATE INDEX idx_support_requests_client ON support_requests(client_user_id, status);
