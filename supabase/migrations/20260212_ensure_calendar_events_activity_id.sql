-- Add activity_id to calendar_events if it does not exist
-- This fixes the error: "Could not find the 'activity_id' column of 'calendar_events'"

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'activity_id'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN activity_id BIGINT REFERENCES public.activities(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added activity_id column to calendar_events';
    ELSE
        RAISE NOTICE 'activity_id column already exists in calendar_events';
    END IF;
END $$;

-- Force schema cache reload to ensure PostgREST sees the new column immediately
NOTIFY pgrst, 'reload config';
