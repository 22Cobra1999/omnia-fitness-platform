-- Fix RLS: Allow clients to insert calendar events
-- The frontend inserts events with 'created_by_user_id' matching the authenticated user.
-- We need a policy to permit this.

-- 1. Ensure created_by_user_id column exists (safeguard)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'calendar_events' 
        AND column_name = 'created_by_user_id'
    ) THEN
        ALTER TABLE public.calendar_events 
        ADD COLUMN created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Create/Replace RLS Policy for Insert
DROP POLICY IF EXISTS "Users can create their own events" ON public.calendar_events;

CREATE POLICY "Users can create their own events"
ON public.calendar_events
FOR INSERT
WITH CHECK (
    auth.uid() = created_by_user_id
);

-- 3. Also allow them to SELECT events they created (so they get the ID back)
DROP POLICY IF EXISTS "Users can view events they created" ON public.calendar_events;

CREATE POLICY "Users can view events they created"
ON public.calendar_events
FOR SELECT
USING (
    auth.uid() = created_by_user_id
);

-- 4. Enable RLS (idempotent)
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Reload config
NOTIFY pgrst, 'reload config';
