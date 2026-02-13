-- Fix: Make 'role' column in calendar_event_participants optional
-- or set a default value, as frontend is not sending it in some cases.
-- The error is: null value in column "role" of relation "calendar_event_participants" violates not-null constraint

-- 1. Check if the column exists and constraint can be altered
DO $$ 
BEGIN
    -- Only alter if table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'calendar_event_participants'
    ) THEN
        -- Make 'role' column nullable effectively removing the NOT NULL constraint if it exists
        ALTER TABLE public.calendar_event_participants 
        ALTER COLUMN role DROP NOT NULL;
        
        -- Also, let's set a default value just in case
        ALTER TABLE public.calendar_event_participants 
        ALTER COLUMN role SET DEFAULT 'client';
    END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload config';
