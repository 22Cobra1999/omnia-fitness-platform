-- Add is_paused to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE;
