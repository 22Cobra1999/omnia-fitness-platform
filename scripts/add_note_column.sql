ALTER TABLE calendar_event_reschedule_requests 
ADD COLUMN IF NOT EXISTS note text;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
