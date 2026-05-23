-- Migration 0086: drop old trainer model tables
-- trainers and trainer_connections were the pre-gym model (migration 0057).
-- All admin portal code now queries gyms/gym_memberships instead.
-- Migrations 0082–0085 dropped all other tables that referenced these models.

DROP TABLE IF EXISTS trainers;
DROP TABLE IF EXISTS trainer_connections;
