-- Allow clients to create calendar events (bookings)
-- This is necessary because the default policy "Coaches can create events" only checks (auth.uid() = coach_id)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'calendar_events' 
        AND policyname = 'Clients can create events'
    ) THEN
        CREATE POLICY "Clients can create events"
        ON public.calendar_events
        FOR INSERT
        WITH CHECK (auth.uid() = client_id);
    END IF;
END $$;
