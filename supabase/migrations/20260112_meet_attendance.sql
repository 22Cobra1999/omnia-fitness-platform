-- Add attendance tracking columns to calendar_event_participants
ALTER TABLE calendar_event_participants 
ADD COLUMN IF NOT EXISTS attendance_minutes INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_joined_at TIMESTAMP WITH TIME ZONE;
