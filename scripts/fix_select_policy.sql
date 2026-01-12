-- Fix SELECT Policy for Clients
-- The previous SELECT policy relied on 'calendar_event_participants', which doesn't exist at the moment of INSERT RETURNING.
-- We must allow clients to SELECT rows where they are the 'client_id'.



-- Check if policy exists to avoid duplicates (though duplication is usually harmless for OR checks)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'calendar_events' 
        AND policyname = 'Clients can view their own events as client_id'
    ) THEN
        CREATE POLICY "Clients can view their own events as client_id"
        ON public.calendar_events
        FOR SELECT
        USING (auth.uid() = client_id);
    END IF;
END $$;



NOTIFY pgrst, 'reload schema';
