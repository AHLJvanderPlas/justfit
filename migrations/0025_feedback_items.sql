-- Feedback triage: stores all /api/feedback submissions for dashboard review and classification.
CREATE TABLE IF NOT EXISTS feedback_items (
  id              TEXT PRIMARY KEY,
  user_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_email      TEXT,
  event_type      TEXT NOT NULL DEFAULT 'feedback',
  message         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'new'
                    CHECK(status IN ('new','discard','react','fix','roadmap','resolved')),
  flagged         INTEGER NOT NULL DEFAULT 0,
  created_at_ms   INTEGER NOT NULL,
  updated_at_ms   INTEGER NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_feedback_items_created ON feedback_items(created_at_ms DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_items_flagged ON feedback_items(flagged, created_at_ms ASC);
