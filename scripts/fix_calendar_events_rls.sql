-- FIX CALENDAR EVENTS RLS (Recursive Loop) - ROBUST V3
-- This script fixes the 500 Internal Server Error caused by infinite recursion between 
-- 'calendar_events' and 'calendar_event_participants'.
-- It uses TWO SECURITY DEFINER functions to break the RLS chain in both directions.

BEGIN;

-- 1. Helper: Check if user is the client in a participant row (SECURITY DEFINER to bypass RLS)
-- Breaks recursion: calendar_events -> is_calendar_participant -> calendar_event_participants (NO RLS)
CREATE OR REPLACE FUNCTION public.is_calendar_participant(check_event_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Confirmed column is 'client_id' based on codebase usage
  RETURN EXISTS (
    SELECT 1 
    FROM calendar_event_participants 
    WHERE event_id = check_event_id 
    AND client_id = check_user_id
  );
END;
$$;

-- 2. Helper: Check if user is the coach of an event (SECURITY DEFINER to bypass RLS)
-- Breaks recursion: calendar_event_participants -> is_event_owner -> calendar_events (NO RLS)
CREATE OR REPLACE FUNCTION public.is_event_owner(check_event_id uuid, check_coach_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM calendar_events 
    WHERE id = check_event_id 
    AND coach_id = check_coach_id
  );
END;
$$;

-- 3. CALENDAR_EVENTS Policies
DROP POLICY IF EXISTS "Coach can view own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Client can view own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Participants can view events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can view open/public events" ON public.calendar_events;

-- A. Coach View (Owner)
CREATE POLICY "Coach can view own events"
ON public.calendar_events
FOR SELECT
TO authenticated
USING ( coach_id = auth.uid() );

-- B. Client View (Direct Assignment)
CREATE POLICY "Client can view own events"
ON public.calendar_events
FOR SELECT
TO authenticated
USING ( client_id = auth.uid() );

-- C. Participant View (Uses SD Function -> Breaks Recursion)
CREATE POLICY "Participants can view events"
ON public.calendar_events
FOR SELECT
TO authenticated
USING ( is_calendar_participant(id, auth.uid()) );

-- D. Public/Open Events
CREATE POLICY "Users can view open events"
ON public.calendar_events
FOR SELECT
TO authenticated
USING ( is_free = true OR status = 'open' );


-- 4. CALENDAR_EVENT_PARTICIPANTS Policies
DROP POLICY IF EXISTS "User can view own participation" ON public.calendar_event_participants;
DROP POLICY IF EXISTS "Coach can view participants of their events" ON public.calendar_event_participants;

-- A. Own Participation
CREATE POLICY "User can view own participation"
ON public.calendar_event_participants
FOR SELECT
TO authenticated
USING ( client_id = auth.uid() );

-- B. Coach View (Uses SD Function -> Breaks Recursion)
CREATE POLICY "Coach can view participants of their events"
ON public.calendar_event_participants
FOR SELECT
TO authenticated
USING ( is_event_owner(event_id, auth.uid()) );

COMMIT;

-- Notify
NOTIFY pgrst, 'reload schema';
