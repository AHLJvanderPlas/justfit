-- migration 0075: Add token_invalidated_at_ms to users table for JWT invalidation after password reset
ALTER TABLE users ADD COLUMN token_invalidated_at_ms INTEGER DEFAULT NULL;
