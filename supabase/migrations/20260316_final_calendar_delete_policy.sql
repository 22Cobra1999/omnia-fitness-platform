-- FINAL PERMISSION FIX: Ensure Coaches can DELETE their events
-- This migration re-asserts the DELETE policy for calendar_events 
-- to ensure that hard-deletion works when a meet is cancelled without confirmed guests.

DROP POLICY IF EXISTS "Users can delete own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Coaches can delete their own events" ON public.calendar_events;

CREATE POLICY "Coaches and Creators can delete events"
ON public.calendar_events
FOR DELETE
TO authenticated
USING (
    auth.uid() = coach_id OR
    auth.uid() = created_by_user_id
);

-- Also ensure they can UPDATE (needed for soft delete and other changes)
DROP POLICY IF EXISTS "Users can update own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Coaches can update their own events" ON public.calendar_events;

CREATE POLICY "Coaches and Creators can update events"
ON public.calendar_events
FOR UPDATE
TO authenticated
USING (
    auth.uid() = coach_id OR
    auth.uid() = created_by_user_id
)
WITH CHECK (
    auth.uid() = coach_id OR
    auth.uid() = created_by_user_id
);

-- Notify PostgREST to reload
NOTIFY pgrst, 'reload config';
