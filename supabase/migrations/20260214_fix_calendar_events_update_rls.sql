-- Allow clients to update events where they are the creator
-- This is necessary for rescheduling events that haven't been accepted by the coach yet.

DROP POLICY IF EXISTS "Users can update events they created" ON public.calendar_events;

CREATE POLICY "Users can update events they created"
ON public.calendar_events
FOR UPDATE
TO authenticated
USING (
    auth.uid() = created_by_user_id
)
WITH CHECK (
    auth.uid() = created_by_user_id
);

-- Note: We only allow update if the user IS the creator. 
-- Coaches update events via participants table (rsvp) or have their own policies.
