ALTER TABLE gyms ADD COLUMN model TEXT NOT NULL DEFAULT 'staff';
ALTER TABLE gyms ADD COLUMN switch_auto_approve INTEGER NOT NULL DEFAULT 0;
ALTER TABLE gyms ADD COLUMN trainer_tab_config_json TEXT NOT NULL DEFAULT '{}';

ALTER TABLE gym_memberships ADD COLUMN show_in_client_app INTEGER NOT NULL DEFAULT 1;
ALTER TABLE gym_memberships ADD COLUMN team_view_opt_in INTEGER NOT NULL DEFAULT 0;
ALTER TABLE gym_memberships ADD COLUMN allow_trainer_switch INTEGER NOT NULL DEFAULT 1;
