-- FIX CALENDAR EVENTS INSERT POLICIES
-- This script adds the missing INSERT and UPDATE policies that were lost in previous cleanups.
-- It ensures that:
-- 1. Clients can book meetings (INSERT into calendar_events where client_id = auth.uid())
-- 2. Coaches can create events (INSERT into calendar_events where coach_id = auth.uid())
-- 3. Clients can join as participants (INSERT into calendar_event_participants)

BEGIN;

-- =========================================================================
-- 1. CALENDAR_EVENTS INSERT POLICIES
-- =========================================================================

-- Drop to ensure no conflicts (though they likely don't exist given the error)
DROP POLICY IF EXISTS "Coach can insert own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Client can insert own events" ON public.calendar_events;

-- A. Coach Insert
CREATE POLICY "Coach can insert own events"
ON public.calendar_events
FOR INSERT
TO authenticated
WITH CHECK ( coach_id = auth.uid() );

-- B. Client Insert (Bookings)
CREATE POLICY "Client can insert own events"
ON public.calendar_events
FOR INSERT
TO authenticated
WITH CHECK ( client_id = auth.uid() );


-- =========================================================================
-- 2. CALENDAR_EVENTS UPDATE POLICIES
-- =========================================================================

DROP POLICY IF EXISTS "Coach can update own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Client can update own events" ON public.calendar_events;

-- A. Coach Update
CREATE POLICY "Coach can update own events"
ON public.calendar_events
FOR UPDATE
TO authenticated
USING ( coach_id = auth.uid() )
WITH CHECK ( coach_id = auth.uid() );

-- B. Client Update (Reschedule/Cancel)
CREATE POLICY "Client can update own events"
ON public.calendar_events
FOR UPDATE
TO authenticated
USING ( client_id = auth.uid() )
WITH CHECK ( client_id = auth.uid() );


-- =========================================================================
-- 3. CALENDAR_EVENTS DELETE POLICIES
-- =========================================================================

DROP POLICY IF EXISTS "Coach can delete own events" ON public.calendar_events;

-- Coaches might need to delete events (though soft delete/cancel is preferred)
CREATE POLICY "Coach can delete own events"
ON public.calendar_events
FOR DELETE
TO authenticated
USING ( coach_id = auth.uid() );


-- =========================================================================
-- 4. CALENDAR_EVENT_PARTICIPANTS POLICIES
-- =========================================================================

DROP POLICY IF EXISTS "User can insert own participation" ON public.calendar_event_participants;
DROP POLICY IF EXISTS "User can update own participation" ON public.calendar_event_participants;

-- A. Insert (Join/Book)
CREATE POLICY "User can insert own participation"
ON public.calendar_event_participants
FOR INSERT
TO authenticated
WITH CHECK ( client_id = auth.uid() );

-- B. Update (Change RSVP)
CREATE POLICY "User can update own participation"
ON public.calendar_event_participants
FOR UPDATE
TO authenticated
USING ( client_id = auth.uid() )
WITH CHECK ( client_id = auth.uid() );

COMMIT;

-- Notify Supabase
NOTIFY pgrst, 'reload schema';
