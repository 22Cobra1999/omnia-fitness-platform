-- Fix RLS Policy for Client Events
-- Problem: The previous policy checked (auth.uid() = id), which is impossible because 'id' is the event ID.
-- Solution: Change the check to (auth.uid() = client_id).

BEGIN;

-- Drop the flawed policy
DROP POLICY IF EXISTS "Clients can create their own events" ON public.calendar_events;

-- Recreate it with the correct check
CREATE POLICY "Clients can create their own events"
ON public.calendar_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id);

COMMIT;

-- Just to be safe, reload schema cache again (though policy changes usually propagate well)
NOTIFY pgrst, 'reload schema';
