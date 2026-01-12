-- Allow clients to create events where they are the client_id
DROP POLICY IF EXISTS "Clients can create their own events" ON public.calendar_events;

CREATE POLICY "Clients can create their own events"
    ON public.calendar_events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = client_id);

-- Also ensure they can see their own events (already exists but good to reinforce if missing)
-- The existing "Clients can view their own events" might be sufficient, but "Clients can view events they participate in" is also there.
-- The insert check ensures they can only create events for themselves.
