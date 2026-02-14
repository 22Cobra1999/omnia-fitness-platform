ALTER TABLE calendar_event_reschedule_requests 
ADD COLUMN IF NOT EXISTS requested_by_role text DEFAULT 'client' CHECK (requested_by_role IN ('client', 'coach'));

-- Update existing rows if any to have a default (optional but good)
UPDATE calendar_event_reschedule_requests SET requested_by_role = 'client' WHERE requested_by_role IS NULL;

NOTIFY pgrst, 'reload schema';
