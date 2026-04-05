-- Migration 0013: Add height_cm to user_profile for BMI calculation
ALTER TABLE user_profile ADD COLUMN height_cm REAL;
